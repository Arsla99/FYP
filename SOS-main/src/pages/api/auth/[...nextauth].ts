import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextAuthOptions } from 'next-auth'
import connectDB from '../../../utils/db'
import User from '../../../models/User'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider (only if credentials are configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    
    // Credentials Provider as fallback
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          await connectDB()
          const user = await (User as any).findOne({ email: credentials.email.toLowerCase().trim() })
          
          if (!user) {
            throw new Error('Invalid email or password')
          }

          // Check password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password')
          }

          // Update last active
          await (User as any).findByIdAndUpdate(user._id, {
            lastActive: new Date(),
            isActive: true
          })

          console.log(`✅ User ${user.email} authenticated successfully via credentials`)

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            image: user.avatarUrl || null
          }
        } catch (error) {
          console.error('❌ Error during credentials authentication:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          
          // Check if user already exists
          let existingUser = await (User as any).findOne({ 
            $or: [
              { email: user.email },
              { googleId: account.providerAccountId }
            ]
          })
          
          if (!existingUser) {
            // Create new user from Google account
            existingUser = new (User as any)({
              name: user.name || 'Google User',
              email: user.email,
              password: await bcrypt.hash(`google-oauth-${Date.now()}`, 10), // Secure random password
              role: 'user',
              googleId: account.providerAccountId,
              avatarUrl: user.image,
              contacts: [],
              keywords: ['help', 'emergency', 'sos', 'danger', 'fire', 'attack', 'injured', 'accident']
            })
            await existingUser.save()
            console.log(`✅ New Google user created: ${user.email}`)
          } else {
            // Sync Google profile data on every login
            const updates: Record<string, unknown> = {
              lastActive: new Date(),
              isActive: true,
            }
            if (!existingUser.googleId) {
              updates.googleId = account.providerAccountId
            }
            // Always refresh avatar and name from Google if they changed
            if (user.image && existingUser.avatarUrl !== user.image) {
              updates.avatarUrl = user.image
            }
            if (user.name && existingUser.name !== user.name) {
              updates.name = user.name
            }
            await (User as any).findByIdAndUpdate(existingUser._id, updates)
            console.log(`✅ Existing user signed in via Google: ${user.email}`)
          }
          
          return true
        } catch (error) {
          console.error('❌ Error during Google sign in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Initial sign in - add user info to token
        try {
          await connectDB()
          const dbUser = await (User as any).findOne({ email: user.email })
          if (dbUser) {
            token.userId = dbUser._id.toString()
            token.role = dbUser.role || 'user'
            token.name = dbUser.name
            token.email = dbUser.email
            // Avoid storing large avatar/base64 data in the JWT (causes oversized cookies)
            const candidatePicture = dbUser.avatarUrl || user.image
            const isBase64Data = typeof candidatePicture === 'string' && candidatePicture.startsWith('data:')
            const isTooLong = typeof candidatePicture === 'string' && candidatePicture.length > 2000
            if (!isBase64Data && !isTooLong) {
              token.picture = candidatePicture
            } else {
              // Store a lightweight flag instead of the full data
              token.picture = null
              token.hasAvatar = !!candidatePicture
            }
          }
        } catch (error) {
          console.error('❌ Error fetching user in JWT callback:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add user info to session
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        // Only include image in session if it was safe to store in the token
        if (token.picture) {
          session.user.image = token.picture as string
        } else if (token.hasAvatar) {
          // avatar exists but was too large to include; avoid embedding it in the cookie
          session.user.image = null
        } else {
          session.user.image = token.picture as string
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
