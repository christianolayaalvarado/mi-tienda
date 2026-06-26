// src/lib/authOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcrypt";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
const IS_PROD = process.env.NODE_ENV === "production";

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { stores: true },
          });

          if (!user || !user.password) return null;
          if (!user.emailVerified) throw new Error("Cuenta no verificada");

          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, user.password);
          } catch (bcryptErr) {
            try {
              const bcryptjs = require("bcryptjs");
              isValid = bcryptjs.compareSync(credentials.password, user.password);
            } catch (fallbackErr) {
              console.error("[auth][authorize] password compare error:", fallbackErr);
              throw new Error("Error interno de autenticación");
            }
          }

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            store: user.stores?.[0]?.name || "",
            storeCode: user.stores?.[0]?.code || "",
            emailVerified: user.emailVerified ?? false,
          };
        } catch (err) {
          if (err?.message === "Cuenta no verificada") throw err;
          console.error("[auth][authorize] unexpected error:", err);
          throw new Error("Error interno de autenticación");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.store = user.store ?? token.store;
        token.storeCode = user.storeCode ?? token.storeCode;
        token.emailVerified = user.emailVerified ?? token.emailVerified;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          store: token.store,
          storeCode: token.storeCode,
          emailVerified: token.emailVerified ?? false,
        };
      }
      try {
        console.log("[NEXTAUTH][session] session callback for user:", session?.user?.email || "<no-email>", "time:", new Date().toISOString());
      } catch (e) { }
      return session;
    },
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: COOKIE_SAMESITE,
        path: "/",
        secure: IS_PROD,
        domain: COOKIE_DOMAIN,
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,

  // NOTE: A strong JWT secret is enforced by getJwtSecret.js in custom JWT routes.
  // NextAuth uses NEXTAUTH_SECRET which should also be set to a strong value.
};

export default authOptions;
