// components/Hero.tsx
export default function Hero() {
  return (
    <section className="py-20 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">Inovasi Belajar 2026</span>
        <h1 className="text-5xl md:text-6xl font-extrabold mt-6 leading-tight">
          Belajar Lebih Fokus dengan <span className="text-blue-600">Smart Lockdown.</span>
        </h1>
        <p className="mt-6 text-slate-600 text-lg max-w-2xl mx-auto">
          Platform E-Learning adaptif yang membantu kamu tetap produktif, merangkum materi secara otomatis, dan ujian tanpa distraksi.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Mulai Belajar</button>
          <button className="bg-white border border-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all">Lihat Demo</button>
        </div>
      </div>
    </section>
  );
}