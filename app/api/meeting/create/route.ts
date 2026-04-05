import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Pusher from "pusher"; // 1. Import Pusher

// 2. Inisialisasi Pusher (Taruh di luar fungsi POST)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, roomName } = body;

    const roomId = Math.random().toString(36).substring(7);

    // 3. TETAP SIMPAN KE DATABASE (PRISMA)
    const meeting = await prisma.meeting.create({
      data: {
        guruId: (session.user as any).id,
        moduleId: moduleId,
        roomName: roomName || "Meeting Baru",
        roomIdSocket: roomId,
      }
    });

    // 4. KIRIM SINYAL KE PUSHER (Supaya Siswa yang udah stand-by tahu ada room baru)
    // Atau kalau ini buat "Lockdown", trigger-nya di sini:
    await pusher.trigger(`presence-${roomId}`, "room-created", {
      roomId: roomId,
      guruName: session.user.name,
    });

    return NextResponse.json(meeting);

  } catch (error: any) {
    console.error("ERROR CREATE MEETING:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}