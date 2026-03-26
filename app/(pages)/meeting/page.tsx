"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "@/app/provider/socket-provider"; // Context yang kita buat tadi
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff, Lock, Unlock, PhoneOff } from "lucide-react";

export default function MeetingPage({ params }: { params: { roomId: string } }) {
  const { socket, isConnected } = useSocket();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance>();

  
  useEffect(() => {
  let localStream: MediaStream;

  const startCamera = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStream = currentStream;
      setStream(currentStream);

      // --- POINT PENTING: Cek apakah Ref sudah siap ---
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
        console.log("Stream berhasil ditempel!");
      } else {
        // Jika Ref belum siap, coba lagi setelah 500ms (Failsafe)
        setTimeout(() => {
          if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
            console.log("Stream ditempel lewat Failsafe!");
          }
        }, 500);
      }
    } catch (err) {
      console.error("Gagal akses kamera:", err);
    }
  };

  startCamera();

  // Cleanup: Matikan kamera kalau pindah halaman
  return () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
  };
}, []); // Kosongkan dependency agar tidak restart terus

  // 3. Fungsi Trigger Lockdown (Hanya untuk Guru)
  const toggleLockdown = () => {
    const newStatus = !isLocked;
    setIsLocked(newStatus);
    socket?.emit("trigger-lockdown", { roomId: params.roomId, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="font-bold text-xl text-slate-800">Ruang Kelas: {params.roomId}</h1>
          <p className="text-sm text-slate-500">{isConnected ? "● Connected" : "○ Disconnected"}</p>
        </div>
        <button 
          onClick={toggleLockdown}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
            isLocked ? "bg-red-500 text-white" : "bg-blue-600 text-white shadow-blue-200 shadow-lg"
          }`}
        >
          {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
          {isLocked ? "Matikan Lockdown" : "Aktifkan Lockdown"}
        </button>
      </div>

      {/* Video Grid Section */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Peserta Lain / Guru */}
        <div className="bg-slate-800 rounded-[2rem] overflow-hidden relative shadow-inner flex items-center justify-center">
          <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
          <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md text-white px-4 py-1 rounded-xl text-sm">
            Guru / Presenter
          </div>
        </div>

        {/* Video Lokal (Diri Sendiri) */}
        <div className=" rounded-[2rem] overflow-hidden relative border-4 border-white shadow-xl">
          {stream && <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
            />}
          <div className="absolute bottom-6 left-6 bg-blue-600 text-white px-4 py-1 rounded-xl text-sm shadow-lg">
            Kamu (Siswa)
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white shadow-2xl flex gap-4">
        <button className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-700">
          <Mic size={24} />
        </button>
        <button className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-700">
          <Video size={24} />
        </button>
        <button className="p-4 bg-red-100 hover:bg-red-500 hover:text-white rounded-2xl transition-all text-red-600">
          <PhoneOff size={24} />
        </button>
      </div>

      {/* Lockdown Overlay (Modular) */}
      {isLocked && (
        <div className="fixed inset-0 bg-blue-600/90 backdrop-blur-md z-[999] flex flex-col items-center justify-center text-white p-6 text-center">
          <Lock size={80} className="mb-6 animate-bounce" />
          <h2 className="text-4xl font-bold mb-4">Mode Fokus Aktif!</h2>
          <p className="text-blue-100 max-w-md">
            Guru telah mengaktifkan mode lockdown. Kamu tidak diperbolehkan keluar dari halaman ini hingga sesi berakhir.
          </p>
        </div>
      )}
    </div>
  );
}
