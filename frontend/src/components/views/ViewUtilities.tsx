import React, { useState, useCallback, useEffect, useRef } from 'react';

import { GetDeviceMode, Reboot } from '../../../wailsjs/go/backend/App';

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw, Loader2, Power, Terminal, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type RebootMode = 'normal' | 'recovery' | 'bootloader' | 'fastboot' | null;
type DeviceConnectionMode = 'adb' | 'fastboot' | 'unknown';

export function ViewUtilities({ activeView }: { activeView: string }) {
  const [loadingMode, setLoadingMode] = useState<RebootMode>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceConnectionMode>('unknown');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const refreshTimeout = useRef<number | null>(null);

  const fetchDeviceMode = useCallback(async () => {
    setIsCheckingStatus(true);
    setStatusError(null);
    try {
      const mode = await GetDeviceMode();
      const normalized = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
      if (normalized === 'adb' || normalized === 'fastboot') {
        setDeviceMode(normalized as DeviceConnectionMode);
      } else {
        setDeviceMode('unknown');
      }
    } catch (error) {
      console.error("Failed to determine device mode:", error);
      setDeviceMode('unknown');
      setStatusError("Unable to determine device mode.");
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'utils') {
      fetchDeviceMode();
    }
  }, [activeView, fetchDeviceMode]);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current) {
        window.clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  const handleReboot = async (mode: string, modeId: RebootMode) => {
    if (loadingMode) return;
    
    setLoadingMode(modeId);
    try {
      await Reboot(mode);
    } catch (error) {
      console.error(`Error rebooting to ${modeId}:`, error);
      toast.error("Failed to send reboot command", {
        description: String(error),
      });
    }
    
    setLoadingMode(null);
    if (refreshTimeout.current) {
      window.clearTimeout(refreshTimeout.current);
    }
    refreshTimeout.current = window.setTimeout(() => {
      fetchDeviceMode();
    }, 1500);
  };

  const isLoading = (modeId: RebootMode) => loadingMode === modeId;
  const canSendCommand = deviceMode !== 'unknown';

  const deviceModeLabel = (() => {
    switch (deviceMode) {
      case 'adb':
        return 'ADB Mode';
      case 'fastboot':
        return 'Fastboot Mode';
      default:
        return 'No Device Detected';
    }
  })();

  const deviceModeClass = (() => {
    switch (deviceMode) {
      case 'adb':
        return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600';
      case 'fastboot':
        return 'border-blue-500/30 bg-blue-500/15 text-blue-600';
      default:
        return 'border-border bg-muted text-muted-foreground';
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <CardTitle className="flex items-center gap-2">
              <RotateCw />
              Reboot Options
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Connection</span>
              <span
                className={cn(
                  "border px-2 py-0.5 text-xs font-medium rounded-full",
                  deviceModeClass
                )}
              >
                {deviceModeLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={fetchDeviceMode}
                disabled={isCheckingStatus || !!loadingMode}
              >
                {isCheckingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {statusError && (
            <p className="text-xs text-destructive">{statusError}</p>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <Button
            variant="outline"
            size="lg"
            className="flex-col h-24" 
            disabled={!!loadingMode || !canSendCommand}
            onClick={() => handleReboot('', 'normal')} 
          >
            {isLoading('normal') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Power className="h-6 w-6" />
            )}
            <span className="mt-2">Reboot System</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-col h-24"
            disabled={!!loadingMode || !canSendCommand}
            onClick={() => handleReboot('recovery', 'recovery')}
          >
            {isLoading('recovery') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <RotateCw className="h-6 w-6" />
            )}
            <span className="mt-2">Reboot to Recovery</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-col h-24"
            disabled={!!loadingMode || !canSendCommand}
            onClick={() => handleReboot('bootloader', 'bootloader')}
          >
            {isLoading('bootloader') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Terminal className="h-6 w-6" />
            )}
            <span className="mt-2">Reboot to Bootloader</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="flex-col h-24"
            disabled={!!loadingMode || !canSendCommand}
            onClick={() => handleReboot('fastboot', 'fastboot')}
          >
            {isLoading('fastboot') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Zap className="h-6 w-6" />
            )}
            <span className="mt-2">Reboot to Fastbootd</span>
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
