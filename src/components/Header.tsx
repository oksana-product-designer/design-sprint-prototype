import { Menu, Inbox, Search, CloudUpload } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#d9d9d9] h-[80px] flex items-center">
      {/* Hamburger */}
      <button className="absolute left-6 p-1 text-[#2c2c2c] hover:opacity-70 transition-opacity">
        <Menu size={24} />
      </button>

      {/* Logo */}
      <div className="absolute left-16 flex items-center gap-[10px]">
        <div
          className="w-10 h-10 rounded-[8px] flex items-center justify-center border border-black/30 shrink-0"
          style={{ background: 'linear-gradient(91.64deg, #3f99f3 0%, #0975e2 100%)' }}
        >
          <Inbox size={24} className="text-white" />
        </div>
        <span className="text-[24px] font-semibold text-[#2c2c2c] tracking-[-0.48px] whitespace-nowrap leading-6">
          Первинка інбокс
        </span>
      </div>

      {/* Upload button */}
      <button
        className="absolute right-[24px] flex items-center gap-2 px-6 py-3 rounded-full border border-black/40 text-white text-[16px] font-medium leading-4 tracking-[-0.32px] whitespace-nowrap"
        style={{ background: 'linear-gradient(98.61deg, #3f99f3 0%, #0975e2 100%)' }}
      >
        <CloudUpload size={24} />
        Завантажити документ
      </button>

      {/* Search bar — centered */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[688px]">
        <div className="flex items-center gap-3 bg-[#f6f6f6] border border-[#d9d9d9] rounded-[4px] px-4 py-[12px]">
          <Search size={16} className="text-[#65768f] shrink-0" />
          <span className="text-[14px] text-[#65768f] leading-none select-none">
            Шукати документ...
          </span>
        </div>
      </div>

    </header>
  );
}
