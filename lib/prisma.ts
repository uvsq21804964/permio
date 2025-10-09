import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient

try {
  console.log("[v0] Initializing Prisma client...")
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ["error", "warn"],
    })
  console.log("[v0] Prisma client initialized successfully")
} catch (error) {
  console.error("[v0] Failed to initialize Prisma client:", error)
  throw error
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
