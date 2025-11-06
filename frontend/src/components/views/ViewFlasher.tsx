import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { WipeData, FlashPartition, SelectImageFile, GetFastbootDevices } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, AlertTriangle, FileUp, Trash2, Smartphone, RefreshCw } from "lucide-react";

type Device = backend.Device;

const sanitizeFastbootDevices = (devices: Device[] | null | undefined): Device[] => {
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices
    .filter((device): device is Device => !!device && typeof device.Serial === 'string')
    .map((device) => ({
      Serial: device.Serial,
      Status: device.Status ?? 'fastboot',
    }));
};

const areDeviceListsEqual = (a: Device[], b: Device[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i].Serial !== b[i].Serial || a[i].Status !== b[i].Status) {
      return false;
    }
  }

  return true;
};

export function ViewFlasher({ activeView }: { activeView: string }) {
  const [partition, setPartition] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const [fastbootDevices, setFastbootDevices] = useState<Device[]>([]);
  const [isRefreshingFastboot, setIsRefreshingFastboot] = useState(false);
  const [fastbootError, setFastbootError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fastbootDevicesRef = useRef<Device[]>([]);
  const refreshInFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const emptyPollCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyFastbootDevices = useCallback((devices: Device[]) => {
    if (!isMountedRef.current) {
      return;
    }
    fastbootDevicesRef.current = devices;
    setFastbootDevices((current) =>
      areDeviceListsEqual(current, devices) ? current : devices
    );
  }, []);

  const refreshFastbootDevices = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (refreshInFlightRef.current) {
        queuedRefreshRef.current = true;
        return;
      }

      refreshInFlightRef.current = true;
      if (!silent && isMountedRef.current) {
        setIsRefreshingFastboot(true);
      }

      try {
        const result = await GetFastbootDevices();
        if (!isMountedRef.current) {
          return;
        }
        const sanitizedDevices = sanitizeFastbootDevices(result);
        setFastbootError(null);

        if (sanitizedDevices.length > 0) {
          emptyPollCountRef.current = 0;
          applyFastbootDevices(sanitizedDevices);
        } else {
          emptyPollCountRef.current += 1;
          if (
            fastbootDevicesRef.current.length === 0 ||
            emptyPollCountRef.current >= 2
          ) {
            applyFastbootDevices([]);
          }
        }
      } catch (error) {
        console.error("Error refreshing fastboot devices:", error);
        if (isMountedRef.current) {
          setFastbootError("Failed to refresh fastboot devices.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsRefreshingFastboot(false);
        }
        refreshInFlightRef.current = false;

        if (queuedRefreshRef.current && isMountedRef.current) {
          queuedRefreshRef.current = false;
          refreshFastbootDevices({ silent: true });
        } else {
          queuedRefreshRef.current = false;
        }
      }
    },
    [applyFastbootDevices]
  );

  useEffect(() => {
    fastbootDevicesRef.current = fastbootDevices;
  }, [fastbootDevices]);

  useEffect(() => {
    if (activeView !== 'flasher') {
      return;
    }

    emptyPollCountRef.current = 0;
    refreshFastbootDevices();
    const interval = window.setInterval(() => {
      refreshFastbootDevices({ silent: true });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeView, refreshFastbootDevices]);

  const handleSelectFile = async () => {
    try {
      const selectedPath = await SelectImageFile(); 
      
      if (selectedPath) {
        setFilePath(selectedPath);
        toast.info(`File selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleFlash = async () => {
    if (!partition) {
      toast.error("Partition name cannot be empty.");
      return;
    }
    if (!filePath) {
      toast.error("No file selected.");
      return;
    }

    setIsFlashing(true);
    const toastId = toast.loading(`Flashing ${partition} partition...`);

    try {
      await FlashPartition(partition, filePath);
      toast.success("Flash Complete", { description: `${partition} flashed successfully.`, id: toastId });
    } catch (error) {
      console.error("Flash error:", error);
      toast.error("Flash Failed", { description: String(error), id: toastId });
    } finally {
      setIsFlashing(false);
    }
  };

  const handleWipe = async () => {
    setIsWiping(true);
    const toastId = toast.loading("Wiping data... Device will factory reset.");

    try {
      await WipeData();
      toast.success("Wipe Complete", { description: "Device data has been erased.", id: toastId });
    } catch (error) {
      console.error("Wipe error:", error);
      toast.error("Wipe Failed", { description: String(error), id: toastId });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone />
            Fastboot Devices
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refreshFastbootDevices()}
            disabled={isRefreshingFastboot}
          >
            {isRefreshingFastboot ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {fastbootDevices.length === 0 ? (
            <p className="text-muted-foreground">
              {isRefreshingFastboot ? "Scanning for devices..." : "No fastboot device detected. Put your device in fastboot/bootloader mode."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {fastbootDevices.map((device) => (
                <div key={device.Serial} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono">{device.Serial}</span>
                  <span className="font-semibold text-blue-500">
                    {device.Status}
                  </span>
                </div>
              ))}
            </div>
          )}
          {fastbootError && (
            <p className="mt-2 text-sm text-destructive">{fastbootError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp />
            Flash Partition
          </CardTitle>
          <CardDescription>
            Flash an image file (.img) to a specific partition.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="partition" className="text-sm font-medium">Partition Name</label>
            <Input 
              id="partition" 
              placeholder="e.g., boot, recovery, vendor_boot" 
              value={partition}
              onChange={(e) => setPartition(e.target.value)}
              disabled={isFlashing}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image File (.img)</label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSelectFile}
                disabled={isFlashing}
              >
                Select File
              </Button>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {filePath ? filePath : "No file selected."}
            </p>
          </div>

          <Button 
            variant="default"
            className="w-full"
            disabled={isFlashing || !partition || !filePath || fastbootDevices.length === 0}
            onClick={handleFlash}
          >
            {isFlashing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            Flash Partition
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible and will erase data on your device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isWiping || fastbootDevices.length === 0}
              >
                {isWiping ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Wipe Data (Factory Reset)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently 
                  erase all user data (photos, files, settings) 
                  from your device, performing a full factory reset.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleWipe}
                >
                  Yes, Wipe Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
