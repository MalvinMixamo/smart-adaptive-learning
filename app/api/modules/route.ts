import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try{
        const modules = await prisma.module.findMany({
            include: { 
                contents: true,
            }
        })
        return NextResponse.json(modules)
    }catch(err){
        return NextResponse.json(err, {status: 500})
    }
}

export async function POST(request: Request) {
    const body = await request.json()
    try{
        const res = await prisma.module.create({
            data: {
                judul: body.judul,
                deskripsi: body.deskripsi,
                levelKesulitan: body.levelKesulitan,
                prasyaratModuleId: body.prasyaratModuleId
            }
        })

        if(!res){
            return NextResponse.json({message: 'rorr'}, {status: 400})
        }
        return NextResponse.json({message: 'berhasil add rorr'}, {status: 200})
    }catch(err){
        return NextResponse.json(err, {status: 500})
    }
}
