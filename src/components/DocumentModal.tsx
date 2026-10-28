import { useState, useRef, useEffect } from 'react';
import {
  X, Plus, Minus, ChevronLeft, ChevronRight,
  MoreVertical, CloudUpload, Send, CheckCircle2, XCircle, ChevronDown,
  AtSign, MessageCircle, Check, CircleCheckBig, FileText, Info, Loader2, Copy,
  Trash2, Combine,
} from 'lucide-react';
import {
  AccountingDocument, DocumentSource, SignatureStatus,
  SOURCE_LABELS, SIGNATURE_LABELS,
} from '../types';

interface Props {
  document: AccountingDocument;
  onClose: () => void;
  onNeedsReworkChange: (docId: string, needsRework: boolean) => void;
  onTransferToBAS?: (docId: string) => void;
  onNewVersion?: (docId: string) => void;
  onPrevDoc?: () => void;
  onNextDoc?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  savedEdits?: { fields?: Record<string, string>; originalStatus?: string };
  onEditsChange?: (docId: string, edits: { fields?: Record<string, string>; originalStatus?: string }) => void;
}

type Tab = 'document' | 'comments' | 'history';

const UNRECOGNIZED = '<не розпізнано>';

const PAPER_DOC_IMAGES: Record<string, { main: string; thumb: string; mainV2?: string }> = {
  '21': { main: '/docs/paper-doc-main.jpg', thumb: '/docs/paper-doc-thumb.jpg' },
  '22': { main: '/docs/delivery-note-4587.png', thumb: '/docs/delivery-note-4587.png', mainV2: '/docs/delivery-note-4587-v2.png' },
};

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value === UNRECOGNIZED ? '' : value);
  const inputRef = useRef<HTMLInputElement>(null);

  function activate() {
    setDraft(value === UNRECOGNIZED ? '' : value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    onChange(draft || UNRECOGNIZED);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setEditing(false); setDraft(value === UNRECOGNIZED ? '' : value); }
        }}
        className="w-full bg-white border border-[#cbd5e1] rounded-[8px] px-2 py-[5px] text-[14px] text-[#2c2c2c] leading-4 shadow-[0px_1px_2px_rgba(12,12,13,0.1),0px_1px_2px_rgba(12,12,13,0.05)] focus:outline-none focus:border-[#0975e2] transition-colors"
      />
    );
  }

  if (value === UNRECOGNIZED) {
    return (
      <span
        onClick={activate}
        title="Клікніть для заповнення"
        className="block w-full text-[#c93838] text-[14px] leading-4 cursor-text px-2 py-[5px] rounded-[8px] hover:bg-[#fef2f2] transition-colors italic"
      >
        {UNRECOGNIZED}
      </span>
    );
  }

  return (
    <span
      onClick={activate}
      title="Клікніть для редагування"
      className="block w-full text-[#2c2c2c] text-[14px] leading-4 cursor-text px-2 py-[5px] rounded-[8px] hover:bg-[#f1f5f9] transition-colors"
    >
      {value || <span className="text-[#94a3b8]">—</span>}
    </span>
  );
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceIcon({ source }: { source: DocumentSource }) {
  if (source === 'email') return <AtSign size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'chatbot') return <MessageCircle size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'upload') return <CloudUpload size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'vchasno') return <img src="/logos/vchasno.png" className="w-4 h-4 rounded-full object-cover shrink-0" alt="Вчасно" />;
  return <img src="/logos/sota.png" className="w-4 h-4 rounded-full object-cover shrink-0" alt="Сота" />;
}

function SourceBadge({ source }: { source: DocumentSource }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-[rgba(44,44,44,0.1)] rounded-full pl-1 pr-3 py-1 shrink-0">
      <SourceIcon source={source} />
      <span className="text-[12px] text-[#2c2c2c] leading-4 whitespace-nowrap">{SOURCE_LABELS[source]}</span>
    </div>
  );
}

// ─── Signature badge ──────────────────────────────────────────────────────────

const SIG_ICONS: Record<SignatureStatus, string> = {
  signed_all: '✅', not_signed: '❌', awaiting_mine: '⌛',
};

function SignatureBadge({ status }: { status: SignatureStatus }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-[rgba(44,44,44,0.1)] rounded-full px-3 py-1 overflow-hidden max-w-full">
      <span className="text-[12px] shrink-0">{SIG_ICONS[status]}</span>
      <span className="text-[12px] text-[#2c2c2c] leading-4 overflow-hidden text-ellipsis whitespace-nowrap">
        {SIGNATURE_LABELS[status]}
      </span>
    </div>
  );
}

