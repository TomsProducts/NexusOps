package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Config struct {
	ServerURL       string   `json:"server_url"`
	EnrollmentToken string   `json:"enrollment_token,omitempty"`
	AgentID         string   `json:"agent_id"`
	AgentToken      string   `json:"agent_token"`
	Hostname        string   `json:"hostname"`
	DisplayName     string   `json:"display_name"`
	IPAddress       string   `json:"ip_address"`
	IntervalSec     int      `json:"interval_sec"`
	HeartbeatSec    int      `json:"heartbeat_sec"`
	AllowActions    bool     `json:"allow_actions"`
	AllowedServices []string `json:"allowed_services"`
}

const DefaultConfigPath = "/etc/nexusops/agent.json"

func LoadConfig(path string) (*Config, error) {
	cfg := &Config{
		ServerURL:       "http://localhost:8080/api",
		IntervalSec:     15,
		HeartbeatSec:    30,
		AllowActions:    true,
		AllowedServices: []string{"nginx", "mariadb", "mysql", "postgresql", "docker", "redis"},
	}

	if h, err := os.Hostname(); err == nil {
		cfg.Hostname = h
		cfg.DisplayName = h
	}

	// Environment overrides
	if u := os.Getenv("NEXUSOPS_SERVER_URL"); u != "" {
		cfg.ServerURL = u
	}
	if t := os.Getenv("NEXUSOPS_ENROLLMENT_TOKEN"); t != "" {
		cfg.EnrollmentToken = t
	}
	if id := os.Getenv("NEXUSOPS_AGENT_ID"); id != "" {
		cfg.AgentID = id
	}
	if tok := os.Getenv("NEXUSOPS_AGENT_TOKEN"); tok != "" {
		cfg.AgentToken = tok
	}
	if hn := os.Getenv("NEXUSOPS_HOSTNAME"); hn != "" {
		cfg.Hostname = hn
	}
	if dn := os.Getenv("NEXUSOPS_DISPLAY_NAME"); dn != "" {
		cfg.DisplayName = dn
	}
	if ip := os.Getenv("NEXUSOPS_IP_ADDRESS"); ip != "" {
		cfg.IPAddress = ip
	}

	// File check
	if path == "" {
		path = DefaultConfigPath
	}
	data, err := os.ReadFile(path)
	if err == nil {
		_ = json.Unmarshal(data, cfg)
	}

	return cfg, nil
}

func SaveConfig(path string, cfg *Config) error {
	if path == "" {
		path = DefaultConfigPath
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}
