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

          // Intentar bcrypt; si falla por binario, usar bcryptjs como fallback
          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, user.password);
          } catch (e) {
            console.log("[auth][authorize] bcrypt.compare error, falling back to bcryptjs:", e?.message);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const bcryptjs = require("bcryptjs");
            isValid = bcryptjs.compareSync(credentials.password, user.password);
          }

          console.log("[auth][authorize] password valid:", !!isValid, "for:", email);
          if (!isValid) return null;

          console.log("[auth][authorize] success:", email); return {
            id: user.id,
            email: user.email,
            name: user.name,
            store: user.stores?.[0]?.name || "",
            storeCode: user.stores?.[0]?.code || "",
          };
        } catch (err) {
          console.error("[auth][authorize] unexpected error:", err);
          return null;
        }
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
        console.log("[next-auth][jwt] created token for:", token.email ?? token.id);
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
        console.log("[next-auth][session] session for:", session.user.email ?? session.user.id);
      }
      return session;
    },
  },

  // Configuración de cookies: explícita y con secure true (HTTPS)
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        // Si necesitas soporte para subdominios, descomenta y ajusta:
        // domain: process.env.NODE_ENV === "production" ? "mi-tienda-app-theta.vercel.app" : undefined,
      },
    },
  },

  // No incluir el valor aquí; usar process.env en tu entorno
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
