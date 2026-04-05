import Pusher from "pusher";
import { NextResponse } from "next/server";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  const { roomId, signal, sender } = await req.json();

  // Kirim sinyal ke semua orang di room tersebut kecuali si pengirim
  await pusher.trigger(`room-${roomId}`, "signal-event", {
    signal: signal,
    sender: sender // Untuk membedakan siapa yang kirim
  });

  return NextResponse.json({ success: true });
}