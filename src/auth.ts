import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";

const HARDCODED_USERNAME = "mari";
const HARDCODED_PASSWORD = "admin123";
const HARDCODED_USER_ID = "123";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.username === HARDCODED_USERNAME &&
          credentials?.password === HARDCODED_PASSWORD
        ) {
          return {
            id: HARDCODED_USER_ID,
            email: HARDCODED_USERNAME,
            name: "Hardcoded User",
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/en",
    error: "/en",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };