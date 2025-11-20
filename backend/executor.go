package backend

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func (a *App) getBinaryPath(name string) (string, error) {
	platformDir := runtime.GOOS
	extension := ""
	if runtime.GOOS == "windows" {
		extension = ".exe"
	}

	candidates := []string{
		filepath.Join(".", "bin", platformDir, name+extension),
	}

	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	installDir := filepath.Dir(exePath)
	candidates = append(candidates, filepath.Join(installDir, "bin", platformDir, name+extension))

	// Legacy fallback: allow flat bin layout so older installs still run.
	candidates = append(candidates,
		filepath.Join(".", "bin", name+extension),
		filepath.Join(installDir, "bin", name+extension),
	)

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}

		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			if filepath.IsAbs(candidate) {
				return candidate, nil
			}
			return filepath.Abs(candidate)
		}
	}

	return "", fmt.Errorf("binary '%s' not found for platform '%s'", name, platformDir)
}

func (a *App) runCommand(name string, args ...string) (string, error) {
	binaryPath, err := a.getBinaryPath(name)
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, args...)

	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to run %s: %s (stderr: %s)", name, err, stderr.String())
	}

	return strings.TrimSpace(out.String()), nil
}

func (a *App) runShellCommand(shellCommand string) (string, error) {
	binaryPath, err := a.getBinaryPath("adb")
	if err != nil {
		return "", err
	}

	cmd := exec.Command(binaryPath, "shell", shellCommand)

	setCommandWindowMode(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		return "", fmt.Errorf("failed to run adb shell '%s': %s (stderr: %s)", shellCommand, err, stderr.String())
	}

	return strings.TrimSpace(out.String()), nil
}
