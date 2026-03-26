import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export const initSocket = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*", // Sesuaikan saat production nanti
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Join Room (Untuk Meeting atau Kelas Spesifik)
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Fitur: Trigger Lockdown dari Guru ke semua Siswa di Room
    socket.on("trigger-lockdown", (roomId) => {
      io.to(roomId).emit("start-lockdown");
    });

    // Fitur: Kirim Alert jika ada siswa yang bandel (pindah tab)
    socket.on("student-violation", (data) => {
      // Data berisi: { roomId, studentName, type: 'TAB_SWITCH' }
      io.to(data.roomId).emit("notify-teacher", data);
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });

  return io;
};