// ─── Divider + section heading ────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="shrink-0">
      <div className="h-px bg-[#e5e9ee] w-full mb-3" />
      <p className="text-[12px] font-semibold text-[#4c5c72] uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ─── Label + editable value row ───────────────────────────────────────────────

function MetaRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    const text = value === UNRECOGNIZED ? '' : value;
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative flex gap-4 items-center text-[14px] w-full">
      <span className="text-[#64748b] shrink-0 w-[120px] leading-4">{label}</span>
      <div className="flex-1 min-w-0">
        <EditableField value={value} onChange={onChange} />
      </div>
      {copied ? (
        <span className="absolute right-1 text-[11px] text-[#047857] whitespace-nowrap bg-white px-1 rounded pointer-events-none">
          Скопійовано
        </span>
      ) : (
        <button
          onClick={handleCopy}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#2c2c2c] transition-colors"
        >
          <Copy size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Editable table cell ──────────────────────────────────────────────────────

function EditableCell({
  value, onChange, className = '',
}: { value: string; onChange: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit() { setEditing(false); onChange(draft); }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setEditing(false); setDraft(value); }
        }}
        className={`w-full bg-white border border-[#0975e2] focus:outline-none text-[14px] text-[#475569] px-1.5 py-1 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group relative block w-full text-[14px] text-[#475569] px-1.5 py-1 cursor-text hover:bg-[#f1f5f9] rounded transition-colors ${className}`}
    >
      {value}
      {copied ? (
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-[#047857] bg-white px-1 rounded pointer-events-none z-10">✓</span>
      ) : (
        <button
          onClick={handleCopy}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex items-center justify-center w-5 h-5 rounded hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#2c2c2c]"
        >
          <Copy size={12} />
        </button>
      )}
    </span>
  );
}

// ─── Read-only copyable table cell ────────────────────────────────────────────

