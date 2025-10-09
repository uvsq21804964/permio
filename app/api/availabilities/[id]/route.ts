import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const existing = mockDb.availabilities.find((a) => a.id === id)
    if (!existing) {
      console.error("[v0] Error deleting availability: Availability not found")
      return NextResponse.json({ error: "Availability not found" }, { status: 404 })
    }

    await mockDb.availability.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting availability:", error)
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 })
  }
}
