package collector

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type DockerContainer struct {
	ID      string   `json:"id"`
	Names   []string `json:"names"`
	Image   string   `json:"image"`
	Command string   `json:"command"`
	State   string   `json:"state"`   // "running", "exited", etc.
	Status  string   `json:"status"`  // "Up 2 hours", etc.
	Created int64    `json:"created"`
	Ports   []struct {
		IP          string `json:"IP,omitempty"`
		PrivatePort int    `json:"PrivatePort"`
		PublicPort  int    `json:"PublicPort,omitempty"`
		Type        string `json:"Type"`
	} `json:"ports"`
}

type DockerClient struct {
	client *http.Client
}

func NewDockerClient() *DockerClient {
	transport := &http.Transport{
		DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
			return net.Dial("unix", "/var/run/docker.sock")
		},
	}
	return &DockerClient{
		client: &http.Client{
			Transport: transport,
			Timeout:   15 * time.Second,
		},
	}
}

func (d *DockerClient) ListContainers(ctx context.Context) ([]DockerContainer, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "http://localhost/containers/json?all=1", nil)
	if err != nil {
		return nil, err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("docker API returned %d: %s", resp.StatusCode, string(body))
	}

	var containers []DockerContainer
	if err := json.NewDecoder(resp.Body).Decode(&containers); err != nil {
		return nil, err
	}

	// Clean up container names (strip leading '/')
	for i := range containers {
		for j, name := range containers[i].Names {
			containers[i].Names[j] = strings.TrimPrefix(name, "/")
		}
	}

	return containers, nil
}

func (d *DockerClient) GetContainerLogs(ctx context.Context, containerID string, tail int) (string, error) {
	if tail <= 0 {
		tail = 100
	}
	url := fmt.Sprintf("http://localhost/containers/%s/logs?stdout=1&stderr=1&tail=%d&timestamps=1", containerID, tail)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("docker logs error %d: %s", resp.StatusCode, string(body))
	}

	// Docker demultiplexes stdout/stderr with 8-byte frame header
	// header: [1 byte stream type, 3 bytes padding, 4 bytes big-endian length]
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var output bytes.Buffer
	reader := bytes.NewReader(raw)
	hdr := make([]byte, 8)

	for {
		_, err := io.ReadFull(reader, hdr)
		if err != nil {
			break
		}
		frameSize := binary.BigEndian.Uint32(hdr[4:8])
		if frameSize == 0 {
			continue
		}
		frame := make([]byte, frameSize)
		_, err = io.ReadFull(reader, frame)
		if err != nil {
			output.Write(frame)
			break
		}
		output.Write(frame)
	}

	// If header parsing yielded nothing (e.g. raw TTY mode), fallback to raw string
	if output.Len() == 0 && len(raw) > 0 {
		return string(raw), nil
	}

	return output.String(), nil
}

func (d *DockerClient) RestartContainer(ctx context.Context, containerID string) error {
	url := fmt.Sprintf("http://localhost/containers/%s/restart?t=10", containerID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return err
	}

	resp, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to restart container %s (status %d): %s", containerID, resp.StatusCode, string(body))
	}
	return nil
}
