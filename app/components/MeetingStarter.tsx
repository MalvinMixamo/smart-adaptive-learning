// components/GuruMeetingStarter.tsx
"use client";
import { useRouter } from "next/navigation";

export default function GuruMeetingStarter() {
  const router = useRouter();

  const startMeeting = async () => {
    const response = await fetch("/api/meeting/create", { // Sesuaikan path API kamu
    method: "POST",
    headers: {
      "Content-Type": "application/json", // WAJIB ADA
    },
    body: JSON.stringify({
      moduleId: "9bda69bf-7169-414d-9332-829dbda8a8a9", // WAJIB ADA & SESUAI DB
      roomName: "Nama Ruang Belajar",
    }), })
    const data = await response.json();
    console.log(data)
    // Redirect guru ke halaman meeting yang baru dibuat
    router.push(`/meeting/${data.roomId}`);
  };

  return (
    <button onClick={startMeeting} className="bg-blue-600 text-white p-4 rounded-xl">
      Buat Ruang Rapat Baru
    </button>
  );
}