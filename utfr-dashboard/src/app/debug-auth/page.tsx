"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Check environment variables (only the ones that should be available)
    setEnvVars({
      hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
      nextAuthUrl: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">NextAuth Debug Page</h1>
        
        <div className="space-y-6">
          {/* Session Status */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Session Status</h2>
            <div className="space-y-2 text-gray-300">
              <div>Status: <span className="text-blue-400">{status}</span></div>
              {session ? (
                <>
                  <div>User: <span className="text-green-400">{session.user?.email}</span></div>
                  <div>Name: <span className="text-green-400">{session.user?.name}</span></div>
                  <div>Access Token: <span className="text-yellow-400">{(session as any).access_token ? 'Present' : 'Missing'}</span></div>
                </>
              ) : (
                <div className="text-red-400">Not authenticated</div>
              )}
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Environment Variables</h2>
            <div className="space-y-2 text-gray-300">
              <div>Client ID Available: <span className={envVars.hasClientId ? 'text-green-400' : 'text-red-400'}>{envVars.hasClientId ? 'Yes' : 'No'}</span></div>
              <div>Client Secret Available: <span className={envVars.hasClientSecret ? 'text-green-400' : 'text-red-400'}>{envVars.hasClientSecret ? 'Yes' : 'No'}</span></div>
              <div>NextAuth URL: <span className="text-blue-400">{envVars.nextAuthUrl || 'Not set'}</span></div>
            </div>
          </div>

          {/* OAuth Configuration Check */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">OAuth Configuration</h2>
            <div className="space-y-2 text-gray-300">
              <div>Expected Redirect URI: <span className="text-blue-400">http://localhost:3000/api/auth/callback/google</span></div>
              <div>Expected JavaScript Origin: <span className="text-blue-400">http://localhost:3000</span></div>
              <div className="text-yellow-400 mt-4">
                ⚠️ Make sure these match exactly in your Google Cloud Console
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Test Authentication</h2>
            <div className="space-x-4">
              {!session ? (
                <button
                  onClick={() => signIn('google')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Sign In with Google
                </button>
              ) : (
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Google Cloud Console Checklist</h2>
            <div className="space-y-2 text-gray-300">
              <div>✅ Go to: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Cloud Console</a></div>
              <div>✅ Find your OAuth 2.0 Client ID: <span className="text-yellow-400">766435327880-f6jdhint5eehn9flus8meatoqek0i4ip.apps.googleusercontent.com</span></div>
              <div>✅ Click on it to edit</div>
              <div>✅ In "Authorized redirect URIs", add: <span className="text-green-400">http://localhost:3000/api/auth/callback/google</span></div>
              <div>✅ In "Authorized JavaScript origins", add: <span className="text-green-400">http://localhost:3000</span></div>
              <div>✅ Save the changes</div>
              <div>✅ Wait 1-2 minutes for changes to propagate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
