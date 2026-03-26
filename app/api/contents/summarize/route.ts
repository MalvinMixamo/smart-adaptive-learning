import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import natural from 'natural';                                                             
export async function POST(req: Request) {
  try {
    const { contentId, text } = await req.json();

    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Teks terlalu pendek" }, { status: 400 });
    }

    // --- LOGIC BARU PAKAI NATURAL ---
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    tfidf.addDocument(text);

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    const scoredSentences = sentences.map((sentence:any) => {
      let score = 0;
      const tokens = sentence.toLowerCase().split(/\W+/);
      tokens.forEach((token:any) => {
        // Hitung bobot kata
        tfidf.tfidfs(token, (i, measure) => {
          score += measure;
        });
      });
      return { sentence: sentence.trim(), score };
    });

    // Ambil 3 kalimat terbaik
    const summary = scoredSentences
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((s: any) => s.sentence)
      .join(' ');

    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: { summaryAi: summary },
    });

    return NextResponse.json({ summary: updatedContent.summaryAi });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}