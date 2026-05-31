import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Node.js-only imports (no bcrypt, no Prisma).
// Used exclusively by middleware.ts which runs on the Edge runtime.
// The full auth config (with bcrypt + Prisma adapter) lives in auth.ts.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/dashboard")) {
        if (!isLoggedIn) return false;
      }

      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationSlug = token.organizationSlug as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
