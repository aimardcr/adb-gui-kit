import React, { useState, useEffect } from 'react';
import path from 'path-browserify';

// Impor Wails Bindings
import { 
  ListFiles, 
  PushFile, 
  PullFile, 
  SelectFileToPush, 
  SelectSaveDirectory, 
  SelectDirectoryForPull,
  SelectDirectoryToPush // <-- Fungsi baru kita
} from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

// Impor Komponen UI
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
import { Loader2, RefreshCw, Upload, Download, Folder, File, ArrowUp, FolderUp } from "lucide-react"; // <-- Ikon 'FolderUp' baru

type FileEntry = backend.FileEntry;

const getBaseName = (targetPath: string) => {
  if (!targetPath) {
    return "";
  }
  const normalized = targetPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const segments = normalized.split("/");
  return segments[segments.length - 1] ?? normalized;
};

export function ViewFileExplorer() {
  // State
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/sdcard/');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pisahkan state loading
  const [isPushingFile, setIsPushingFile] = useState(false);
  const [isPushingFolder, setIsPushingFolder] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // --- FUNGSI CORE ---

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    setSelectedFile(null); 
    try {
      const files = await ListFiles(path);
      // Perbaikan bug crash
      if (!files) {
        setFileList([]);
        setCurrentPath(path);
        setIsLoading(false);
        return;
      }
      
      files.sort((a, b) => {
        if (a.Type === 'Directory' && b.Type !== 'Directory') return -1;
        if (a.Type !== 'Directory' && b.Type === 'Directory') return 1;
        return a.Name.localeCompare(b.Name);
      });
      
      setFileList(files);
      setCurrentPath(path);
    } catch (error) {
      console.error("Failed to list files:", error);
      toast.error("Failed to list files", { description: String(error) });
      // Jika gagal (cth: "Operation not permitted"), jangan ubah path
      setCurrentPath(currentPath);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, []);

  // --- FUNGSI HANDLER ---

  const handleRowClick = (file: FileEntry) => {
    setSelectedFile(file);
  };

  const handleRowDoubleClick = (file: FileEntry) => {
    if (file.Type === 'Directory') {
      // Pastikan path digabung dengan benar
      const newPath = path.posix.join(currentPath, file.Name) + '/';
      loadFiles(newPath);
    }
  };

  const handleBackClick = () => {
    if (currentPath === '/') return;
    // Gunakan 'path.posix.join' untuk menangani path '..'
    const newPath = path.posix.join(currentPath, '..') + '/';
    loadFiles(newPath);
  };

  // --- LOGIKA PUSH/PULL BARU ---

  /**
   * Menangani 'Push' (Upload) FILE
   */
  const handlePushFile = async () => {
    setIsPushingFile(true);
    let toastId: string | number = "";
    try {
      const localPath = await SelectFileToPush();
      if (!localPath) {
        setIsPushingFile(false);
        return; 
      }

      const fileName = getBaseName(localPath);
      const remotePath = path.posix.join(currentPath, fileName);
      
      toastId = toast.loading(`Pushing ${fileName}...`, { description: `To: ${remotePath}` });

      const output = await PushFile(localPath, remotePath);
      toast.success("File Push Complete", { description: output, id: toastId });
      loadFiles(currentPath);
    } catch (error) {
      console.error("Push file error:", error);
      toast.error("File Push Failed", { description: String(error), id: toastId });
    }
    setIsPushingFile(false);
  };

  /**
   * Menangani 'Push' (Upload) FOLDER
   */
  const handlePushFolder = async () => {
    setIsPushingFolder(true);
    let toastId: string | number = "";
    try {
      // 1. Pilih folder dari PC
      const localFolderPath = await SelectDirectoryToPush();
      if (!localFolderPath) {
        setIsPushingFolder(false);
        return; // Dibatalkan
      }

      // 'adb push' akan menyalin folder *ke dalam* currentPath
      // e.g., adb push "C:\MyFolder" /sdcard/
      // Hasil: /sdcard/MyFolder
      const remotePath = currentPath;
      const folderName = getBaseName(localFolderPath);
      
      toastId = toast.loading(`Pushing folder ${folderName}...`, { description: `To: ${remotePath}` });

      // 2. Push folder ke perangkat
      const output = await PushFile(localFolderPath, remotePath);
      toast.success("Folder Push Complete", { description: output, id: toastId });
      
      // 3. Refresh
      loadFiles(currentPath);
    } catch (error) {
      console.error("Push folder error:", error);
      toast.error("Folder Push Failed", { description: String(error), id: toastId });
    }
    setIsPushingFolder(false);
  };


  /**
   * Menangani 'Pull' (Download) FILE atau FOLDER
   */
  const handlePull = async () => {
    if (!selectedFile) {
      toast.error("No file or folder selected to pull.");
      return;
    }
    if (selectedFile.Type !== 'File' && selectedFile.Type !== 'Directory') {
      toast.error("Cannot pull this item type.", { description: `Selected type: ${selectedFile.Type}`});
      return;
    }

    setIsPulling(true);
    let toastId: string | number = "";
    try {
      const remotePath = path.posix.join(currentPath, selectedFile.Name);
      let localPath = "";

      // Logika yang diperbaiki dari sebelumnya
      if (selectedFile.Type === 'Directory') {
        toast.info("Select a folder to save the directory into.");
        localPath = await SelectDirectoryForPull(); // Pilih FOLDER tujuan
      } else {
        localPath = await SelectSaveDirectory(selectedFile.Name); // Pilih FILE tujuan
      }

      if (!localPath) {
        setIsPulling(false);
        return; // Dibatalkan
      }
      
      // 'adb pull' akan meng-copy ke 'localPath'
      // Jika localPath adalah folder, ia akan menyalin ke dalamnya.
      // Jika itu file, ia akan menyalin ke file itu.
      // Ini sudah benar.

      toastId = toast.loading(`Pulling ${selectedFile.Name}...`, { description: `From: ${remotePath}` });
      
      const output = await PullFile(remotePath, localPath);
      toast.success("Pull Complete", { description: `Saved to ${localPath}`, id: toastId });
    } catch (error) {
      console.error("Pull error:", error);
      toast.error("Pull Failed", { description: String(error), id: toastId });
    }
    setIsPulling(false);
  };
  
  // Helper loading
  const isBusy = isLoading || isPushingFile || isPushingFolder || isPulling;
  const isPullDisabled = isPulling || !selectedFile || (selectedFile.Type !== 'File' && selectedFile.Type !== 'Directory');

  return (
    <div className="flex flex-col h-full gap-4">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            File Explorer
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => loadFiles(currentPath)} disabled={isBusy}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            
            {/* --- TOMBOL BARU --- */}
            <Button variant="default" onClick={handlePushFile} disabled={isBusy}>
              {isPushingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Push File
            </Button>
            <Button variant="default" onClick={handlePushFolder} disabled={isBusy}>
              {isPushingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderUp className="mr-2 h-4 w-4" />}
              Push Folder
            </Button>
            
            <Button variant="default" onClick={handlePull} disabled={isPullDisabled || isBusy}>
              {isPulling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Pull Selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <Button variant="ghost" size="icon" onClick={handleBackClick} disabled={currentPath === '/' || isBusy}>
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
