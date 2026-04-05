import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password, nama, role } = await req.json();

    if (!email || !password || !nama) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        namaLengkap: nama,
        role: role || "SISWA",
      },
    });

    return NextResponse.json({ message: "User berhasil dibuat!", userId: newUser.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal registrasi" }, { status: 500 });
  }
}