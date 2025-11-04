import React, { useState, useEffect } from 'react';

import { ListFiles, PushFile, PullFile, SelectFileToPush, SelectSaveDirectory } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, RefreshCw, Upload, Download, Folder, File, ArrowUp } from "lucide-react";

type FileEntry = backend.FileEntry;

export function ViewFileExplorer() {
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/sdcard/');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    setSelectedFile(null);
    try {
      const files = await ListFiles(path);
      files.sort((a, b) => {
        if (a.Type === 'Directory' && b.Type !== 'Directory') return -1;
        if (a.Type !== 'Directory' && b.Type === 'Directory') return 1;
        return a.Name.localeCompare(b.Name);
      });
      
      setFileList(files || []);
      setCurrentPath(path);
    } catch (error) {
      console.error("Failed to list files:", error);
      toast.error("Failed to list files", { description: String(error) });
      setCurrentPath(currentPath);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, []); 

  const handleRowClick = (file: FileEntry) => {
    setSelectedFile(file);
  };

  const handleRowDoubleClick = (file: FileEntry) => {
    if (file.Type === 'Directory') {
      const newPath = `${currentPath}${file.Name}/`;
      loadFiles(newPath);
    }
  };

  const handleBackClick = () => {
    if (currentPath === '/') return;
    let newPath = currentPath.substring(0, currentPath.length - 1).split('/').slice(0, -1).join('/') + '/';
    if (newPath === '//' || newPath === '') newPath = '/';
    loadFiles(newPath);
  };

  const handlePush = async () => {
    setIsPushing(true);
    let toastId: string | number = "";
    try {
      const localPath = await SelectFileToPush();
      if (!localPath) {
        setIsPushing(false);
        return;
      }

      const fileName = localPath.split(/[/\\]/).pop() || 'unknownfile';
      const remotePath = `${currentPath}${fileName}`;
      
      toastId = toast.loading(`Pushing ${fileName}...`, { description: `To: ${remotePath}` });

      const output = await PushFile(localPath, remotePath);
      toast.success("Push Complete", { description: output, id: toastId });
      
      loadFiles(currentPath);
    } catch (error) {
      console.error("Push error:", error);
      if (toastId) {
        toast.error("Push Failed", { description: String(error), id: toastId });
      } else {
        toast.error("Push Failed", { description: String(error) });
      }
    }
    setIsPushing(false);
  };

  const handlePull = async () => {
    if (!selectedFile) {
      toast.error("No file or folder selected to pull.");
      return;
    }

    setIsPulling(true);
    let toastId: string | number = "";
    try {
      const remotePath = `${currentPath}${selectedFile.Name}`;
      
      const localPath = await SelectSaveDirectory(selectedFile.Name);
      if (!localPath) {
        setIsPulling(false);
        return;
      }

      toastId = toast.loading(`Pulling ${selectedFile.Name}...`, { description: `From: ${remotePath}` });
      
      const output = await PullFile(remotePath, localPath);
      toast.success("Pull Complete", { description: `Saved to ${localPath}`, id: toastId });
    } catch (error) {
      console.error("Pull error:", error);
      if (toastId) {
        toast.error("Pull Failed", { description: String(error), id: toastId });
      } else {
        toast.error("Pull Failed", { description: String(error) });
      }
    }
    setIsPulling(false);
  };
  
  const isPullDisabled = isPulling || !selectedFile || (selectedFile.Type !== 'File' && selectedFile.Type !== 'Directory');


  return (
    <div className="flex flex-col h-full gap-4">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            File Explorer
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => loadFiles(currentPath)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button variant="default" onClick={handlePush} disabled={isPushing || isLoading}>
              {isPushing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Push (Upload)
            </Button>
            <Button variant="default" onClick={handlePull} disabled={isPullDisabled || isLoading}>
              {isPulling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Pull (Download)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <Button variant="ghost" size="icon" onClick={handleBackClick} disabled={currentPath === '/' || isLoading}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <p className="font-mono text-sm">{currentPath}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex-1 flex">
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : fileList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      This directory is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  fileList.map((file) => (
                    <TableRow 
                      key={file.Name}
                      onDoubleClick={() => handleRowDoubleClick(file)}
                      onClick={() => handleRowClick(file)}
                      data-state={selectedFile?.Name === file.Name ? 'selected' : ''}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        {file.Type === 'Directory' ? (
                          <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{file.Name}</TableCell>
                      <TableCell>{file.Size}</TableCell>
                      <TableCell>{file.Date}</TableCell>
                      <TableCell>{file.Time}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
