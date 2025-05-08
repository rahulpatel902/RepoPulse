import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

// Check for credentials only in runtime, not during build
const checkCredentials = () => {
  if (process.env.NODE_ENV !== 'production' || process.env.NETLIFY) {
    if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
      console.warn('Missing GitHub OAuth credentials');
    }
  }
};

// Only run the check in a browser environment, not during build
if (typeof window === 'undefined') {
  // This is server-side, but we'll only check at runtime
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    checkCredentials();
  }
}

const handler = NextAuth({
  debug: true,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign-in attempt:', { user, account, profile });
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log('JWT Callback:', { token, account, profile });
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('Session Callback:', { session, token });
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };