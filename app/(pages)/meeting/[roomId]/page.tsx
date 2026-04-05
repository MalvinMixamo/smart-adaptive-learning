"use client";

import { use } from "react"
import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff, Lock, Unlock, PhoneOff, User } from "lucide-react";
import Pusher from "pusher-js";

export default function MeetingPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { data: session } = useSession();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null); // Ref untuk nyimpen koneksi peer

  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;
  const isGuru = session?.user?.role === "GURU";

  // FUNGSI UTAMA WEBRTC (Salaman Video)
  const createPeer = (currentStream: MediaStream, incomingSignal?: any) => {
    const peer = new Peer({
      initiator: isGuru && !incomingSignal, // Guru yang mulai duluan
      trickle: false,
      stream: currentStream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", async (data) => {
      // Kirim sinyal balik via Pusher API
      await fetch("/api/meeting/signal", {
        method: "POST",
        body: JSON.stringify({ 
            roomId: roomId, 
            signal: data, 
            sender: session?.user?.email 
        }),
      });
    });

    peer.on("stream", (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
      }
    });

    peerRef.current = peer;
    return peer;
  };

  useEffect(() => {
    if (!roomId || !session?.user?.email) return;

    let currentStream: MediaStream;

    // 1. Ambil Kamera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((s) => {
        currentStream = s;
        setStream(s);
        if (myVideo.current) myVideo.current.srcObject = s;

        // 2. Setup Pusher setelah kamera siap
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        pusher.connection.bind('state_change', (states: any) => {
          setIsConnected(states.current === 'connected');
        });

        const channel = pusher.subscribe(`room-${roomId}`);

        // Jika saya Guru, saya buat Peer duluan (Initiator)
        if (isGuru) {
          createPeer(s);
        }

        // Dengerin sinyal dari lawan bicara
        channel.bind("signal-event", (data: any) => {
          if (data.sender !== session?.user?.email) {
            if (!peerRef.current) {
              // Jika siswa nerima sinyal guru, buat peer (Non-Initiator)
              createPeer(s, data.signal);
            } else {
              // Jika sudah ada peer, tinggal masukin sinyalnya
              peerRef.current.signal(data.signal);
            }
          }
        });

        // Dengerin event lockdown
        channel.bind("lockdown-event", (data: { isLocked: boolean }) => {
          setIsLocked(data.isLocked);
        });
      });

    return () => {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: 'ap1' });
      pusher.unsubscribe(`room-${roomId}`);
      pusher.disconnect();
      peerRef.current?.destroy();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId, session]);

  // --- CONTROLS ---
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex flex-col font-sans">
      
      {/* HEADER */}
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
                {isConnected ? "Live Session" : "Connecting..."}
              </p>
            </div>
          </div>
        </div>

        {isGuru && (
          <button 
            onClick={handleToggleLock}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${
              isLocked ? "bg-rose-500 text-white" : "bg-slate-900 text-white"
            } shadow-lg`}
          >
            {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            <span>{isLocked ? "Unlock" : "Lock"}</span>
          </button>
        )}
      </div>

      {/* VIDEO GRID */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`relative rounded-3xl overflow-hidden border-2 ${isGuru ? "border-blue-500 shadow-lg" : "border-slate-300"}`}>
          <video ref={isGuru ? myVideo : remoteVideo} autoPlay muted={isGuru} playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-xs">TEACHER</div>
        </div>

        <div className={`relative rounded-3xl overflow-hidden border-2 ${!isGuru ? "border-blue-500 shadow-lg" : "border-slate-300"}`}>
          <video ref={!isGuru ? myVideo : remoteVideo} autoPlay muted={!isGuru} playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-xs">STUDENT</div>
        </div>
      </div>

      {/* FLOATING CONTROLS */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-2xl px-8 py-5 rounded-[3rem] border shadow-2xl flex gap-6 items-center">
        <button onClick={toggleMic} className={`p-4 rounded-2xl ${micActive ? "bg-slate-100" : "bg-rose-100 text-rose-600"}`}>
          {micActive ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-2xl ${videoActive ? "bg-slate-100" : "bg-rose-100 text-rose-600"}`}>
          {videoActive ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
        <div className="w-px h-10 bg-slate-200 mx-2" />
        <button onClick={() => window.location.href = '/dashboard'} className="p-4 bg-rose-500 text-white rounded-2xl">
          <PhoneOff size={24} />
        </button>
      </div>

      {/* LOCKDOWN OVERLAY */}
      {isLocked && !isGuru && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center text-white">
          <Lock size={100} className="mb-8 text-blue-500 animate-pulse" />
          <h2 className="text-5xl font-black mb-4">FOCUS MODE</h2>
          <p className="text-slate-400 text-lg text-center">Ruangan dikunci oleh Guru.</p>
        </div>
      )}
    </div>
  );
}