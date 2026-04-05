import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth"; 
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Log untuk cek apakah session-nya beneran ada
    console.log("ISI SESSION:", session?.user);

    if (!session?.user) {
      return NextResponse.json({ error: "Sesi habis, silakan login lagi" }, { status: 401 });
    }

    const body = await req.json();
    console.log("DATA DARI FRONTEND:", body);

    if (!body.moduleId) {
      return NextResponse.json({ error: "Module ID tidak boleh kosong" }, { status: 400 });
    }

    const roomId = Math.random().toString(36).substring(7);

    // Proses Simpan
    const meeting = await prisma.meeting.create({
      data: {
        guruId: (session.user as any).id, // Pastikan pakai 'as any' dulu kalau TS marah
        moduleId: body.moduleId,
        roomName: body.roomName,
        roomIdSocket: roomId,
      }
    });

    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error("DETEKSI ERROR DI TERMINAL:", error); // CEK TERMINAL VSCODE!
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}