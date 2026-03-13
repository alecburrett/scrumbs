import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { createDb } from '@scrumbs/db'

const db = createDb(process.env.DATABASE_URL!)

// next-auth v5 beta: 'auth' type references next-auth/lib internals which
// TypeScript cannot name under isolatedModules — suppress the portability error.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
