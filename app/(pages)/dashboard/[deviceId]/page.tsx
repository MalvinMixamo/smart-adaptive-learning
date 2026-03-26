// components/DashboardLayout.tsx
import { LayoutDashboard, BookOpen, Video, BarChart3, Settings } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, active: true },
    { name: "Materi", icon: <BookOpen size={20} />, active: false },
    { name: "Meeting", icon: <Video size={20} />, active: false },
    { name: "Analytics", icon: <BarChart3 size={20} />, active: false },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* SideNav */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 font-bold text-2xl text-blue-600">FusionTech</div>
        <nav className="flex-1 px-4 space-y-2">
          {menu.map((item) => (
            <button key={item.name} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 w-full">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Selamat Datang, Siswa!</h1>
          <div className="w-10 h-10 bg-blue-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">S</div>
        </header>
        {children}
      </main>
    </div>
  );
}