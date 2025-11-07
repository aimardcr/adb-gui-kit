import React, { useState, useEffect } from 'react';

import { GetDevices, GetDeviceInfo, EnableWirelessAdb, ConnectWirelessAdb, DisconnectWirelessAdb } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Battery, Info, Server, RefreshCw, Loader2, Hash, Wifi, ShieldCheck, Cpu, Database, Code, Building, Usb, PlugZap, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNickname, setNickname } from '@/lib/nicknameStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";


type Device = backend.Device;
type DeviceInfo = backend.DeviceInfo;

export function ViewDashboard({ activeView }: { activeView: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);
  const [wirelessIp, setWirelessIp] = useState('');
  const [wirelessPort, setWirelessPort] = useState('5555');
  const [isEnablingTcpip, setIsEnablingTcpip] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [nicknameVersion, setNicknameVersion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [newNickname, setNewNickname] = useState("");

  const refreshDevices = async () => {
    setIsRefreshingDevices(true);
    try {
      const result = await GetDevices();
      setDevices(result || []); 
    } catch (error) {
      console.error("Error refreshing devices:", error);
      setDevices([]); 
    }
    setIsRefreshingDevices(false);
  };

  const refreshInfo = async () => {
    if (devices.length === 0) {
      setDeviceInfo(null);
      return;
    }
    
    setIsRefreshingInfo(true);
    try {
      const result = await GetDeviceInfo();
      setDeviceInfo(result);
    } catch (error) {
      console.error("Error refreshing device info:", error);
      setDeviceInfo(null);
    }
    setIsRefreshingInfo(false);
  };

  useEffect(() => {
    if (activeView === 'dashboard') {
      refreshDevices();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'dashboard') {
      const interval = setInterval(() => {
        if (!isRefreshingDevices) {
          refreshDevices();
        }
      }, 3000); 
      
      return () => clearInterval(interval);
    }
  }, [activeView, isRefreshingDevices]);

  useEffect(() => {
    if (deviceInfo?.IPAddress && !deviceInfo.IPAddress.startsWith("N/A")) {
      setWirelessIp(deviceInfo.IPAddress);
    }
  }, [deviceInfo?.IPAddress]);  

  const handleEnableTcpip = async () => {
    setIsEnablingTcpip(true);
    const toastId = toast.loading("Enabling wireless mode (port 5555)...", {
      description: "Please wait... Device must be connected via USB.",
    });
    try {
      const output = await EnableWirelessAdb('5555');
      toast.success("Wireless mode enabled!", { id: toastId, description: output });
    } catch (error) {
      toast.error("Failed to enable wireless mode", { id: toastId, description: String(error) });
    }
    setIsEnablingTcpip(false);
  };

  const handleConnect = async () => {
    if (!wirelessIp) {
      toast.error("IP Address cannot be empty");
      return;
    }
    setIsConnecting(true);
    const toastId = toast.loading(`Connecting to ${wirelessIp}:${wirelessPort}...`);
    try {
      const output = await ConnectWirelessAdb(wirelessIp, wirelessPort);
      toast.success("Connection successful!", { id: toastId, description: output });
      
      refreshDevices(); 
    } catch (error) {
      toast.error("Connection failed", { id: toastId, description: String(error) });
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!wirelessIp) {
      toast.error("IP Address cannot be empty");
      return;
    }
    setIsDisconnecting(true);
    const toastId = toast.loading(`Disconnecting from ${wirelessIp}:${wirelessPort}...`);
    try {
      const output = await DisconnectWirelessAdb(wirelessIp, wirelessPort);
      toast.success("Disconnected", { id: toastId, description: output });
      
      refreshDevices(); 
    } catch (error) {
      toast.error("Disconnect failed", { id: toastId, description: String(error) });
    }
    setIsDisconnecting(false);
  };

  const openEditDialog = (device: Device) => {
    setCurrentDevice(device);
    setNewNickname(getNickname(device.Serial) || "");
    setIsEditing(true);
  };

  const closeEditDialog = () => {
    setIsEditing(false);
    setCurrentDevice(null);
    setNewNickname("");
  };

  const handleSaveNickname = () => {
    if (currentDevice) {
      setNickname(currentDevice.Serial, newNickname);
      setNicknameVersion(v => v + 1);
      toast.success(`Nama panggilan disimpan untuk ${currentDevice.Serial}`);
    }
    closeEditDialog();
  };

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone />
            Connected Devices
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={refreshDevices} disabled={isRefreshingDevices}>
            {isRefreshingDevices ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">
              {isRefreshingDevices ? "Scanning for devices..." : "No device detected. Ensure USB Debugging is enabled."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {devices.map((device) => {
                const displayName = getNickname(device.Serial) || device.Serial;
                
                return (
                  <div key={device.Serial} className="flex items-center justify-between p-3 bg-muted rounded-lg group">
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">{displayName}</span>
                      {displayName !== device.Serial && (
                        <span className="font-mono text-xs text-muted-foreground">{device.Serial}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className={`font-semibold ${
                          device.Status === 'device' ? 'text-green-500' : 'text-yellow-500'
                        }`}
                      >
                        {device.Status}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEditDialog(device)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi />
            Wireless ADB Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-3">
            <p className="font-medium">Step 1: Enable (via USB)</p>
            <p className="text-sm text-muted-foreground">
              Make sure the device is connected with a USB cable, then click this button..
            </p>
            <Button 
              className="w-full"
              onClick={handleEnableTcpip}
              disabled={isEnablingTcpip || devices.length === 0 || isConnecting}
            >
              {isEnablingTcpip ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Usb className="mr-2 h-4 w-4" />
              )}
              Enable Wireless Mode (tcpip)
            </Button>
          </div>

          <div className="space-y-3">
            <p className="font-medium">Step 2: Connect (via WiFi)</p>
            <p className="text-sm text-muted-foreground">
              Enter the Device IP (usually automatically filled in) and Port.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Device IP Address" 
                value={wirelessIp}
                onChange={(e) => setWirelessIp(e.target.value)}
                disabled={isConnecting || isDisconnecting}
                className="flex-1"
              />
              <Input 
                placeholder="Port" 
                value={wirelessPort}
                onChange={(e) => setWirelessPort(e.target.value)}
                disabled={isConnecting || isDisconnecting}
                className="w-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || !wirelessIp || isDisconnecting}
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                Connect
              </Button>
              <Button 
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting || !wirelessIp || isConnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlugZap className="mr-2 h-4 w-4" />
                )}
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info />
            Device Info
          </CardTitle>
          <Button 
            variant="default" 
            onClick={refreshInfo} 
            disabled={isRefreshingInfo || devices.length === 0}
          >
            {isRefreshingInfo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Info
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">Connect a device to see info.</p>
          ) : !deviceInfo ? (
             <p className="text-muted-foreground">Click "Refresh Info" to load data.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InfoItem icon={<Building size={18} />} label="Brand" value={deviceInfo.Brand} />
              <InfoItem icon={<Code size={18} />} label="Codename" value={deviceInfo.Codename} />
              <InfoItem icon={<Smartphone size={18} />} label="Model" value={deviceInfo.Model} />
              <InfoItem icon={<Server size={18} />} label="Build Number" value={deviceInfo.BuildNumber} />
              <InfoItem icon={<Info size={18} />} label="Android Version" value={deviceInfo.AndroidVersion} />
              <InfoItem icon={<Battery size={18} />} label="Battery" value={deviceInfo.BatteryLevel} />
              <InfoItem icon={<Cpu size={18} />} label="Total RAM" value={deviceInfo.RamTotal} />
              <InfoItem icon={<Database size={18} />} label="Internal Storage" value={deviceInfo.StorageInfo} />
              <InfoItem icon={<Wifi size={18} />} label="IP Address" value={deviceInfo.IPAddress} />
              <InfoItem icon={<ShieldCheck size={18} />} label="Root Status" value={deviceInfo.RootStatus}
                valueClassName={deviceInfo.RootStatus === 'Yes' ? 'text-green-500 font-bold' : 'text-muted-foreground'}/>

            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isEditing} onOpenChange={setIsEditing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Nickname</AlertDialogTitle>
            <AlertDialogDescription>
              Give a nickname to the device:
              <span className="block font-mono text-foreground mt-2">{currentDevice?.Serial}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="nickname" className="text-left">
              Nickname
            </Label>
            <Input
              id="nickname"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="Ex: My Device"
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeEditDialog}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveNickname}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoItem({ 
  icon, 
  label, 
  value,
  valueClassName
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string,
  valueClassName?: string
}) {
  return (
    <div className="flex items-center p-3 bg-muted rounded-lg">
      <div className="mr-3 text-primary">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn("font-semibold truncate", valueClassName)}>
          {value ? value : "N/A"}
        </div>
      </div>
    </div>
  );
}
