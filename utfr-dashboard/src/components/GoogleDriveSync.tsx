"use client";

import React, { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  FolderOpen,
  FileText,
  Calendar,
  MapPin
} from "lucide-react";

interface TestDayFolder {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  xrkFiles: XRKFile[];
  error?: string;
}

interface XRKFile {
  id: string;
  name: string;
  size: string;
  modifiedTime: string;
  downloadLink: string;
}

interface DriveSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  totalTestDays: number;
  totalXRKFiles: number;
  lastSyncTime?: Date;
  error?: string;
}

export default function GoogleDriveSync({ onDataImported }: { onDataImported: (data: any) => void }) {
  const { data: session, status } = useSession();
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    isConnected: false,
    isSyncing: false,
    totalTestDays: 0,
    totalXRKFiles: 0
  });
  const [testDayFolders, setTestDayFolders] = useState<TestDayFolder[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Update connection status when session changes
  useEffect(() => {
    setSyncStatus(prev => ({
      ...prev,
      isConnected: !!session,
      error: undefined
    }));
  }, [session]);

  // Search for test day folders in Google Drive
  const searchTestDayFolders = async () => {
    if (!session) {
      setSyncStatus(prev => ({ ...prev, error: "Not authenticated" }));
      return;
    }

    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true, error: undefined }));
      setStatusMessage("Searching for test day folders...");
      setProgress(10);

      const response = await fetch('/api/drive/search-test-days');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search test day folders');
      }

      setProgress(50);
      setStatusMessage(`Found ${data.total} test day folders`);

      setTestDayFolders(data.testDays);
      setSyncStatus(prev => ({
        ...prev,
        totalTestDays: data.total,
        totalXRKFiles: data.testDays.reduce((sum: number, folder: TestDayFolder) => sum + folder.xrkFiles.length, 0),
        lastSyncTime: new Date(),
        isSyncing: false
      }));

      setProgress(100);
      setStatusMessage(`Successfully found ${data.total} test day folders with ${data.testDays.reduce((sum: number, folder: TestDayFolder) => sum + folder.xrkFiles.length, 0)} XRK files`);

    } catch (error) {
      console.error('Error searching test day folders:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to search test day folders'
      }));
      setStatusMessage("Failed to search test day folders");
    }
  };

  // Import data from a specific test day
  const importTestDayData = async (testDay: TestDayFolder) => {
    try {
      setStatusMessage(`Importing data from ${testDay.name}...`);
      
      // Create mock data structure for the imported test day
      const importedData = {
        testDays: [{
          id: testDay.id,
          date: testDay.name.split(' - ')[0], // Extract date from folder name
          venue: testDay.name.split(' - ')[1] || 'Unknown',
          runs: testDay.xrkFiles.map((file, index) => ({
            id: file.id,
            runNumber: index + 1,
            driver: 'Unknown',
            time: '00:00.000',
            notes: `Imported from ${file.name}`,
            xrkFile: file.name,
            downloadLink: file.downloadLink
          }))
        }],
        runs: testDay.xrkFiles.map((file, index) => ({
          id: file.id,
          runNumber: index + 1,
          driver: 'Unknown',
          time: '00:00.000',
          notes: `Imported from ${file.name}`,
          xrkFile: file.name,
          downloadLink: file.downloadLink
        })),
        setups: [],
        tireSets: []
      };

      onDataImported(importedData);
      setStatusMessage(`Successfully imported ${testDay.xrkFiles.length} runs from ${testDay.name}`);
      
    } catch (error) {
      console.error('Error importing test day data:', error);
      setStatusMessage(`Failed to import data from ${testDay.name}`);
    }
  };

  if (status === "loading") {
    return (
      <Card className="bg-gray-900 border border-gray-800 shadow-lg">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-xl font-light text-white tracking-wide flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            GOOGLE DRIVE SYNC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="text-center text-gray-400">Loading authentication...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border border-gray-800 shadow-lg">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-xl font-light text-white tracking-wide flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          GOOGLE DRIVE SYNC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncStatus.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              )}
              <span className="text-sm text-gray-300">
                {syncStatus.isConnected ? `Connected as ${session?.user?.email}` : "Not connected"}
              </span>
            </div>
            {syncStatus.lastSyncTime && (
              <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/50">
                Last sync: {syncStatus.lastSyncTime.toLocaleTimeString()}
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
          {syncStatus.isSyncing && (
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

          {/* Action Buttons */}
          <div className="space-y-2">
            {!syncStatus.isConnected && (
              <Button
                onClick={() => signIn('google')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono tracking-wider"
              >
                <Cloud className="w-4 h-4 mr-2" />
                SIGN IN WITH GOOGLE
              </Button>
            )}

            {syncStatus.isConnected && testDayFolders.length === 0 && (
              <Button
                onClick={searchTestDayFolders}
                disabled={syncStatus.isSyncing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-mono tracking-wider"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                SEARCH TEST DAY FOLDERS
              </Button>
            )}

            {syncStatus.isConnected && (
              <Button
                onClick={() => signOut()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-mono tracking-wider"
              >
                SIGN OUT
              </Button>
            )}
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
                {testDayFolders.map((folder) => (
                  <div key={folder.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{folder.name}</span>
                      </div>
                      <Badge variant="outline" className="text-green-400 border-green-400/50">
                        {folder.xrkFiles.length} files
                      </Badge>
                    </div>
                    
                    {folder.error && (
                      <div className="text-sm text-red-400 mb-2">{folder.error}</div>
                    )}
                    
                    {folder.xrkFiles.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {folder.xrkFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 text-sm text-gray-300">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span>{file.name}</span>
                            <span className="text-gray-500">({file.size} bytes)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
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

          {/* Summary */}
          {syncStatus.totalTestDays > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h4 className="text-white font-medium mb-2">Sync Summary</h4>
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