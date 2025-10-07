import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      tokens?: number
      isActive?: boolean
      isVerified?: boolean
      role?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    tokens: number
    isActive: boolean
    isVerified: boolean
    role: string
  }
}
