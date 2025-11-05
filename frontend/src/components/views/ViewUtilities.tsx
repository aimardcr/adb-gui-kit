import React, { useState } from 'react';

import { Reboot } from '../../../wailsjs/go/backend/App';

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw, Loader2, Power, Terminal } from "lucide-react";

type RebootMode = 'normal' | 'recovery' | 'bootloader' | null;

export function ViewUtilities({ activeView }: { activeView: string }) {
  const [loadingMode, setLoadingMode] = useState<RebootMode>(null);

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
  };

  const isLoading = (modeId: RebootMode) => loadingMode === modeId;

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw />
            Reboot Options
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Button
            variant="outline"
            size="lg"
            className="flex-col h-24" 
            disabled={!!loadingMode}
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
            disabled={!!loadingMode}
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
            disabled={!!loadingMode}
            onClick={() => handleReboot('bootloader', 'bootloader')}
          >
            {isLoading('bootloader') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Terminal className="h-6 w-6" />
            )}
            <span className="mt-2">Reboot to Bootloader</span>
          </Button>

        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Utilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming Soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
