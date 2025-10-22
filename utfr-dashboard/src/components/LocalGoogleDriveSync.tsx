"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  FileText,
  Calendar,
  MapPin,
  Upload,
  Info
} from "lucide-react";

interface TestDayFolder {
  name: string;
  path: string;
  xrkFiles: XRKFile[];
}

interface XRKFile {
  name: string;
  size: number;
  lastModified: number;
  path: string;
  file?: File; // keep original handle for reading when needed
}

interface LocalSyncStatus {
  isConnected: boolean;
  isScanning: boolean;
  totalTestDays: number;
  totalXRKFiles: number;
  lastScanTime?: Date;
  error?: string;
}

export default function LocalGoogleDriveSync({ onDataImported }: { onDataImported: (data: any) => void }) {
  const [syncStatus, setSyncStatus] = useState<LocalSyncStatus>({
    isConnected: false,
    isScanning: false,
    totalTestDays: 0,
    totalXRKFiles: 0
  });
  const [testDayFolders, setTestDayFolders] = useState<TestDayFolder[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [globalSetupFiles, setGlobalSetupFiles] = useState<File[]>([]);
  const [liveSyncEnabled, setLiveSyncEnabled] = useState<boolean>(false);
  const liveSyncRef = useRef<number | null>(null);
  const importedRunPathsRef = useRef<Set<string>>(new Set());
  const importedSetupNamesRef = useRef<Set<string>>(new Set());
  // File System Access API handles for writing (optional)
  const [baseWriteHandle, setBaseWriteHandle] = useState<any>(null);
  const [writeFolderLabel, setWriteFolderLabel] = useState<string>("");
  const [newDayDate, setNewDayDate] = useState<string>("");
  const [newDayVenue, setNewDayVenue] = useState<string>("");

  // Scan for test day folders in the selected directory
  const scanForTestDayFolders = async (files: FileList) => {
    try {
      setSyncStatus(prev => ({ ...prev, isScanning: true, error: undefined }));
      setStatusMessage("Scanning for test day folders...");
      setProgress(10);

      const testDayFolders: TestDayFolder[] = [];
      const fileArray = Array.from(files);
      
      // Group files by their full directory path to handle nested folders
      const directoryMap = new Map<string, File[]>();
      const detectedGlobalSetups: File[] = [];
      
      for (const file of fileArray) {
        const relPath = file.webkitRelativePath;
        const pathParts = relPath.split('/');
        if (pathParts.length >= 2) {
          // Detect global setups under a folder named "Setups"
          if (relPath.toLowerCase().includes('/setups/') || pathParts[0].toLowerCase() === 'setups') {
            if (file.name.toLowerCase().endsWith('.json')) {
              detectedGlobalSetups.push(file);
            }
          }
          // Find the test day folder by looking for the pattern in any part of the path
          let testDayFolder = '';
          for (let i = 0; i < pathParts.length - 1; i++) {
            const testDayMatch = pathParts[i].match(/^(\d{4}-\d{1,2}-\d{1,2})\s*[-_]\s*(.+)$/);
            if (testDayMatch) {
              testDayFolder = pathParts[i];
              break;
            }
          }
          
          if (testDayFolder) {
            if (!directoryMap.has(testDayFolder)) {
              directoryMap.set(testDayFolder, []);
            }
            directoryMap.get(testDayFolder)!.push(file);
          }
        }
      }

      setProgress(30);
      setStatusMessage(`Found ${directoryMap.size} test day folders, scanning for runs and setups...`);

      // Process each test day folder
      for (const [testDayFolderName, files] of directoryMap) {
        const testDayMatch = testDayFolderName.match(/^(\d{4}-\d{1,2}-\d{1,2})\s*[-_]\s*(.+)$/);
        
        if (testDayMatch) {
          const [, date, venue] = testDayMatch;
          
          // Look for XRK files in this test day folder (supports "runs" or "Data Dump" or any subdir)
          const xrkFiles: XRKFile[] = [];
          let hasTestDayJson = false;
          
          for (const file of files) {
            // Accept .xrk files anywhere under the test day; supports runs/, datadump/, Data Dump/
            if (file.name.toLowerCase().endsWith('.xrk')) {
              xrkFiles.push({
                name: file.name,
                size: file.size,
                lastModified: file.lastModified,
                path: file.webkitRelativePath,
                file
              });
            } else if (file.name.toLowerCase() === 'testday.json') {
              hasTestDayJson = true;
            }
          }

          // Include test day if it has XRK files or a testday.json (newly created days)
          if (xrkFiles.length > 0 || hasTestDayJson) {
            testDayFolders.push({
              name: testDayFolderName,
              path: testDayFolderName,
              xrkFiles
            });
          }
        }
      }

      setProgress(70);
      setStatusMessage(`Found ${testDayFolders.length} test day folders with XRK files`);

      setTestDayFolders(testDayFolders);
      setGlobalSetupFiles(detectedGlobalSetups);
      setSyncStatus(prev => ({
        ...prev,
        totalTestDays: testDayFolders.length,
        totalXRKFiles: testDayFolders.reduce((sum, folder) => sum + folder.xrkFiles.length, 0),
        lastScanTime: new Date(),
        isScanning: false,
        isConnected: true
      }));

      setProgress(100);
      setStatusMessage(`Successfully found ${testDayFolders.length} test day folders with ${testDayFolders.reduce((sum, folder) => sum + folder.xrkFiles.length, 0)} XRK files`);

    } catch (error) {
      console.error('Error scanning test day folders:', error);
      setSyncStatus(prev => ({
        ...prev,
        isScanning: false,
        error: error instanceof Error ? error.message : 'Failed to scan test day folders'
      }));
      setStatusMessage("Failed to scan test day folders");
    }
  };

  // Handle folder selection
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFolderPath(files[0].webkitRelativePath.split('/')[0] || 'Selected Folder');
      scanForTestDayFolders(files);
    }
  };

  // Live sync: simple polling rescan every 15s when enabled
  React.useEffect(() => {
    if (!liveSyncEnabled) {
      if (liveSyncRef.current) {
        window.clearInterval(liveSyncRef.current);
        liveSyncRef.current = null;
      }
      return;
    }
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) return;
    const tick = async () => {
      try {
        await scanForTestDayFolders(input.files!);
      } catch {}
    };
    tick();
    liveSyncRef.current = window.setInterval(tick, 15000);
    return () => {
      if (liveSyncRef.current) {
        window.clearInterval(liveSyncRef.current);
        liveSyncRef.current = null;
      }
    };
  }, [liveSyncEnabled]);

  // Request write access to a base folder ("UTFR Test Data")
  const requestWriteAccess = async () => {
    try {
      // @ts-ignore - File System Access API
      const handle = await (window as any).showDirectoryPicker();
      if (!handle) return;
      setBaseWriteHandle(handle);
      setWriteFolderLabel(handle.name || "Selected Folder");
      setStatusMessage(`Write access granted to: ${handle.name}`);
      // Expose globally so other components (e.g., Setup tab) can write
      (window as any).utfrWriteHandle = handle;
      try {
        // Ensure Setups directory exists at the root
        // @ts-ignore
        await handle.getDirectoryHandle('Setups', { create: true });
      } catch {}
    } catch (err) {
      console.warn("Write access cancelled or not supported", err);
      setStatusMessage("Write access was not granted.");
    }
  };

  // Ensure subdirectory exists
  const ensureSubdir = async (parent: any, dirName: string) => {
    // @ts-ignore
    return await parent.getDirectoryHandle(dirName, { create: true });
  };

  // Write a small JSON file
  const writeJsonFile = async (dirHandle: any, fileName: string, data: any) => {
    // @ts-ignore
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    await writable.close();
  };

  // Create test day structure on disk
  const createTestDayOnDisk = async () => {
    if (!baseWriteHandle) {
      setStatusMessage("Please grant write access to your UTFR Test Data folder first.");
      return;
    }
    if (!newDayDate || !newDayVenue) {
      setStatusMessage("Please enter both a Date and a Venue.");
      return;
    }
    try {
      const folderName = `${newDayDate} - ${newDayVenue}`;
      // @ts-ignore
      const dayDir = await baseWriteHandle.getDirectoryHandle(folderName, { create: true });
      const runsDir = await ensureSubdir(dayDir, 'Data Dump');
      await writeJsonFile(dayDir, 'testday.json', { date: newDayDate, track: newDayVenue, createdAt: new Date().toISOString() });
      setStatusMessage(`Created test day folder: ${folderName} (with Data Dump/)`);
    } catch (err) {
      console.error('Failed to create test day folder:', err);
      setStatusMessage('Failed to create test day folder. Your browser may not support folder write access.');
    }
  };

  // Import data from a specific test day (runs only)
  const importTestDayData = async (testDay: TestDayFolder) => {
    try {
      setStatusMessage(`Importing data from ${testDay.name}...`);
      
      // Create data structure matching the main dashboard expectations
      const newRuns = testDay.xrkFiles
        .filter(file => !importedRunPathsRef.current.has(file.path))
        .map((file, index) => ({
          id: `local-${testDay.name}-${index + 1}`,
          testDayId: `local-${testDay.name}`,
          runNumber: index + 1,
          timestamp: new Date().toISOString(),
          track: testDay.name.split(' - ')[1] || 'Unknown',
          drivers: ['Unknown'],
          notes: `Imported from ${file.name}`,
          tags: ['imported', 'xrk']
        }));

      // mark imported
      newRuns.forEach((_, idx) => {
        const f = testDay.xrkFiles[idx];
        if (f) importedRunPathsRef.current.add(f.path);
      });

      const importedData = {
        testDays: [{
          id: `local-${testDay.name}`,
          date: testDay.name.split(' - ')[0], // Extract date from folder name
          track: testDay.name.split(' - ')[1] || 'Unknown',
          runs: newRuns.length
        }],
        runs: newRuns,
        setups: [],
        tireSets: []
      };

      // Always send test day (dedupe on receiver). Runs may be empty for a new day.
      onDataImported(importedData);
      setStatusMessage(`Imported test day "${testDay.name}" with ${newRuns.length} new runs`);
      
    } catch (error) {
      console.error('Error importing test day data:', error);
      setStatusMessage(`Failed to import data from ${testDay.name}`);
    }
  };

  // Import global setups from Setups/ folder
  const importGlobalSetups = async () => {
    try {
      setStatusMessage("Importing global setups...");
      const importedSetups: any[] = [];
      for (const file of globalSetupFiles) {
        if (importedSetupNamesRef.current.has(file.name)) continue;
        try {
          const content = await file.text();
          const setupData = JSON.parse(content);
          importedSetups.push({
            id: setupData.id || `setup-${file.name.replace(/\.json$/i, '')}`,
            name: setupData.name || file.name.replace(/\.json$/i, ''),
            timestamp: new Date().toISOString(),
            ...setupData
          });
          importedSetupNamesRef.current.add(file.name);
        } catch (err) {
          console.warn(`Failed to parse setup file ${file.name}:`, err);
        }
      }
      if (importedSetups.length > 0) {
        onDataImported({ testDays: [], runs: [], setups: importedSetups, tireSets: [] });
      }
      setStatusMessage(`Imported ${importedSetups.length} global setups`);
    } catch (error) {
      console.error('Error importing global setups:', error);
      setStatusMessage('Failed to import global setups');
    }
  };

  return (
    <Card className="bg-gray-900 border border-gray-800 shadow-lg">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-xl font-light text-white tracking-wide flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          LOCAL GOOGLE DRIVE SYNC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-4">
          {/* Setup Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-gray-300">
                <h4 className="font-medium text-blue-400">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Install Google Drive desktop app on your computer</li>
                  <li>Create a shared folder: "UTFR Test Data"</li>
                  <li>Organize folders as: <code className="bg-gray-800 px-1 rounded">YYYY-M-D - Venue</code> (e.g., "2025-4-11 - Villa")</li>
                  <li>Put XRK files in subfolders (e.g., "datadump")</li>
                  <li>Select the "UTFR Test Data" folder below</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncStatus.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-sm text-gray-300">
                {syncStatus.isConnected ? `Connected to: ${selectedFolderPath}` : "Not connected"}
              </span>
            </div>
            {syncStatus.lastScanTime && (
              <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/50">
                Last scan: {syncStatus.lastScanTime.toLocaleTimeString()}
              </Badge>
            )}
          </div>

        {/* Status Message */}
          {statusMessage && (
            <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded-lg">
              {statusMessage}
            </div>
          )}

          {/* Progress Bar */}
          {syncStatus.isScanning && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-gray-400 text-center">{progress}%</div>
            </div>
          )}

          {/* Error Message */}
          {syncStatus.error && (
            <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-800">
              {syncStatus.error}
            </div>
          )}

        {/* Folder Selection */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFolderSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => {
                const el = fileInputRef.current as HTMLInputElement | null;
                if (el) {
                  // Set non-standard folder selection flags at runtime to avoid TS complaints
                  el.setAttribute('webkitdirectory', '');
                  el.setAttribute('directory', '');
                  el.click();
                }
              }}
              disabled={syncStatus.isScanning}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-mono tracking-wider"
            >
              <Upload className="w-4 h-4 mr-2" />
              SELECT GOOGLE DRIVE FOLDER
            </Button>

            <div className="flex items-center justify-between gap-2">
              <Button
                onClick={() => {
                  const input = fileInputRef.current;
                  if (input && input.files && input.files.length > 0) {
                    scanForTestDayFolders(input.files);
                  }
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Rescan Now
              </Button>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={liveSyncEnabled}
                  onChange={(e) => setLiveSyncEnabled(e.target.checked)}
                />
                Live Sync (every 15s)
              </label>
            </div>
          </div>

          {/* Global Setups Summary */}
          {globalSetupFiles.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Global Setups</h4>
                <Badge variant="outline" className="text-purple-300 border-purple-400/50">
                  {globalSetupFiles.length} files
                </Badge>
              </div>
              <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                {globalSetupFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span>{file.name}</span>
                    <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
              <Button onClick={importGlobalSetups} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm">
                <Download className="w-3 h-3 mr-2" />
                IMPORT GLOBAL SETUPS
              </Button>
            </div>
          )}

          {/* Write Access & Create Test Day */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Write to Google Drive</h4>
              {writeFolderLabel && (
                <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-400/50">{writeFolderLabel}</Badge>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                onClick={requestWriteAccess}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Grant write access (select UTFR Test Data)
              </Button>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="YYYY-M-D"
                  value={newDayDate}
                  onChange={(e)=>setNewDayDate(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Venue"
                  value={newDayVenue}
                  onChange={(e)=>setNewDayVenue(e.target.value)}
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200"
                />
                <Button onClick={createTestDayOnDisk} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Test Day Folder
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Creates <code className="bg-gray-900 px-1 rounded">YYYY-M-D - Venue/runs</code> and <code className="bg-gray-900 px-1 rounded">setups</code> with a metadata file.</div>
          </div>

          {/* Test Day Folders */}
          {testDayFolders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Test Day Folders</h3>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
                  {testDayFolders.length} folders
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testDayFolders.map((folder, index) => (
                  <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{folder.name}</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
                        {folder.xrkFiles.length} files
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {folder.xrkFiles.map((file, fileIndex) => (
                        <div key={fileIndex} className="flex items-center gap-2 text-sm text-gray-300">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span>{file.name}</span>
                          <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => importTestDayData(folder)}
                      disabled={folder.xrkFiles.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      IMPORT DATA
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import All Button */}
          {testDayFolders.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">Import All Test Days</h4>
                <Button
                  onClick={() => {
                    testDayFolders.forEach(folder => importTestDayData(folder));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  IMPORT ALL ({testDayFolders.length} test days)
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Test Days: {syncStatus.totalTestDays}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">XRK Files: {syncStatus.totalXRKFiles}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
