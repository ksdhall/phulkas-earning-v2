// src/auth.ts
// This file configures NextAuth.js and exports the auth helper and handlers.

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Define your authentication options
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // This is where you would typically query your database
        // to find a user with the provided credentials.
        // For now, we'll use a hardcoded default user.
        const defaultUser = { username: "mari", password: "admin123" };

        console.log("Auth: authorize function called with credentials:", credentials);

        if (credentials?.username === defaultUser.username && credentials?.password === defaultUser.password) {
          // If credentials are valid, return the user object.
          // The user object should at least have an 'id'.
          console.log("Auth: Credentials valid, returning user");
          return { id: "1", name: "mari", email: "mari@example.com" };
        } else {
          // If credentials are invalid, return null.
          console.log("Auth: Invalid credentials");
          return null;
        }
      }
    })
    // Add other providers here (e.g., GoogleProvider, GitHubProvider)
  ],
  // Configure pages (e.g., signIn page)
  pages: {
    signIn: '/', // Specify your custom sign-in page route
    error: '/api/auth/error', // Explicitly set error page to NextAuth's default
  },
  // Configure session strategy
  session: {
    strategy: "jwt", // Use JWT for session management
  },
  // Specify the secret for signing tokens
  secret: process.env.NEXTAUTH_SECRET,
  // Add callbacks if needed (e.g., jwt, session)
  // callbacks: {
  //   async jwt({ token, user }) {
  //     // Persist the OAuth access_token and the user id to the JWT the first time
  //     if (user) {
  //       token.id = user.id;
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     // Send properties to the client, such as an access_token and user id from a JWT.
  //     session.user.id = token.id as string;
  //     return session;
  //   }
  // },
  // Add debug logging if needed
  // debug: process.env.NODE_ENV === "development", // Uncomment for detailed debug logs
};

// Create the NextAuth instance, which provides both handlers and auth
const { handlers, auth } = NextAuth(authOptions);

// Export handlers for the API route handler file
export { handlers };

// Export auth helper for Server Components (like layout.tsx) - though getSession is preferred
export { auth };
