import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request){
    const body = await request.json()

    try{
        await prisma.user.create({
            data: {
                namaLengkap: body.namaLengkap,
                email: body.email,
                password: body.password,
                role: body.role,
                deviceId: body.deviceId,
            }
        })

        return NextResponse.json({message: "berhasil membuat akun"}, {status: 200})

    }catch(err){
        return NextResponse.json(err, {status: 500})
    }
}