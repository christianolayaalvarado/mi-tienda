// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * NextAuth handler for App Router.
 * Exportamos GET y POST para que Next pueda enrutar correctamente.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
