import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  debug: true, // Enable debug mode
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Add scopes you need for Google Drive access
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
          access_type: "offline",          // Get refresh token
          prompt: "consent",               // Ensure refresh token during dev
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token; // May be undefined except first login
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).access_token = token.access_token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
