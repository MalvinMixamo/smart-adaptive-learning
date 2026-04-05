import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import pusher from "pusher";

export async function POST(req: Request) {
  const { roomId, status } = await req.json();

  // 1. Update status di DB
  await prisma.meeting.update({
    where: { roomIdSocket: roomId },
    data: { isLocked: status }
  });

  // 2. Kirim sinyal real-time via Pusher
  await pusher.trigger(`presence-${roomId}`, "lockdown-event", {
    isLocked: status
  });

  return NextResponse.json({ success: true });
}