// src/lib/authOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma";
import bcrypt from "bcrypt";

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
        // Validaciones básicas de entrada
        if (!credentials?.email || !credentials?.password) {
          // Credenciales incompletas -> fallo de autenticación
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();

        try {
          // Buscar usuario por email
          const user = await prisma.user.findUnique({
            where: { email },
            include: { stores: true },
          });

          if (!user) {
            // Usuario no existe
            return null;
          }

          if (!user.password) {
            // Usuario creado por OAuth u otro método sin contraseña local
            return null;
          }

          // Bloquear login si la cuenta no está verificada
          if (!user.emailVerified) {
            // Caso esperado: devolver error claro para el cliente
            // Lanzamos la excepción para que NextAuth la propague como res.error
            throw new Error("Cuenta no verificada");
          }

          // Comparar contraseña (bcrypt nativo, con fallback a bcryptjs si falla)
          let isValid = false;
          try {
            isValid = await bcrypt.compare(credentials.password, user.password);
          } catch (bcryptErr) {
            // Fallback a bcryptjs en entornos donde bcrypt binario falla
            try {
              // require dinámico para evitar bundling en entornos donde no se necesita
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const bcryptjs = require("bcryptjs");
              isValid = bcryptjs.compareSync(credentials.password, user.password);
            } catch (fallbackErr) {
              // Si ambos fallan, tratar como error interno
              console.error("[auth][authorize] password compare error:", fallbackErr);
              throw new Error("Error interno de autenticación");
            }
          }

          if (!isValid) {
            // Contraseña inválida
            return null;
          }

          // Devolver el objeto de usuario que NextAuth almacenará en token/session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            store: user.stores?.[0]?.name || "",
            storeCode: user.stores?.[0]?.code || "",
            emailVerified: user.emailVerified ?? false,
          };
        } catch (err) {
          // Si es un error esperado (por ejemplo "Cuenta no verificada"), relanzarlo
          if (err?.message === "Cuenta no verificada") {
            // No lo marcamos como "unexpected" en logs; es un flujo válido
            throw err;
          }

          // Para errores inesperados, loguear y devolver null o lanzar un error genérico
          console.error("[auth][authorize] unexpected error:", err);
          // Lanzar un error genérico para que NextAuth devuelva un mensaje controlado
          throw new Error("Error interno de autenticación");
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
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
