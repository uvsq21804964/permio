import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = await prisma.availability.findUnique({
      where: { id },
    })

    if (!existing) {
      console.error("[v0] Error deleting availability: Availability not found")
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }

    await prisma.availability.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting availability:", error)
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
  }
}
