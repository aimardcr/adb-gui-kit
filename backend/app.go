package backend

import (
	"context"
	"fmt"
)

type Device struct {
	Serial string `json:"serial"`
	Status string `json:"status"`
}

type DeviceInfo struct {
	Model         string `json:"model"`
	AndroidVersion string `json:"androidVersion"`
	BuildNumber    string `json:"buildNumber"`
	BatteryLevel   string `json:"batteryLevel"`
}

type FileEntry struct {
	Name        string `json:"name"`
	Type        string `json:"type"`
	Size        string `json:"size"`
	Permissions string `json:"permissions"`
	Date        string `json:"date"`
	Time        string `json:"time"`
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
