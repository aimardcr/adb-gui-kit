package backend

import (
	"os/exec"
	"syscall"
)

func setCommandWindowMode(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
}
