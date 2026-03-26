import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json()

    try{
        const res = await prisma.user.findUnique({
            where: {
                email: body.email,
                password: body.password
            }
        })
        if(res == null){
            return NextResponse.json({message: "User not found"}, {status:404})
        }
        const response = NextResponse.json({
            message: "Berhasil login",
            namaLengkap: res.namaLengkap,
            email: res.email,
            deviceId: res.deviceId
        }, { status: 200 })

        response.cookies.set('token', String(res.deviceId), {
            path: '/',
            httpOnly: false,
            maxAge: 60 * 60 * 24
        })
        response.cookies.set('role', String(res.role), {
            path: '/',
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24
        })

        return response
    }catch(err: any){
        return NextResponse.json(err, {status: 500})
    }
}