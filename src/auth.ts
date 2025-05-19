// src/auth.ts
import NextAuth from "next-auth";
import type { AuthOptions, SessionStrategy } from "next-auth"; // Import SessionStrategy type
import CredentialsProvider from "next-auth/providers/credentials";
// Removed: import { verifyPassword } from "./lib/auth"; // No longer needed for hardcoded
// Removed: import { getUserByEmail } from "./lib/user"; // No longer needed for hardcoded

// Hardcoded credentials for demonstration
const HARDCODED_USERNAME = "test@example.com"; // Replace with your actual hardcoded username
const HARDCODED_PASSWORD = "password"; // Replace with your actual hardcoded password
const HARDCODED_USER_ID = "123"; // Replace with a hardcoded user ID

// Define the AuthOptions configuration
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Attempting to authorize with credentials:", credentials);
        // Check provided credentials against hardcoded values
        if (
          credentials?.username === HARDCODED_USERNAME &&
          credentials?.password === HARDCODED_PASSWORD
        ) {
          console.log("Authorization successful with hardcoded credentials.");
          // If credentials match, return a user object
          // This user object will be available in the session
          return {
            id: HARDCODED_USER_ID, // Use hardcoded ID
            email: HARDCODED_USERNAME, // Use hardcoded username as email
            name: "Hardcoded User", // Optional: Add a name
            // Add any other properties you want in the session user object
          };
        } else {
          console.log("Authorization failed: Invalid credentials.");
          // If credentials do not match, return null
          return null; // Indicate authentication failure
        }
      },
    }),
  ],
  // Configure session management
  session: {
    // Explicitly type the strategy using the imported SessionStrategy type
    strategy: "jwt" as SessionStrategy, // Use "jwt" or "database" as needed, cast to SessionStrategy
  },
  // Specify custom pages
  pages: {
    signIn: "/en", // Redirect to the login page on sign in
    error: "/en", // Redirect to the login page on error
  },
  // Add a secret for signing the JWT
  secret: process.env.NEXTAUTH_SECRET,
  // You might need to add callbacks if you customize session or JWT
  // callbacks: {
  //   async jwt({ token, user }) {
  //     if (user) {
  //       token.id = user.id;
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     if (token) {
  //       session.user.id = token.id;
  //     }
  //     return session;
  //   },
  // },
};

// Create the NextAuth instance, which provides both handlers and auth
const { handlers, auth } = NextAuth(authOptions);

// Export handlers for the API route handler file
export { handlers };

// Export the auth function for server-side session checking
export { auth };