function CopyableCell({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className={`group relative block px-1 py-2 text-[14px] text-[#475569] ${className}`}>
      {value}
      {copied ? (
        <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-[#047857] bg-white px-1 rounded pointer-events-none z-10">✓</span>
      ) : (
        <button
          onClick={handleCopy}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity flex items-center justify-center w-5 h-5 rounded hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#2c2c2c]"
        >
          <Copy size={12} />
        </button>
      )}
    </span>
  );
}

// ─── New-version upload dialog ────────────────────────────────────────────────

const FAKE_FILE = { name: 'Видаткова накладна: №4587 від 26.05.2025.jpg', size: 1677721 };

function NewVersionDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  function startUpload() {
    if (started) return;
    setStarted(true);
    setProgress(0);
    setUploading(true);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(intervalRef.current!);
          setUploading(false);
          return 100;
        }
        return next;
      });
    }, 150);
  }

  function cancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStarted(false);
    setProgress(0);
    setUploading(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.25)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-[600px] bg-white border border-[#d9d9d9] rounded-[8px] p-6 flex flex-col gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-[11px] top-[11px] w-10 h-10 flex items-center justify-center rounded-[12px] hover:bg-[#f6f6f6] transition-colors"
        >
          <X size={24} className="text-[#2c2c2c]" />
        </button>

        {/* Title */}
        <h2 className="text-[24px] font-semibold text-[#0f172a] leading-7 text-center pr-8">
          Завантажте нову версію документу
        </h2>

        {/* Drop zone — shown before upload starts */}
        {!started ? (
          <div
            className="flex flex-col items-center justify-center gap-2 bg-[#f6f6f6] border-2 border-dashed border-[#e5e9ee] rounded-[4px] py-8 px-6 cursor-pointer hover:border-[#0975e2] transition-colors"
            onClick={startUpload}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); startUpload(); }}
          >
            <CloudUpload size={64} className="text-[#0975e2]" />
            <p className="text-[16px] text-center leading-6">
              <span className="font-medium text-[#0975e2]">Клікніть для завантаження</span>
              <span className="text-[#2c2c2c]"> або перетягніть файл в це вікно</span>
            </p>
            <p className="text-[14px] text-[#64748b] text-center leading-5">
              Ви можете завантажувати фото, документи<br />у форматі PDF, DOC, XLS, JPG розміром до 50MB
            </p>
          </div>
        ) : (
          /* File row + progress bar */
          <div className="border border-[#e5e9ee] rounded-[4px] p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <FileText size={24} className="text-[#4c5c72] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-[#2c2c2c] truncate">{FAKE_FILE.name}</span>
                  <button onClick={cancel} className="shrink-0">
                    <X size={20} className="text-[#64748b] hover:text-[#2c2c2c] transition-colors" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[12px] text-[#64748b]">1.6 МБ</span>
                  <span className="text-[12px] text-[#64748b]">{progress} %</span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-[#e5e9ee] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0975e2] rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer buttons — appear once upload starts */}
        {started && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="h-12 px-6 border border-[#d9d9d9] rounded-full text-[16px] font-medium text-[#2c2c2c] hover:bg-[#f6f6f6] transition-colors"
            >
              Скасувати
            </button>
            <button
              onClick={!uploading && progress === 100 ? onConfirm : undefined}
              disabled={uploading || progress < 100}
              className={`flex items-center gap-2 h-12 px-6 rounded-full text-[16px] font-medium text-white transition-opacity ${
                uploading || progress < 100 ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'
              }`}
              style={{ background: 'linear-gradient(98.61deg, #3f99f3 0%, #0975e2 100%)' }}
            >
              Завантажити
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <CloudUpload size={20} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'document', label: 'Документ' },
  { key: 'comments', label: 'Коментарі' },
  { key: 'history', label: 'Історія змін' },
];

const REWORK_OPTIONS = ['Не потребує', '⚠️ Потребує'];

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function DocumentModal({ document: doc, onClose, onNeedsReworkChange, onTransferToBAS, onNewVersion, onPrevDoc, onNextDoc, hasPrev, hasNext, savedEdits, onEditsChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('document');
  const [activePage, setActivePage] = useState(1);
  const [rework, setRework] = useState(doc.needsRework ? REWORK_OPTIONS[1] : REWORK_OPTIONS[0]);
  const [sentToBAS, setSentToBAS] = useState(doc.transferredToBAS);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [version, setVersion] = useState(1);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [showVersionBanner, setShowVersionBanner] = useState(false);
  const [localSignature, setLocalSignature] = useState<SignatureStatus>(doc.signature);
  const [cpSigned, setCpSigned] = useState(false);
  const [cpStamped, setCpStamped] = useState(false);
  const [lsSigned, setLsSigned] = useState(false);
  const [lsStamped, setLsStamped] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(savedEdits?.originalStatus ?? (doc.isPaperScan ? 'Не в наявності' : 'В наявності'));
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!showActionsMenu) return;
    function handleOutside(e: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showActionsMenu]);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  function handleSendToBAS() {
    if (sentToBAS) return;
    setSentToBAS(true);
    setShowToast(true);
    onTransferToBAS?.(doc.id);
    toastTimerRef.current = setTimeout(() => setShowToast(false), 4000);
  }

  const det = doc.details;
  const isDeliveryNote = doc.name.toLowerCase().includes('накладна');

  // All editable field values — sourced from doc.details when available
  const defaultFields = {
    vid: doc.name,
    nomer: doc.number,
    dataSkl:     det?.dataSkl     ?? '—',
    misceSkl:    det?.misceSkl    ?? '—',
    dohovir:     det?.dohovir     ?? '—',
    vykonavets:  det?.vykonavets  ?? '—',
    predstavnyk: det?.predstavnyk ?? '—',
    edrpouVyk:   det?.edrpouVyk   ?? '—',
    ipn:         det?.ipn         ?? '—',
    prakh:       det?.prakh       ?? '—',
    bank:        det?.bank        ?? '—',
    adresaVyk:   det?.adresaVyk   ?? '—',
    telefon:     det?.telefon     ?? '—',
    mfo:         det?.mfo         ?? '—',
    shoCe:       det?.shoCe       ?? '—',
    zamovnyk:    det?.zamovnyk ?? doc.counterparty ?? '—',
    edrpouZam:   det?.edrpouZam   ?? '—',
    adresaZam:   det?.adresaZam   ?? '—',
    liNaym:      det?.lineItem?.naym ?? '—',
    liKilk:      det?.lineItem?.kilk ?? '1',
    liOd:        det?.lineItem?.od   ?? 'шт',
    liCina:      det?.lineItem?.cina ?? '0,00',
    liSuma:      det?.lineItem?.suma ?? '0,00',
    sumaPropys:  det?.sumaPropys     ?? '',
  };
  const [fields, setFields] = useState<Record<string, string>>(
    savedEdits?.fields ? { ...defaultFields, ...savedEdits.fields } : defaultFields
  );

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const originalStatusRef = useRef(originalStatus);
  originalStatusRef.current = originalStatus;

  useEffect(() => {
    return () => {
      onEditsChange?.(doc.id, { fields: fieldsRef.current, originalStatus: originalStatusRef.current });
    };
  }, []);

  function setField(key: keyof typeof fields, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (zoom === 1) {
      setPanOffset({ x: 0, y: 0 });
      panRef.current = { x: 0, y: 0 };
    }
  }, [zoom]);

  function handlePanStart(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, startX: panRef.current.x, startY: panRef.current.y };
  }

  function handlePanMove(e: React.MouseEvent) {
    if (!dragStart.current) return;
    const x = dragStart.current.startX + (e.clientX - dragStart.current.mouseX);
    const y = dragStart.current.startY + (e.clientY - dragStart.current.mouseY);
    panRef.current = { x, y };
    if (imgRef.current) {
      imgRef.current.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    }
  }

  function handlePanEnd() {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    setPanOffset({ ...panRef.current });
  }

  function handleReworkChange(value: string) {
    setRework(value);
    onNeedsReworkChange(doc.id, value === REWORK_OPTIONS[1]);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.2)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="absolute left-0 right-0 bottom-0 bg-[#f6f6f6] rounded-tl-[24px] rounded-tr-[24px] overflow-hidden flex flex-col"
        style={{ top: 40 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative flex items-center gap-2 px-6 pt-6 pb-4 shrink-0">
          <p className="text-[20px] leading-6 whitespace-nowrap">
            <span className="font-normal text-[#64748b]">{doc.name}: </span>
            <span className="font-bold text-[#2c2c2c]">Nº{doc.number} </span>
            <span className="font-normal text-[#64748b]">від </span>
            <span className="font-bold text-[#2c2c2c]">{det?.dataSkl ?? doc.dateCompiled}</span>
          </p>
          <div className="inline-flex items-center px-3 py-2 bg-white border border-[rgba(44,44,44,0.1)] rounded-full shrink-0">
            <span className="text-[12px] text-[#2c2c2c] leading-4">Версія {version}</span>
          </div>
          <button
            onClick={onClose}
            className="absolute right-[11px] top-[12px] w-10 h-10 flex items-center justify-center rounded-[12px] hover:bg-white/60 transition-colors"
          >
            <X size={24} className="text-[#2c2c2c]" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-[#d9d9d9] px-6 shrink-0 flex">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-[14px] leading-4 rounded-tl-[4px] rounded-tr-[4px] transition-colors ${
                activeTab === tab.key
                  ? 'text-[#0975e2] font-medium border-b-2 border-[#0975e2]'
                  : 'text-[#4c5c72] font-normal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Version banner ── */}
        {showVersionBanner && (
          <div className="mx-6 mt-2 flex items-center gap-3 px-4 py-3 rounded-[8px] shrink-0" style={{ background: 'linear-gradient(129.8deg, rgba(15,171,75,0.12) 0%, rgba(5,163,66,0.12) 100%), white' }}>
            <Info size={24} className="text-[#2c2c2c] shrink-0" />
            <p className="flex-1 text-[14px] text-[#2c2c2c] leading-5">
              Ви переглядаєте нову версію документу. Відкрити попередні версії можна по кліку на кнопку «Версія …» біля назви документу.
            </p>
            <button onClick={() => setShowVersionBanner(false)} className="shrink-0">
              <X size={16} className="text-[#64748b] hover:text-[#2c2c2c] transition-colors" />
            </button>
          </div>
        )}

        {/* ── Meta strip ── */}
        <div className="flex items-center gap-10 px-6 py-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Джерело</span>
            <SourceBadge source={doc.source} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Оригінал</span>
            {doc.source === 'chatbot' ? (
              <div className="relative">
                <select
                  value={originalStatus}
                  onChange={e => setOriginalStatus(e.target.value)}
                  className="appearance-none w-[176px] bg-white border border-[#d9d9d9] rounded-[4px] pl-3 pr-8 py-2 text-[14px] text-[#2c2c2c] leading-none focus:outline-none focus:border-[#0975e2] cursor-pointer"
                >
                  <option>В наявності</option>
                  <option>Не в наявності</option>
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2c2c2c] pointer-events-none" />
              </div>
            ) : doc.isPaperScan ? (
              <span className="text-[14px] font-medium text-[#2c2c2c] leading-6 whitespace-nowrap">В наявності</span>
            ) : (
              <a href="#" onClick={e => e.preventDefault()} className="text-[14px] font-medium text-[#0975e2] underline leading-6 whitespace-nowrap">
                Посилання
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Підпис</span>
            <SignatureBadge status={localSignature} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Дата надходження</span>
            <span className="text-[14px] font-medium text-[#2c2c2c] leading-6 whitespace-nowrap">{doc.dateReceived} {doc.timeReceived ?? '13:00'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Доопрацювання</span>
            <div className="relative">
              <select
                value={rework}
                onChange={e => handleReworkChange(e.target.value)}
                className="appearance-none w-[176px] bg-white border border-[#d9d9d9] rounded-[4px] pl-3 pr-8 py-2 text-[14px] text-[#2c2c2c] leading-none focus:outline-none focus:border-[#0975e2] cursor-pointer"
              >
                {REWORK_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#2c2c2c] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        {activeTab === 'document' ? (
          <div className="flex gap-4 px-6 pb-3 flex-1 overflow-hidden min-h-0">
            {/* Left pane — PDF or photo preview */}
            <div className="flex-1 min-w-0 bg-white border border-[#d9d9d9] rounded-[8px] p-4 flex flex-col relative overflow-hidden">
              {/* Zoom controls */}
              <div className="absolute top-4 left-4 z-10 flex flex-col">
                <button
                  onClick={() => setZoom(z => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM))}
                  disabled={zoom >= MAX_ZOOM}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-[#d9d9d9] rounded-t-[4px] hover:enabled:bg-[#f6f6f6] disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} className="text-[#2c2c2c]" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM))}
                  disabled={zoom <= MIN_ZOOM}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-[#d9d9d9] border-t-0 rounded-b-[4px] hover:enabled:bg-[#f6f6f6] disabled:opacity-40 transition-colors"
                >
                  <Minus size={16} className="text-[#2c2c2c]" />
                </button>
              </div>

              {/* Zoom level indicator */}
              {zoom !== 1 && (
                <div className="absolute top-4 left-14 z-10">
                  <span className="text-[12px] text-[#64748b] bg-white border border-[#d9d9d9] rounded-[4px] px-2 py-1 leading-none">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              )}

              {/* Main preview */}
              <div
                className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
              >
                {doc.isPaperScan ? (
                  <img
                    ref={imgRef}
                    src={(version === 2 && PAPER_DOC_IMAGES[doc.id]?.mainV2) ? PAPER_DOC_IMAGES[doc.id].mainV2! : (PAPER_DOC_IMAGES[doc.id]?.main ?? '/docs/paper-doc-main.jpg')}
                    className="max-w-full max-h-full object-contain rounded-[4px]"
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: isDragging ? 'none' : 'transform 0.15s ease',
                      userSelect: 'none',
                    }}
                    draggable={false}
                    alt="Фото паперового документа"
                  />
                ) : (
                  <img
                    ref={imgRef}
                    src={activePage === 1 ? '/docs/doc-preview-p1.png' : '/docs/doc-preview-p2.png'}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                      transformOrigin: 'center',
                      transition: isDragging ? 'none' : 'transform 0.15s ease',
                      userSelect: 'none',
                    }}
                    draggable={false}
                    alt="Document preview"
                  />
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 pt-3 shrink-0">
                {doc.isPaperScan ? (
                  <button
                    style={{
                      width: 96, height: 67,
                      border: '1px solid #3f99f3',
                      borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                    }}
                  >
                    <img src={(version === 2 && PAPER_DOC_IMAGES[doc.id]?.mainV2) ? PAPER_DOC_IMAGES[doc.id].mainV2! : (PAPER_DOC_IMAGES[doc.id]?.thumb ?? '/docs/paper-doc-thumb.jpg')} className="w-full h-full object-cover" alt="Сторінка 1" />
                  </button>
                ) : (
                  [1, 2].map(page => (
                    <button
                      key={page}
                      onClick={() => setActivePage(page)}
                      style={{
                        width: 96, height: 67,
                        border: `1px solid ${activePage === page ? '#3f99f3' : '#dedede'}`,
                        borderRadius: 4, overflow: 'hidden', flexShrink: 0,
                      }}
                    >
                      <img
                        src={page === 1 ? '/docs/doc-preview-p1.png' : '/docs/doc-preview-p2.png'}
                        className="w-full h-full object-cover"
                        alt={`Page ${page}`}
                      />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right pane — fields */}
            <div className="flex-1 min-w-0 bg-white border border-[#d9d9d9] rounded-[8px] p-4 overflow-y-auto scrollbar-brand flex flex-col gap-4 min-h-0">
              {/* Signature / stamp status row */}
              {doc.isPaperScan ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 pb-4 border-b border-[#e5e9ee] shrink-0">
                  {([
                    { label: 'Підпис контрагента:', present: cpSigned, presentLabel: 'Наявний', absentLabel: 'Відсутній' },
                    { label: 'Підпис Lasoft:', present: lsSigned, presentLabel: 'Наявний', absentLabel: 'Відсутній' },
                    { label: 'Печатка контрагента:', present: cpStamped, presentLabel: 'Наявна, коректна', absentLabel: 'Відсутня' },
                    { label: 'Печатка Lasoft:', present: lsStamped, presentLabel: 'Наявна', absentLabel: 'Відсутня' },
                  ] as const).map(({ label, present, presentLabel, absentLabel }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[14px] text-[#64748b] leading-5 whitespace-nowrap">{label}</span>
                      <div className="flex items-center gap-1">
                        {present
                          ? <><CheckCircle2 size={16} className="text-[#047857] shrink-0" /><span className="text-[14px] text-[#047857] leading-5">{presentLabel}</span></>
                          : <><XCircle size={16} className="text-[#dd4d4d] shrink-0" /><span className="text-[14px] text-[#dd4d4d] leading-5">{absentLabel}</span></>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const counterpartySigned = localSignature !== 'not_signed';
                  const lasoftSigned = localSignature === 'signed_all';
                  return (
                    <div className="flex flex-wrap gap-3 pb-4 border-b border-[#e5e9ee] shrink-0">
                      <div className="flex items-center gap-4 w-[308px]">
                        <span className="text-[14px] text-[#64748b] leading-5 whitespace-nowrap">Підпис контрагента:</span>
                        <div className="flex items-center gap-1">
                          {counterpartySigned
                            ? <><CheckCircle2 size={16} className="text-[#047857] shrink-0" /><span className="text-[14px] text-[#047857] leading-5">Наявний</span></>
                            : <><XCircle size={16} className="text-[#dd4d4d] shrink-0" /><span className="text-[14px] text-[#dd4d4d] leading-5">Відсутній</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-[308px]">
                        <span className="text-[14px] text-[#64748b] leading-5 whitespace-nowrap">Підпис Lasoft:</span>
                        <div className="flex items-center gap-1">
                          {lasoftSigned
                            ? <><CheckCircle2 size={16} className="text-[#047857] shrink-0" /><span className="text-[14px] text-[#047857] leading-5">Наявний</span></>
                            : <><XCircle size={16} className="text-[#dd4d4d] shrink-0" /><span className="text-[14px] text-[#dd4d4d] leading-5">Відсутній</span></>}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Base document fields */}
              <div className="flex flex-col gap-1 shrink-0">
                <MetaRow label="Вид:" value={fields.vid} onChange={v => setField('vid', v)} />
                <MetaRow label="Номер:" value={fields.nomer} onChange={v => setField('nomer', v)} />
                <MetaRow label="Дата складання:" value={fields.dataSkl} onChange={v => setField('dataSkl', v)} />
                {doc.isPaperScan && !isDeliveryNote && (
                  <MetaRow label="Місце складання:" value={fields.misceSkl} onChange={v => setField('misceSkl', v)} />
                )}
                {!doc.isPaperScan && (
                  <MetaRow label="Договір:" value={fields.dohovir} onChange={v => setField('dohovir', v)} />
                )}
              </div>

              {/* Executor / Supplier section */}
              <SectionDivider label={isDeliveryNote ? 'ДАНІ ПРО ПОСТАЧАЛЬНИКА:' : 'ДАНІ ПРО ВИКОНАВЦЯ:'} />
              <div className="flex flex-col gap-1 shrink-0">
                <MetaRow label="Виконавець:" value={fields.vykonavets} onChange={v => setField('vykonavets', v)} />
                {!isDeliveryNote && (
                  <MetaRow label="Представник:" value={fields.predstavnyk} onChange={v => setField('predstavnyk', v)} />
                )}
                <MetaRow label={isDeliveryNote ? 'РНОКПП:' : 'ЄДРПОУ:'} value={fields.edrpouVyk} onChange={v => setField('edrpouVyk', v)} />
                {doc.isPaperScan && (
                  <MetaRow label="ІПН:" value={fields.ipn} onChange={v => setField('ipn', v)} />
                )}
                <MetaRow label="Р/р:" value={fields.prakh} onChange={v => setField('prakh', v)} />
                <MetaRow label="Банк:" value={fields.bank} onChange={v => setField('bank', v)} />
                <MetaRow label="Адреса:" value={fields.adresaVyk} onChange={v => setField('adresaVyk', v)} />
                {!doc.isPaperScan && (
                  <MetaRow label="Номер телефону:" value={fields.telefon} onChange={v => setField('telefon', v)} />
                )}
                {!doc.isPaperScan && (
                  <MetaRow label="МФО:" value={fields.mfo} onChange={v => setField('mfo', v)} />
                )}
                <MetaRow label="Система оподаткування:" value={fields.shoCe} onChange={v => setField('shoCe', v)} />
                {isDeliveryNote && det?.sklad && (
                  <MetaRow label="Склад:" value={det.sklad} onChange={() => {}} />
                )}
              </div>

              {/* Customer / Payer section */}
              <SectionDivider label={isDeliveryNote ? 'ДАНІ ПРО ПЛАТНИКА:' : 'ДАНІ ПРО ЗАМОВНИКА:'} />
              <div className="flex flex-col gap-1 shrink-0">
                <MetaRow label="Замовник:" value={fields.zamovnyk} onChange={v => setField('zamovnyk', v)} />
                <MetaRow label="ЄДРПОУ:" value={fields.edrpouZam} onChange={v => setField('edrpouZam', v)} />
                {!isDeliveryNote && (
                  <MetaRow label="Адреса:" value={fields.adresaZam} onChange={v => setField('adresaZam', v)} />
                )}
                {isDeliveryNote && (
                  <MetaRow label="Підстава:" value={fields.dohovir} onChange={v => setField('dohovir', v)} />
                )}
              </div>

              {/* Line items table */}
              <div className="shrink-0">
                <div className="h-px bg-[#e5e9ee] w-full mb-3" />
                {det?.lineItems ? (
                  /* Paper doc: multi-item table with Код column + totals */
                  <><table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f8fafc] h-8">
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b] text-center w-5">#</th>
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b] text-center w-28">Код</th>
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b]">Найменування, характеристика, артикул послуг</th>
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b] text-center w-16">Кількість</th>
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b] text-center w-20">Ціна</th>
                        <th className="border border-[#cbd5e1] px-1 text-[12px] font-medium text-[#64748b] text-center w-20">Сума</th>
                      </tr>
                    </thead>
                    <tbody>
                      {det.lineItems.map((item, i) => (
                        <tr key={i}>
                          <td className="border border-[#cbd5e1] text-center"><CopyableCell value={String(i + 1)} className="text-center" /></td>
                          <td className="border border-[#cbd5e1] text-center"><CopyableCell value={item.code} className="text-center" /></td>
                          <td className="border border-[#cbd5e1]"><CopyableCell value={item.naym} /></td>
                          <td className="border border-[#cbd5e1] text-center"><CopyableCell value={item.kilk} className="text-center" /></td>
                          <td className="border border-[#cbd5e1] text-right"><CopyableCell value={item.cina} className="text-right" /></td>
                          <td className="border border-[#cbd5e1] text-right"><CopyableCell value={item.suma} className="text-right" /></td>
                        </tr>
                      ))}
                      {det.razom && (
                        <tr>
                          <td colSpan={4} />
                          <td className="px-1 py-1.5 text-[14px] text-[#475569] text-right font-bold">Разом</td>
                          <td><CopyableCell value={det.razom} className="text-right font-bold" /></td>
                        </tr>
                      )}
                      {det.pdv && (
                        <tr>
                          <td colSpan={4} />
                          <td className="px-1 py-1.5 text-[14px] text-[#475569] text-right font-bold">В тому числі ПДВ</td>
                          <td><CopyableCell value={det.pdv} className="text-right font-bold" /></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {det.sumaPropys && (
                    <div className="pt-1">
                      <MetaRow label="Сума:" value={fields.sumaPropys} onChange={v => setField('sumaPropys', v)} />
                    </div>
                  )}</>
                ) : (
                  /* E-doc: single editable line item */
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f8fafc] h-8">
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b] w-5">#</th>
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b]">Найменування робіт, послуг</th>
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b] w-16 text-center">Кількість</th>
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b] w-8 text-center">Од.</th>
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b] w-24 text-right">Ціна</th>
                        <th className="border border-[#cbd5e1] px-2 text-[12px] font-medium text-[#64748b] w-24 text-right">Сума</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-[#cbd5e1]">
                          <span className="block px-1.5 py-1 text-[14px] text-[#475569]">1</span>
                        </td>
                        <td className="border border-[#cbd5e1]">
                          <EditableCell value={fields.liNaym} onChange={v => setField('liNaym', v)} />
                        </td>
                        <td className="border border-[#cbd5e1]">
                          <EditableCell value={fields.liKilk} onChange={v => setField('liKilk', v)} className="text-center" />
                        </td>
                        <td className="border border-[#cbd5e1]">
                          <EditableCell value={fields.liOd} onChange={v => setField('liOd', v)} className="text-center" />
                        </td>
                        <td className="border border-[#cbd5e1]">
                          <EditableCell value={fields.liCina} onChange={v => setField('liCina', v)} className="text-right" />
                        </td>
                        <td className="border border-[#cbd5e1]">
                          <EditableCell value={fields.liSuma} onChange={v => setField('liSuma', v)} className="text-right" />
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} />
                        <td className="px-1 py-1.5 text-[14px] text-[#475569] text-right font-medium">Разом</td>
                        <td className="border-t border-[#cbd5e1]"><CopyableCell value={fields.liSuma} className="text-right font-medium" /></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[14px] text-[#64748b]">
            {activeTab === 'comments' ? 'Коментарі відсутні' : 'Історія змін відсутня'}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="shrink-0 bg-white border-t border-[#d9d9d9] shadow-[0px_-2px_4px_rgba(0,0,0,0.08)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-[5px]">
            <button
              onClick={onPrevDoc}
              disabled={!hasPrev}
              className="flex items-center justify-center w-8 h-8 bg-white border border-[#d9d9d9] rounded-[4px] hover:enabled:border-[#0975e2] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} className="text-[#2c2c2c]" />
            </button>
            <button
              onClick={onNextDoc}
              disabled={!hasNext}
              className="flex items-center justify-center w-8 h-8 bg-white border border-[#d9d9d9] rounded-[4px] hover:enabled:border-[#0975e2] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} className="text-[#2c2c2c]" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div ref={actionsMenuRef} className="relative">
              <button
                onClick={() => setShowActionsMenu(v => !v)}
                className="w-10 h-10 flex items-center justify-center rounded-[4px] hover:bg-[#f6f6f6] transition-colors"
              >
                <MoreVertical size={24} className="text-[#2c2c2c]" />
              </button>
              {showActionsMenu && (
                <div className="absolute bottom-[calc(100%+8px)] right-0 w-max bg-white border border-[#d9d9d9] rounded-[8px] shadow-[0px_2px_4px_rgba(0,0,0,0.08)] overflow-hidden z-10">
                  <button
                    onClick={() => setShowActionsMenu(false)}
                    className="w-full flex items-center justify-start gap-2 px-6 py-3 border-b border-[#d9d9d9] hover:bg-[#fef2f2] transition-colors"
                  >
                    <Trash2 size={24} className="text-[#c93838] shrink-0" />
                    <span className="text-[16px] font-medium text-[#c93838] tracking-[-0.32px] whitespace-nowrap">Видалити документ</span>
                  </button>
                  <button
                    onClick={() => setShowActionsMenu(false)}
                    className="w-full flex items-center justify-start gap-2 px-6 py-3 hover:bg-[#f6f6f6] transition-colors"
                  >
                    <Combine size={24} className="text-[#2c2c2c] shrink-0" />
                    <span className="text-[16px] font-medium text-[#2c2c2c] tracking-[-0.32px] whitespace-nowrap">Додати як версію до документу</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowNewVersionDialog(true)}
              className="flex items-center gap-2 h-12 px-6 bg-white border border-[#d9d9d9] rounded-full text-[16px] font-medium text-[#2c2c2c] hover:bg-[#f6f6f6] transition-colors whitespace-nowrap"
            >
              <CloudUpload size={20} />
              Нова версія
            </button>
            {sentToBAS ? (
              <button
                disabled
                className="flex items-center gap-2 h-12 px-6 rounded-full text-[16px] font-medium whitespace-nowrap bg-white border border-[#0fab4b] text-[#2c2c2c] cursor-default"
              >
                Відправлено в BAS
                <Check size={24} />
              </button>
            ) : (
              <button
                onClick={handleSendToBAS}
                className="flex items-center gap-2 h-12 px-6 rounded-full text-[16px] font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ background: 'linear-gradient(98.61deg, #3f99f3 0%, #0975e2 100%)' }}
              >
                <Send size={20} />
                Відправити в BAS
              </button>
            )}
          </div>
        </div>

        {/* ── New version dialog ── */}
        {showNewVersionDialog && (
          <NewVersionDialog
            onClose={() => setShowNewVersionDialog(false)}
            onConfirm={() => {
              setShowNewVersionDialog(false);
              setVersion(v => v + 1);
              setShowVersionBanner(true);
              setLocalSignature('awaiting_mine');
              setOriginalStatus('В наявності');
              setCpSigned(true);
              setCpStamped(true);
              onNewVersion?.(doc.id);
            }}
          />
        )}

        {/* ── Toast — centered in header row, y=56 within the modal sheet ── */}
        {showToast && (
          <div
            className="absolute top-[56px] left-1/2 -translate-x-1/2 z-10 w-[466px] h-14 flex items-center gap-2 rounded-[8px] px-4 backdrop-blur-[10px] drop-shadow-[0px_2px_4px_rgba(0,0,0,0.08)]"
            style={{ background: 'linear-gradient(103.44deg, rgba(15,171,75,0.12) 0%, rgba(5,163,66,0.12) 100%), white' }}
          >
            <CircleCheckBig size={24} className="text-[#0fab4b] shrink-0" />
            <span className="flex-1 text-[14px] text-[#2c2c2c] leading-6">Документ успішно відправлено в BAS</span>
            <button onClick={() => setShowToast(false)} className="shrink-0 flex items-center justify-center">
              <X size={16} className="text-[#64748b]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
