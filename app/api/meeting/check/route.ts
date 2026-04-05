import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  const meeting = await prisma.meeting.findUnique({
    where: { roomIdSocket: roomId as string },
    include: { guru: { select: { namaLengkap: true } } } // Opsional: ambil nama gurunya
  });

  if (!meeting) {
    return NextResponse.json({ error: "Kelas tidak ditemukan!" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}