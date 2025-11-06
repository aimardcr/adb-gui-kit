import React, { useState, useEffect } from 'react'; 
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

export function ViewFlasher({ activeView }: { activeView: string }) {
  const [partition, setPartition] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  const [fastbootDevices, setFastbootDevices] = useState<Device[]>([]);
  const [isRefreshingFastboot, setIsRefreshingFastboot] = useState(false);

  const refreshFastbootDevices = async () => {
    setIsRefreshingFastboot(true);
    try {
      const result = await GetFastbootDevices();
      setFastbootDevices(result || []);
    } catch (error) {
      console.error("Error refreshing fastboot devices:", error);
      setFastbootDevices([]);
    }
    setIsRefreshingFastboot(false);
  };

  useEffect(() => {
    if (activeView === 'flasher') {
      refreshFastbootDevices();
      
      const interval = setInterval(() => {
        if (!isRefreshingFastboot) {
          refreshFastbootDevices();
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [activeView, isRefreshingFastboot]);

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
          <Button variant="ghost" size="icon" onClick={refreshFastbootDevices} disabled={isRefreshingFastboot}>
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
