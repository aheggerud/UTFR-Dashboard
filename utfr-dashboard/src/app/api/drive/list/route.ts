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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const q = folderId ? `'${folderId}' in parents and trashed = false` : `trashed = false`;

    const { data } = await drive.files.list({
      q,
      pageSize: 50,
      fields: "files(id, name, mimeType, modifiedTime, webViewLink, webContentLink, parents)",
    });

    return NextResponse.json({ files: data.files ?? [] });
  } catch (error) {
    console.error('Error listing Drive files:', error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
