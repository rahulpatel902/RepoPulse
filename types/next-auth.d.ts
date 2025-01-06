import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
    } & DefaultSession["user"];
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id?: string;
  }
}