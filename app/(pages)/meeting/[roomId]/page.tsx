"use client";

import { use } from "react"
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react"; // Tambahkan ini untuk cek role
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff, Lock, Unlock, PhoneOff, User } from "lucide-react";
import Pusher from "pusher-js";

export default function MeetingPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { data: session } = useSession();
  // States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  useEffect(() => {
    // 1. Akses Kamera & Mic
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        setStream(s);
        if (myVideo.current) myVideo.current.srcObject = s;
      }).catch(err => console.error("Kamera error:", err));

    // 2. Setup Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // --- LOGIC UNTUK ISCONNECTED ---
    pusher.connection.bind('state_change', (states: any) => {
      setIsConnected(states.current === 'connected');
    });

    const channel = pusher.subscribe(`presence-${roomId}`);

    channel.bind("lockdown-event", (data: { isLocked: boolean }) => {
      setIsLocked(data.isLocked);
    });

    return () => {
      pusher.unsubscribe(`presence-${roomId}`);
      pusher.disconnect();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId]);

  // Toggle Media
  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micActive;
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoActive;
      setVideoActive(!videoActive);
    }
  };
  const handleToggleLock = async () => {
    await fetch("/api/meeting/lock", {
      method: "POST",
      body: JSON.stringify({ roomId: roomId, status: !isLocked }),
    });
  };
  const isGuru = session?.user?.role === "GURU";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex flex-col font-sans">
      
      {/* HEADER: Lebih Sleek */}
      <div className="flex justify-between items-center mb-8 bg-white/70 backdrop-blur-md p-5 rounded-4xl border border-white shadow-sm ring-1 ring-slate-200/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <User size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">Room: {roomId}</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {isConnected ? "Live Session" : "Reconnecting..."}
              </p>
            </div>
          </div>
        </div>

        {/* Tampilkan tombol Lockdown HANYA JIKA ROLE == GURU */}
        {session?.user?.role === "GURU" && (
          <button 
            onClick={handleToggleLock}
            className={`group flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
              isLocked 
              ? "bg-rose-500 text-white shadow-rose-200" 
              : "bg-slate-900 text-white shadow-slate-300"
            } shadow-lg hover:scale-105 active:scale-95`}
          >
            {isLocked ? <Lock size={18} className="animate-bounce" /> : <Unlock size={18} />}
            <span>{isLocked ? "Unlock Classroom" : "Lock Classroom"}</span>
          </button>
        )}
      </div>

      {/* VIDEO GRID: AUTO-SWITCH POSITION */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* KOTAK KIRI (Khusus Guru) */}
        <div className={`relative rounded-3xl overflow-hidden border-2 ${isGuru ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "border-slate-700"}`}>
          {isGuru ? (
            /* Jika saya Guru, video saya tampil di sini */
            <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            /* Jika saya Siswa, video Guru (Remote) tampil di sini */
            <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
            TEACHER AREA
          </div>
        </div>

        {/* KOTAK KANAN (Khusus Siswa) */}
        <div className={`relative rounded-3xl overflow-hidden border-2 ${!isGuru ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "border-slate-700"}`}>
          {!isGuru ? (
            /* Jika saya Siswa, video saya tampil di sini */
            <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            /* Jika saya Guru, video Siswa (Remote) tampil di sini */
            <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
          )}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-bold">
            STUDENT AREA
          </div>
        </div>

      </div>

      {/* CONTROLS: Modern Floating Island */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl px-8 py-5 rounded-[3rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex gap-6 items-center">
        <button 
          onClick={toggleMic}
          className={`p-4 rounded-2xl transition-all ${micActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-rose-100 text-rose-600"}`}
        >
          {micActive ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-2xl transition-all ${videoActive ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-rose-100 text-rose-600"}`}
        >
          {videoActive ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <div className="w-px h-10 bg-slate-200 mx-2" />

        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="p-4 bg-rose-500 hover:bg-rose-600 hover:rotate-12 text-white rounded-2xl transition-all shadow-lg shadow-rose-200"
        >
          <PhoneOff size={24} />
        </button>
      </div>

      {/* LOCKDOWN OVERLAY (Hanya Muncul di Siswa saat Locked) */}
      {isLocked && session?.user?.role === "SISWA" && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-999 flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />
            <Lock size={100} className="relative mb-8 text-blue-500" />
          </div>
          <h2 className="text-5xl font-black mb-4 tracking-tight">FOCUS MODE</h2>
          <p className="text-slate-400 text-lg max-w-md text-center leading-relaxed">
            Halaman ini dikunci oleh Guru. <br /> Fokus pada materi dan jangan berpindah tab!
          </p>
          <div className="mt-12 flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
          </div>
        </div>
      )}
    </div>
  );
}