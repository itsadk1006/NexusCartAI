import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "buyer or merchant" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Simple mock authentication based on username
        if (credentials.username === 'buyer' && credentials.password === 'password') {
          return { id: "1", name: "Buyer User", email: "buyer@nexuscart.ai", role: "buyer" };
        } else if (credentials.username === 'merchant' && credentials.password === 'password') {
          return { id: "2", name: "Merchant User", email: "merchant@nexuscart.ai", role: "merchant" };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development',
});

export { handler as GET, handler as POST };
