import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error('Missing GitHub OAuth credentials');
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