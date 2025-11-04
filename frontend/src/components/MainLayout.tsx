import React, { useState } from 'react';
import "@/styles/global.css";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Box, 
  FolderOpen, 
  Terminal, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; 

import { ViewDashboard } from './views/ViewDashboard';
import { ViewAppManager } from './views/ViewAppManager';
import { ViewFileExplorer } from './views/ViewFileExplorer';
import { ViewFlasher } from './views/ViewFlasher';
import { ViewUtilities } from './views/ViewUtilities';

const VIEWS = {
  DASHBOARD: 'dashboard',
  APPS: 'apps',
  FILES: 'files',
  FLASHER: 'flasher',
  UTILS: 'utils',
} as const;

type ViewType = typeof VIEWS[keyof typeof VIEWS];

export function MainLayout() { 
  const [activeView, setActiveView] = useState<ViewType>(VIEWS.DASHBOARD);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <ViewDashboard />;
      case VIEWS.APPS:
        return <ViewAppManager />;
      case VIEWS.FILES:
        return <ViewFileExplorer />;
      case VIEWS.FLASHER:
        return <ViewFlasher />;
      case VIEWS.UTILS:
        return <ViewUtilities />;
      default:
        return <ViewDashboard />;
    }
  };

  return (
    <TooltipProvider delayDuration={0}> 
      <div className="relative flex h-screen bg-background text-foreground">
        
        <aside 
          className={cn(
            "border-r bg-muted/40 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[72px]" : "w-64" 
          )}
        >
          <div className="flex h-full flex-col p-4">

            <div className="mb-6 flex items-center px-2 h-10">
              <Terminal 
                className={cn(
                  "h-6 w-6 text-primary transition-transform duration-300 ease-in-out",
                  isCollapsed && "rotate-180" 
                )} 
              />
              <h2 
                className={cn(
                  "ml-2 text-xl font-bold transition-opacity duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                )}
              >
                ADB Kit
              </h2>
            </div>
            
            <nav className="flex flex-1 flex-col space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === VIEWS.DASHBOARD ? "secondary" : "ghost"}
                    className={cn("justify-start text-base", isCollapsed && "justify-center")}
                    onClick={() => setActiveView(VIEWS.DASHBOARD)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "hidden")}>Dashboard</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === VIEWS.APPS ? "secondary" : "ghost"}
                    className={cn("justify-start text-base", isCollapsed && "justify-center")}
                    onClick={() => setActiveView(VIEWS.APPS)}
                  >
                    <Box className="mr-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "hidden")}>Application</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Application</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === VIEWS.FILES ? "secondary" : "ghost"}
                    className={cn("justify-start text-base", isCollapsed && "justify-center")}
                    onClick={() => setActiveView(VIEWS.FILES)}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "hidden")}>File</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">File</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === VIEWS.FLASHER ? "secondary" : "ghost"}
                    className={cn("justify-start text-base", isCollapsed && "justify-center")}
                    onClick={() => setActiveView(VIEWS.FLASHER)}
                  >
                    <Terminal className="mr-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "hidden")}>Flasher</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Flasher</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeView === VIEWS.UTILS ? "secondary" : "ghost"}
                    className={cn("justify-start text-base", isCollapsed && "justify-center")}
                    onClick={() => setActiveView(VIEWS.UTILS)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "hidden")}>Utility</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Utility</TooltipContent>
              </Tooltip>
            </nav>
            
          </div>
        </aside>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className={cn(
                "absolute z-10 h-7 w-7 rounded-full p-0 transition-all duration-300 ease-in-out flex items-center justify-center",
                "top-16 -translate-y-1/2",
                isCollapsed ? "left-[calc(72px-14px)]" : "left-[calc(256px-14px)]" 
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>

        
        <main className="flex-1 p-6 overflow-auto">
          {renderActiveView()}
        </main>
        
      </div>
    </TooltipProvider>
  );
}
