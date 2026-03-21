import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // 🟡 Validación defensiva
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 🔐 Usuario fijo (ADMIN)
        const user = {
          id: "1",
          name: "Admin",
          email: "admin@demo.com",
          password: "123456",
        };

        // Validación
        if (
          credentials.email === user.email &&
          credentials.password === user.password
        ) {
          return user;
        }

        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login", // usa tu UI personalizada
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
        };
      }
      return session;
    },
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };