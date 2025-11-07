import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal } from "lucide-react";

export function ViewShell({ activeView }: { activeView: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Shell Terminal
          </CardTitle>
          <CardDescription>
            Shell Terminal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Coming Soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
