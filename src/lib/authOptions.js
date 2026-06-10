// lib/authOptions.js
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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { stores: true },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          store: user.stores?.[0]?.name || "",
          storeCode: user.stores?.[0]?.code || "",
        };
      },
    }),
  ],

  // Usamos JWT en sesión (ajusta a "database" si prefieres sesiones en DB)
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 1 día
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // Guardar id y datos relevantes en el token JWT al iniciar sesión
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.store = user.store ?? token.store;
        token.storeCode = user.storeCode ?? token.storeCode;
      }
      return token;
    },

    // Exponer id y campos útiles en session.user para que el backend los use
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          store: token.store,
          storeCode: token.storeCode,
        };
      }
      return session;
    },
  },

  // Configuración de cookies: secure solo en producción
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // No incluir el valor aquí; usar process.env en tu entorno
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
