package main

import (
	"github.com/go-toast/toast"
)

type NotificationService struct{}

func (n *NotificationService) ShowNotification(title string, message string) error {
	notification := toast.Notification{
		AppID:   "HADR",
		Title:   title,
		Message: message,
		Audio:   toast.Default,
	}

	return notification.Push()
}