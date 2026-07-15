// src/lib/authOptions.js
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import bcrypt from "bcrypt";

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
const IS_PROD = process.env.NODE_ENV === "production";

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
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

          const isValid = await bcrypt.compare(credentials.password, user.password);

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
    },

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : []),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        try {
          const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { stores: true },
          });

          if (existingUser) {
            user.id = existingUser.id;
            return true;
          }

          const storeCode = `STORE-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
          const newUser = await prisma.user.create({
            data: {
              email,
              name: user.name || null,
              image: user.image || null,
              role: "SELLER",
              emailVerified: true,
              stores: {
                create: {
                  name: `${user.name || "Mi Tienda"} Store`,
                  code: storeCode,
                },
              },
            },
            include: { stores: true },
          });

          user.id = newUser.id;
          return true;
        } catch (err) {
          console.error("[auth][signIn] google error:", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }
      if (account?.provider === "google" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email.toLowerCase() },
            include: { stores: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.store = dbUser.stores?.[0]?.name || "";
            token.storeCode = dbUser.stores?.[0]?.code || "";
            token.emailVerified = dbUser.emailVerified ?? false;
          }
        } catch (err) {
          console.error("[auth][jwt] google lookup error:", err);
        }
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
          image: token.picture,
          store: token.store,
          storeCode: token.storeCode,
          emailVerified: token.emailVerified ?? false,
        };
      }
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
};

export default authOptions;
