# High Availability and Disaster Recovery Monitoring System

A desktop application built with **Wails v3**, **Go**, and **React** for monitoring and managing High Availability and Disaster Recovery (HADR) environments. The application provides an intuitive interface for monitoring cluster health, managing services, visualizing performance metrics, and configuring email notifications.

## Features

-  Real-time cluster monitoring dashboard
-  Primary & Standby server management
-  Replication status and health monitoring
-  Live performance metrics (CPU, Memory, Latency, Replication Lag)
-  Maintenance mode and cluster operations
-  Server configuration management
-  SMTP email configuration with test email support
-  Cross-platform desktop application powered by Wails

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Zustand
- Recharts

**Backend**
- Go
- Wails v3

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 20+
- npm
- Wails v3
- Microsoft WebView2 Runtime (Windows)

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd High-Availability-and-Disaster-Recovery
```

Install dependencies:

```bash
go mod tidy

cd frontend
npm install
cd ..
```

Run the application:

```bash
wails3 dev
```

Build for production:

```bash
wails3 build
```

## Email Notifications

The application supports SMTP-based email notifications with support for:

- SMTP (Port 25)
- STARTTLS (Port 587)
- SSL/TLS (Port 465)

Users can save email configurations locally and verify them using the built-in **Send Test Email** feature.

## Future Enhancements

- Database integration
- Real-time server monitoring
- Authentication & Role-Based Access Control
- Alert and notification system
- Historical analytics and reporting
- Docker & Kubernetes integration

## License

This project is intended for educational and demonstration purposes.