package main

import (
	"flag"
	"log"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"nexusops/agent/client"
	"nexusops/agent/collector"
	"nexusops/agent/config"
	"nexusops/agent/executor"
)

const AgentVersion = "1.8.2"

func detectOS() (string, string) {
	data, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return "Linux", "Ubuntu"
	}
	var name, version string
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "NAME=") {
			name = strings.Trim(strings.TrimPrefix(line, "NAME="), "\"")
		} else if strings.HasPrefix(line, "VERSION_ID=") {
			version = strings.Trim(strings.TrimPrefix(line, "VERSION_ID="), "\"")
		}
	}
	if name == "" {
		name = "Linux"
	}
	if version == "" {
		version = "24.04"
	}
	return name, version
}

func detectOutboundIP() string {
	conn, err := net.Dial("udp", "192.168.68.117:8080")
	if err != nil {
		conn, err = net.Dial("udp", "8.8.8.8:80")
	}
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func main() {
	var configPath, flagServerURL, flagToken, flagName, flagHostname string
	flag.StringVar(&configPath, "config", "", "Path to configuration file")
	flag.StringVar(&flagServerURL, "server", "", "NexusOps Server API URL")
	flag.StringVar(&flagToken, "token", "", "Enrollment token")
	flag.StringVar(&flagName, "name", "", "Display name for server (e.g. DeployCasaServer, Desktop)")
	flag.StringVar(&flagHostname, "hostname", "", "Server hostname override")
	flag.Parse()

	log.Printf("[NEXUSOPS-AGENT] Starting NexusOps Linux Agent v%s ...", AgentVersion)

	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		log.Fatalf("[ERROR] Failed to load configuration: %v", err)
	}

	if flagServerURL != "" {
		cfg.ServerURL = flagServerURL
	}
	if flagToken != "" {
		cfg.EnrollmentToken = flagToken
	}
	if flagName != "" {
		cfg.DisplayName = flagName
	}
	if flagHostname != "" {
		cfg.Hostname = flagHostname
	}
	if cfg.DisplayName == "" {
		cfg.DisplayName = cfg.Hostname
	}
	if cfg.IPAddress == "" {
		cfg.IPAddress = detectOutboundIP()
	}

	apiClient := client.NewAPIClient(cfg.ServerURL, cfg.AgentID, cfg.AgentToken)

	osName, osVersion := detectOS()

	// Step 1: Auto-Enrollment if token is present and not yet enrolled
	if cfg.AgentID == "" && cfg.EnrollmentToken != "" {
		log.Printf("[INFO] Attempting agent enrollment with server %s (Name: %s, IP: %s) ...", cfg.ServerURL, cfg.DisplayName, cfg.IPAddress)
		enrollRes, err := apiClient.Enroll(&client.EnrollRequest{
			EnrollmentToken: cfg.EnrollmentToken,
			Hostname:        cfg.Hostname,
			DisplayName:     cfg.DisplayName,
			IPAddress:       cfg.IPAddress,
			OSName:          osName,
			OSVersion:       osVersion,
			AgentVersion:    AgentVersion,
		})
		if err != nil {
			log.Fatalf("[FATAL] Enrollment failed: %v", err)
		}
		cfg.AgentID = enrollRes.AgentID
		cfg.AgentToken = enrollRes.AgentToken
		cfg.EnrollmentToken = "" // Invalidate local token once enrolled
		if err := config.SaveConfig(configPath, cfg); err != nil {
			log.Printf("[WARN] Could not persist credentials to disk: %v", err)
		}
		log.Printf("[SUCCESS] Enrolled successfully as Agent ID: %s (Server ID: %s, Name: %s)", cfg.AgentID, enrollRes.ServerID, cfg.DisplayName)
	}

	if cfg.AgentID == "" {
		log.Println("[WARN] Agent is not enrolled yet. Specify NEXUSOPS_ENROLLMENT_TOKEN or config file to enroll.")
	}

	metricsCollector := collector.NewCollector()
	actionExecutor := executor.NewExecutor(cfg.AllowedServices)

	metricsTicker := time.NewTicker(time.Duration(cfg.IntervalSec) * time.Second)
	defer metricsTicker.Stop()

	heartbeatTicker := time.NewTicker(time.Duration(cfg.HeartbeatSec) * time.Second)
	defer heartbeatTicker.Stop()

	actionPollTicker := time.NewTicker(2 * time.Second)
	defer actionPollTicker.Stop()

	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	log.Printf("[INFO] Agent daemon active. Metrics interval: %ds, Heartbeat interval: %ds", cfg.IntervalSec, cfg.HeartbeatSec)

	for {
		select {
		case <-heartbeatTicker.C:
			if cfg.AgentID != "" {
				if err := apiClient.SendHeartbeat(); err != nil {
					log.Printf("[WARN] Heartbeat error: %v", err)
				}
			}

		case <-metricsTicker.C:
			if cfg.AgentID != "" {
				m, err := metricsCollector.Collect()
				if err == nil {
					if err := apiClient.SendMetrics(m); err != nil {
						log.Printf("[WARN] Metric delivery error: %v", err)
					}
				}
			}

		case <-actionPollTicker.C:
			if cfg.AgentID != "" && cfg.AllowActions {
				actionReq, err := apiClient.PollPendingAction()
				if err == nil && actionReq != nil {
					log.Printf("[ACTION] Received remediation request %s: %s", actionReq.ActionID, actionReq.ActionType)
					res := actionExecutor.Execute(actionReq)
					log.Printf("[ACTION] Execution finished for %s with status: %s (verified=%v)", actionReq.ActionID, res.Status, res.Verified)
					if err := apiClient.SendActionResult(res); err != nil {
						log.Printf("[ERROR] Failed to report action result: %v", err)
					}
				}
			}

		case sig := <-stopChan:
			log.Printf("[INFO] Received signal %v. Shutting down agent gracefully...", sig)
			return
		}
	}
}
