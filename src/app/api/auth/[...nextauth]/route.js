// src/app/api/auth/[...nextauth]/route.js
import { authOptions } from "@/lib/authOptions";

// __non_webpack_require__ bypasses webpack to use Node.js native require
// This fixes CJS/ESM interop issues with next-auth default export
// eslint-disable-next-line no-undef
const NextAuth = __non_webpack_require__("next-auth").default;

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
