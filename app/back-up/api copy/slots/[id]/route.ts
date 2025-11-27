import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await mockDb.lessonSlot.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting slot:", error)
    return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 })
  }
}
