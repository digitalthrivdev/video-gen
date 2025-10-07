import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { logger } from "./logger";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        logger.info('User sign in attempt', {
          email: user.email,
          provider: account?.provider,
          userId: user.id
        });

        // Allow sign in
        return true;
      } catch (error) {
        logger.error('Sign in error', error as Error, {
          email: user.email,
          provider: account?.provider
        });
        return false;
      }
    },
    async session({ session, user }) {
      try {
        // Add user ID to session
        if (session.user) {
          session.user.id = user.id;
          
          // Get user data from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              tokens: true,
              isActive: true,
              isVerified: true,
              role: true
            }
          });

          if (dbUser) {
            session.user.tokens = dbUser.tokens;
            session.user.isActive = dbUser.isActive;
            session.user.isVerified = dbUser.isVerified;
            session.user.role = dbUser.role;
          }
        }

        return session;
      } catch (error) {
        logger.error('Session callback error', error as Error, {
          userId: user.id
        });
        return session;
      }
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async createUser({ user }) {
      logger.info('New user created', {
        userId: user.id,
        email: user.email,
        name: user.name
      });
    },
    async signIn({ user, account, isNewUser }) {
      logger.info('User signed in', {
        userId: user.id,
        email: user.email,
        isNewUser,
        provider: account?.provider
      });
    },
    async signOut({ session, token }) {
      logger.info('User signed out', {
        userId: session?.user?.id || token?.sub,
        email: session?.user?.email
      });
    }
  },
  debug: process.env.NODE_ENV === 'development',
};
