import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions"; // importamos la configuración desde lib

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };