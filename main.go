package main

import (
	"embed"

	"log"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

var assets embed.FS

// Tray icon shown in the system tray / menu bar. Wails scaffolds a 512x512
// icon at build/appicon.png by default — point this elsewhere if yours
// lives somewhere else. A smaller, simpler image usually looks better in
// the tray than the full app icon.
//
//go:embed build/appicon.png
var trayIcon []byte

func init() {
	application.RegisterEvent[string]("time")
}

// main function serves as the application's entry point. It initializes the application, creates a window,
// and starts a goroutine that emits a time-based event every second. It subsequently runs the application and
// logs any error that might occur.
func main() {

	// Create a new Wails application by providing the necessary options.
	// Variables 'Name' and 'Description' are for application metadata.
	// 'Assets' configures the asset server with the 'FS' variable pointing to the frontend files.
	// 'Bind' is a list of Go struct instances. The frontend has access to the methods of these instances.
	// 'Mac' options tailor the application when running an macOS.
	app := application.New(application.Options{
		Name:        "HADR",
		Description: "HADR Management",
		Services: []application.Service{
			application.NewService(&EmailService{}),
			application.NewService(&NotificationService{}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			// Left as-is: background mode hides the window instead of
			// actually closing it (see the WindowClosing hook below), so
			// this setting only kicks in on a genuine close, which is fine.
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},

	})

	// Create a new window with the necessary options.
	// 'Title' is the title of the window.
	// 'Mac' options tailor the window when running on macOS.
	// 'BackgroundColour' is the background colour of the window.
	// 'URL' is the URL that will be loaded into the webview.
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "HADR",
		// Window sized to the golden ratio (1000 / 618 ≈ 1.618).
		Width:  1000,
		Height: 618,
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(6, 7, 15),
		URL:              "/",
	})

	// --- Background mode ---
	// Instead of quitting when the window's close button is clicked, cancel
	// the close and hide the window instead. The app keeps running (still
	// monitoring, notifications still fire) and stays reachable via the
	// system tray. The app only actually exits when "Quit" is chosen from
	// the tray menu below, which calls app.Quit() directly.
	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		window.Hide()
		e.Cancel()
	})

	systray := app.SystemTray.New()
	systray.SetLabel("HADR")
	systray.SetIcon(trayIcon)

	// Left-click the tray icon to show/hide the window.
	systray.AttachWindow(window)

	trayMenu := app.NewMenu()
	trayMenu.Add("Show").OnClick(func(ctx *application.Context) {
		window.Show()
	})
	trayMenu.AddSeparator()
	trayMenu.Add("Quit").OnClick(func(ctx *application.Context) {
		app.Quit()
	})
	systray.SetMenu(trayMenu)

	// Create a goroutine that emits an event containing the current time every second.
	// The frontend can listen to this event and update the UI accordingly.
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// Run the application. This blocks until the application has been exited.
	err := app.Run()

	// If an error occurred while running the application, log it and exit.
	if err != nil {
		log.Fatal(err)
	}
}