package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"nexusops/agent/collector"
	"nexusops/agent/executor"
	"time"
)

type APIClient struct {
	serverURL  string
	agentID    string
	agentToken string
	httpClient *http.Client
}

type EnrollRequest struct {
	EnrollmentToken string `json:"enrollment_token"`
	Hostname        string `json:"hostname"`
	DisplayName     string `json:"display_name"`
	IPAddress       string `json:"ip_address"`
	OSName          string `json:"os_name"`
	OSVersion       string `json:"os_version"`
	AgentVersion    string `json:"agent_version"`
}

type EnrollResponse struct {
	AgentID    string `json:"agent_id"`
	AgentToken string `json:"agent_token"`
	ServerID   string `json:"server_id"`
	OrgID      string `json:"organization_id"`
}

func NewAPIClient(serverURL, agentID, agentToken string) *APIClient {
	return &APIClient{
		serverURL:  serverURL,
		agentID:    agentID,
		agentToken: agentToken,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *APIClient) Enroll(req *EnrollRequest) (*EnrollResponse, error) {
	url := fmt.Sprintf("%s/agent/enroll", c.serverURL)
	body, _ := json.Marshal(req)

	resp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		raw, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("enrollment failed with status %d: %s", resp.StatusCode, string(raw))
	}

	var res EnrollResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	c.agentID = res.AgentID
	c.agentToken = res.AgentToken
	return &res, nil
}

func (c *APIClient) SendHeartbeat() error {
	url := fmt.Sprintf("%s/agent/heartbeat", c.serverURL)
	payload := map[string]string{
		"agent_id": c.agentID,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-ID", c.agentID)
	req.Header.Set("X-Agent-Token", c.agentToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("heartbeat returned status %d", resp.StatusCode)
	}
	return nil
}

func (c *APIClient) SendMetrics(metrics *collector.SystemMetrics) error {
	url := fmt.Sprintf("%s/agent/metrics", c.serverURL)
	body, _ := json.Marshal(metrics)

	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-ID", c.agentID)
	req.Header.Set("X-Agent-Token", c.agentToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("send metrics returned status %d", resp.StatusCode)
	}
	return nil
}

func (c *APIClient) PollPendingAction() (*executor.ActionRequest, error) {
	url := fmt.Sprintf("%s/agent/actions/pending", c.serverURL)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("X-Agent-ID", c.agentID)
	req.Header.Set("X-Agent-Token", c.agentToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		return nil, nil // No pending actions
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("poll actions returned status %d", resp.StatusCode)
	}

	var action executor.ActionRequest
	if err := json.NewDecoder(resp.Body).Decode(&action); err != nil {
		return nil, err
	}
	return &action, nil
}

func (c *APIClient) SendActionResult(res *executor.ActionResult) error {
	url := fmt.Sprintf("%s/agent/action-result", c.serverURL)
	body, _ := json.Marshal(res)

	req, _ := http.NewRequest("POST", url, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-ID", c.agentID)
	req.Header.Set("X-Agent-Token", c.agentToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("send action result returned status %d", resp.StatusCode)
	}
	return nil
}
