import { useState, useRef } from 'react';
import { X, CloudUpload, CheckCircle2 } from 'lucide-react';
import { AccountingDocument } from '../types';

interface Props {
  onClose: () => void;
  onUpload: (doc: AccountingDocument) => void;
}

function today(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function UploadModal({ onClose, onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const doc: AccountingDocument = {
      id: Date.now().toString(),
      name: f.name.replace(/\.[^.]+$/, '') || 'Акт надання послуг',
      isNew: true,
      isNewVersion: false,
      isError: false,
      dateReceived: today(),
      dateCompiled: today(),
      counterparty: '',
      number: String(Math.floor(1000 + Math.random() * 9000)),
      source: 'upload',
      signature: 'awaiting_mine',
      needsRework: false,
      transferredToBAS: false,
    };
    onUpload(doc);
    setDone(true);
    setTimeout(onClose, 1200);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.2)] backdrop-blur-[2px]">
      <div className="relative bg-white border border-[#d9d9d9] rounded-[8px] w-[600px] flex flex-col gap-6 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-[11px] top-[11px] w-10 h-10 flex items-center justify-center rounded-[12px] p-2 hover:bg-[#f6f6f6] transition-colors"
        >
          <X size={24} className="text-[#2c2c2c]" />
        </button>

        {/* Title */}
        <p className="text-[24px] font-semibold text-[#0f172a] leading-6 text-center w-full">
          Завантажте новий документ
        </p>

        {/* Drop zone / success */}
        {done ? (
          <div className="bg-[#f6f6f6] border-2 border-dashed border-[#e5e9ee] rounded-[4px] p-6 flex flex-col items-center justify-center gap-2 min-h-[160px]">
            <CheckCircle2 size={64} className="text-[#0975e2]" />
            <p className="text-[16px] font-semibold text-[#0f172a]">Документ завантажено!</p>
          </div>
        ) : (
          <div
            className={`bg-[#f6f6f6] border-2 border-dashed rounded-[4px] p-6 flex flex-col items-center justify-center gap-2 min-h-[160px] cursor-pointer transition-colors ${
              dragging ? 'border-[#0975e2] bg-blue-50' : 'border-[#e5e9ee]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <CloudUpload size={64} className="text-[#0975e2]" />
            <p className="text-[16px] text-[#2c2c2c] leading-6 whitespace-nowrap">
              <span className="font-semibold text-[#0975e2]">Клікніть для завантаження</span>
              {' або перетягніть файл в це вікно'}
            </p>
            <div className="text-[14px] text-[#64748b] leading-4 text-center">
              <p>Ви можете завантажувати фото, документи</p>
              <p>у форматі PDF, DOC, XLS, JPG розміром до 50MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
