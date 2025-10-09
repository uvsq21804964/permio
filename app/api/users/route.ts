import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get("role")

    let users
    if (role) {
      users = await sql`
        SELECT id, name, role, "createdAt", "updatedAt"
        FROM "User"
        WHERE role = ${role}
        ORDER BY name ASC
      `
    } else {
      users = await sql`
        SELECT id, name, role, "createdAt", "updatedAt"
        FROM "User"
        ORDER BY name ASC
      `
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role } = body

    const [user] = await sql`
      INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${role}, NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
