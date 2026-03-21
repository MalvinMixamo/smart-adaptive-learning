import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const allContents = await prisma.content.findMany({
    include: { module: true }   
});
  return NextResponse.json(allContents);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newContent = await prisma.content.create({
    data: {
      moduleId: body.moduleId,
      tipe: body.tipe,
      urlResource: body.urlResource,
    }
  });
  return NextResponse.json(newContent);
}