package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
)

// EmailSettings mirrors the fields on the Email Settings page.
type EmailSettings struct {
	SMTPPort       string `json:"smtpPort"`
	SMTPServer     string `json:"smtpServer"`
	SenderEmail    string `json:"senderEmail"`
	SenderPassword string `json:"senderPassword"`
	ReceiverEmail  string `json:"receiverEmail"`
}

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

// EmailService persists SMTP settings to disk and can send a real test
// email using them.
//
// Register it in main.go:
//
//	Services: []application.Service{
//	    application.NewService(&EmailService{}),
//	}
type EmailService struct{}

func emailSettingsPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("could not resolve config directory: %w", err)
	}
	appDir := filepath.Join(dir, "hadr-monitoring")
	if err := os.MkdirAll(appDir, 0o700); err != nil {
		return "", fmt.Errorf("could not create config directory: %w", err)
	}
	return filepath.Join(appDir, "email-settings.json"), nil
}

// LoadSettings returns the last saved settings, or a zero-value struct if
// nothing has been saved yet. Call this from the frontend on mount.
func (s *EmailService) LoadSettings() (EmailSettings, error) {
	path, err := emailSettingsPath()
	if err != nil {
		return EmailSettings{}, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return EmailSettings{}, nil // nothing saved yet — not an error
		}
		return EmailSettings{}, fmt.Errorf("could not read settings: %w", err)
	}

	var settings EmailSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return EmailSettings{}, fmt.Errorf("saved settings are corrupted: %w", err)
	}
	return settings, nil
}

// SaveSettings validates and persists the settings to disk.
//
// Note: SenderPassword is stored as plaintext JSON on disk for now. For
// production use, swap this for OS keychain storage (e.g.
// github.com/zalando/go-keyring) instead of a plain file.
func (s *EmailService) SaveSettings(settings EmailSettings) error {
	if err := validateEmailSettings(settings); err != nil {
		return err
	}

	path, err := emailSettingsPath()
	if err != nil {
		return err
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return fmt.Errorf("could not encode settings: %w", err)
	}

	if err := os.WriteFile(path, data, 0o600); err != nil {
		return fmt.Errorf("could not write settings: %w", err)
	}
	return nil
}

// SendTestEmail validates the settings, connects to the SMTP server, and
// sends a real test email to ReceiverEmail. Supports plain SMTP (25),
// STARTTLS (e.g. 587), and implicit TLS (465).
func (s *EmailService) SendTestEmail(settings EmailSettings) error {
	if err := validateEmailSettings(settings); err != nil {
		return err
	}

	port, err := strconv.Atoi(settings.SMTPPort)
	if err != nil {
		return fmt.Errorf("SMTP Port must be a number")
	}

	addr := net.JoinHostPort(settings.SMTPServer, settings.SMTPPort)
	auth := smtp.PlainAuth("", settings.SenderEmail, settings.SenderPassword, settings.SMTPServer)

	subject := "HADR Monitoring — test email"
	body := "This is a test email sent from HADR Monitoring's Email Settings page.\r\n"
	msg := []byte(
		"From: " + settings.SenderEmail + "\r\n" +
			"To: " + settings.ReceiverEmail + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"\r\n" + body,
	)
	to := []string{settings.ReceiverEmail}

	if port == 465 {
		// Implicit TLS — smtp.SendMail doesn't support this directly, so the
		// handshake is done manually.
		conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: settings.SMTPServer})
		if err != nil {
			return fmt.Errorf("could not connect to %s: %w", addr, err)
		}
		defer conn.Close()

		client, err := smtp.NewClient(conn, settings.SMTPServer)
		if err != nil {
			return fmt.Errorf("could not start SMTP session: %w", err)
		}
		defer client.Close()

		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP authentication failed: %w", err)
		}
		return deliverMessage(client, settings.SenderEmail, to, msg)
	}

	// Plain / STARTTLS (587, 25, ...) — smtp.SendMail upgrades to TLS
	// automatically when the server advertises STARTTLS support.
	if err := smtp.SendMail(addr, auth, settings.SenderEmail, to, msg); err != nil {
		return fmt.Errorf("could not send test email: %w", err)
	}
	return nil
}

func deliverMessage(client *smtp.Client, from string, to []string, msg []byte) error {
	if err := client.Mail(from); err != nil {
		return fmt.Errorf("SMTP MAIL FROM failed: %w", err)
	}
	for _, recipient := range to {
		if err := client.Rcpt(recipient); err != nil {
			return fmt.Errorf("SMTP RCPT TO failed: %w", err)
		}
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP DATA failed: %w", err)
	}
	if _, err := w.Write(msg); err != nil {
		return fmt.Errorf("could not write message body: %w", err)
	}
	return w.Close()
}

func validateEmailSettings(settings EmailSettings) error {
	if settings.SMTPServer == "" {
		return fmt.Errorf("SMTP Server is required")
	}
	if settings.SMTPPort == "" {
		return fmt.Errorf("SMTP Port is required")
	}
	if port, err := strconv.Atoi(settings.SMTPPort); err != nil || port < 1 || port > 65535 {
		return fmt.Errorf("SMTP Port must be a number between 1 and 65535")
	}
	if settings.SenderEmail == "" {
		return fmt.Errorf("Sender Email is required")
	}
	if !emailRegex.MatchString(settings.SenderEmail) {
		return fmt.Errorf("Sender Email is not a valid email address")
	}
	if settings.SenderPassword == "" {
		return fmt.Errorf("Sender Password is required")
	}
	if settings.ReceiverEmail == "" {
		return fmt.Errorf("Receiver Email is required")
	}
	if !emailRegex.MatchString(settings.ReceiverEmail) {
		return fmt.Errorf("Receiver Email is not a valid email address")
	}
	return nil
}