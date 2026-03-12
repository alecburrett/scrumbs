import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { createDb } from '@scrumbs/db'

const db = createDb(process.env.DATABASE_URL!)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
