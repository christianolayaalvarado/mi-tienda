// src/lib/authOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcrypt";
import prisma from "./prisma";

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
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[auth][authorize] missing credentials");
            return null;
          }

          const email = credentials.email.toLowerCase();
          console.log("[auth][authorize] lookup:", email);

          const user = await prisma.user.findUnique({
            where: { email },
            include: { stores: true },
          });

          if (!user) {
            console.log("[auth][authorize] user not found:", email);
            return null;
          }

          if (!user.password) {
            console.log("[auth][authorize] user has no password:", email);
            return null;
          }

          // 🔒 Bloquear login si no está verificado
          if (!user.emailVerified) {
            console.log("[auth][authorize] user not verified:", email);
            throw new Error("Cuenta no verificada");
          }

          // Validar contraseña
          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, user.password);
          } catch (e) {
            console.log("[auth][authorize] bcrypt.compare error, falling back to bcryptjs:", e?.message);
            const bcryptjs = require("bcryptjs");
            isValid = bcryptjs.compareSync(credentials.password, user.password);
          }

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            store: user.stores?.[0]?.name || "",
            storeCode: user.stores?.[0]?.code || "",
            emailVerified: user.emailVerified, // 🔹 añadimos este campo
          };
        } catch (err) {
          console.error("[auth][authorize] unexpected error:", err);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 día
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
        token.emailVerified = user.emailVerified ?? token.emailVerified; // 🔹 persistimos en el token
        console.log("[next-auth][jwt] created token for:", token.email ?? token.id);
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
          emailVerified: token.emailVerified, // 🔹 disponible en session.user
        };
        console.log("[next-auth][session] session for:", session.user.email ?? session.user.id);
      }
      return session;
    },
  },

  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
