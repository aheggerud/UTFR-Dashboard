import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as any).access_token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const oauth2 = new google.auth.OAuth2();
    oauth2.setCredentials({ access_token: (session as any).access_token });

    const drive = google.drive({ version: "v3", auth: oauth2 });

    // Search for folders matching the test day pattern: YYYY-MM-DD - Venue
    const { data } = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed = false and name contains '-'`,
      pageSize: 100,
      fields: "files(id, name, mimeType, modifiedTime, webViewLink, parents)",
    });

    // Filter folders that match the test day pattern: YYYY-MM-DD - Venue
    const testDayFolders = (data.files ?? []).filter(file => {
      const name = file.name || '';
      return /^\d{4}-\d{2}-\d{2}\s*[-_]\s*(.+)$/.test(name);
    });

    // For each test day folder, look for XRK files in subfolders
    const testDaysWithFiles = await Promise.all(
      testDayFolders.map(async (folder) => {
        try {
          // Look for "datadump" or similar folders within the test day folder
          const { data: subfolders } = await drive.files.list({
            q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id, name)",
          });

          let xrkFiles: any[] = [];
          
          // Search for XRK files in subfolders
          for (const subfolder of subfolders?.files || []) {
            const { data: files } = await drive.files.list({
              q: `'${subfolder.id}' in parents and name contains '.xrk' and trashed = false`,
              fields: "files(id, name, size, modifiedTime, webContentLink)",
            });
            xrkFiles = [...xrkFiles, ...(files?.files || [])];
          }

          return {
            id: folder.id,
            name: folder.name,
            modifiedTime: folder.modifiedTime,
            webViewLink: folder.webViewLink,
            xrkFiles: xrkFiles.map(file => ({
              id: file.id,
              name: file.name,
              size: file.size,
              modifiedTime: file.modifiedTime,
              downloadLink: file.webContentLink,
            })),
          };
        } catch (error) {
          console.error(`Error processing folder ${folder.name}:`, error);
          return {
            id: folder.id,
            name: folder.name,
            modifiedTime: folder.modifiedTime,
            webViewLink: folder.webViewLink,
            xrkFiles: [],
            error: 'Failed to load files',
          };
        }
      })
    );

    return NextResponse.json({ 
      testDays: testDaysWithFiles,
      total: testDaysWithFiles.length 
    });
  } catch (error) {
    console.error('Error searching test day folders:', error);
    return NextResponse.json({ error: "Failed to search test day folders" }, { status: 500 });
  }
}
