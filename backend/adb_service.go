package backend

import (
	"regexp"
	"strings"
	"fmt"
)

func (a *App) GetDevices() ([]Device, error) {
	output, err := a.runCommand("adb", "devices")
	if err != nil {
		return nil, err
	}

	var devices []Device
	lines := strings.Split(output, "\n")

	if len(lines) > 1 {
		for _, line := range lines[1:] {
			parts := strings.Fields(line)
			if len(parts) == 2 {
				devices = append(devices, Device{
					Serial: parts[0],
					Status: parts[1],
				})
			}
		}
	}

	return devices, nil
}

func (a *App) getProp(prop string) string {
	output, err := a.runCommand("adb", "shell", "getprop", prop)
	if err != nil {
		return "N/A"
	}
	return output
}

func (a *App) GetDeviceInfo() (DeviceInfo, error) {
	var info DeviceInfo

	info.Model = a.getProp("ro.product.model")
	info.AndroidVersion = a.getProp("ro.build.version.release")
	info.BuildNumber = a.getProp("ro.build.id")

	batteryOutput, err := a.runShellCommand("dumpsys battery | grep level")
	if err != nil {
		info.BatteryLevel = "N/A"
	} else {
		re := regexp.MustCompile(`:\s*(\d+)`)
		matches := re.FindStringSubmatch(batteryOutput)
		if len(matches) > 1 {
			info.BatteryLevel = matches[1] + "%"
		} else {
			info.BatteryLevel = "N/A"
		}
	}

	return info, nil
}

func (a *App) Reboot(mode string) error {
	_, err := a.runCommand("adb", "reboot", mode)
	
	if err != nil {
		return err
	}

	return nil
}

func (a *App) InstallPackage(filePath string) (string, error) {
	output, err := a.runCommand("adb", "install", "-r", filePath)
	if err != nil {
		return "", fmt.Errorf("failed to install package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) UninstallPackage(packageName string) (string, error) {
	output, err := a.runCommand("adb", "shell", "pm", "uninstall", packageName)
	if err != nil {
		return "", fmt.Errorf("failed to uninstall package: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) ListFiles(path string) ([]FileEntry, error) {
	output, err := a.runCommand("adb", "shell", "ls", "-lA", path)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w. Output: %s", err, output)
	}

	var files []FileEntry
	lines := strings.Split(output, "\n")
	
	spaceRegex := regexp.MustCompile(`\s+`)

	for _, line := range lines {
		if line == "" || strings.HasPrefix(line, "total") {
			continue
		}

		parts := spaceRegex.Split(line, 9)
		if len(parts) < 8 {
			continue 
		}

		permissions := parts[0]
		fileType := "File"
		size := "N/A"
		
		if permissions[0] == 'd' {
			fileType = "Directory"
			size = ""
		} else if permissions[0] == 'l' {
			fileType = "Symlink"
			size = ""
		} else {
			if len(parts) > 4 {
				size = parts[4]
			}
		}
		
		var name string
		var date string
		var time string
		
		if fileType == "Directory" {
			if len(parts) > 6 {
				date = parts[4]
				time = parts[5]
				name = strings.Join(parts[6:], " ")
			}
		} else {
			if len(parts) > 7 {
				size = parts[4]
				date = parts[5]
				time = parts[6]
				name = strings.Join(parts[7:], " ")
			}
		}
		
		if name == "" && len(parts) > 5 {
			name = parts[len(parts)-1]
			time = parts[len(parts)-2]
			date = parts[len(parts)-3]
			if fileType == "File" && len(parts) > 4 {
				size = parts[4]
			}
		}
		
		if fileType == "Symlink" {
			linkParts := strings.Split(name, " -> ")
			name = linkParts[0]
		}

		files = append(files, FileEntry{
			Name:        name,
			Type:        fileType,
			Size:        size,
			Permissions: permissions,
			Date:        date,
			Time:        time,
		})
	}

	return files, nil
}

func (a *App) PushFile(localPath string, remotePath string) (string, error) {
	output, err := a.runCommand("adb", "push", localPath, remotePath)
	if err != nil {
		return "", fmt.Errorf("failed to push file: %w. Output: %s", err, output)
	}
	return output, nil
}

func (a *App) PullFile(remotePath string, localPath string) (string, error) {
	output, err := a.runCommand("adb", "pull", "-a", remotePath, localPath)
	if err != nil {
		return "", fmt.Errorf("failed to pull file: %w. Output: %s", err, output)
	}
	return output, nil
}
