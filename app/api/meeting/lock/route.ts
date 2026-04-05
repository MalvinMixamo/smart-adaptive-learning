import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import PusherServer from "pusher"; // Kasih nama alias 'PusherServer'

const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  const { roomId, status } = await req.json();

  // 1. Update status di DB
  await prisma.meeting.update({
    where: { roomIdSocket: roomId },
    data: { isLocked: status }
  });

  // 2. Kirim sinyal real-time via Pusher
  await pusher.trigger(`room-${roomId}`, "lockdown-event", {
    isLocked: status
  });

  return NextResponse.json({ success: true });
}