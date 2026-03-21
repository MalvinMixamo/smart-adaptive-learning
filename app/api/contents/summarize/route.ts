import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const TfIdf = require('node-tfidf');

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { contentId, text } = await req.json();

    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Teks terlalu pendek untuk dirangkum" }, { status: 400 });
    }

    // --- LOGIC SUMMARIZER SEDERHANA ---
    const tfidf = new TfIdf();
    tfidf.addDocument(text);
    
    // Pecah teks jadi kalimat
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    // Beri skor tiap kalimat berdasarkan bobot kata penting (TF-IDF)
    const scoredSentences = sentences.map((sentence: string) => {
      let score = 0;
      const words = sentence.split(/\s+/);
      words.forEach((word: string) => {
        score += tfidf.tfidf(word, 0); // 0 adalah index dokumen
      });
      return { sentence: sentence.trim(), score };
    });

    // Ambil 3-5 kalimat dengan skor tertinggi sebagai ringkasan
    const summary = scoredSentences
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((s: any) => s.sentence)
      .join(' ');

    // --- UPDATE KE DATABASE PRISMA ---
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: { summaryAi: summary },
    });

    return NextResponse.json({ 
      message: "Berhasil merangkum materi!", 
      summary: updatedContent.summaryAi 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}