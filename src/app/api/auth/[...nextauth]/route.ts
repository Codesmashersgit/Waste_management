import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session }) {
      return session
    },
    async signIn({ user }) {
      // Save user to DB on first login
      if (user.email) {
        try {
          const { createUser } = await import("@/utils/db/actions")
          await createUser(user.email, user.name || "Anonymous User")
        } catch (_) {}
      }
      return true
    },
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }
