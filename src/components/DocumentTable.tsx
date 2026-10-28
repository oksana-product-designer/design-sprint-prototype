import { useState, useRef } from 'react';
import {
  ChevronsUpDown, ChevronUp, MoreVertical, Check, AtSign,
  MessageCircle, CloudUpload, ListFilter, ArrowDownUp,
  RefreshCw, ChevronLeft, ChevronRight, ChevronDown, X,
} from 'lucide-react';
import {
  AccountingDocument, DocumentSource, SignatureStatus,
  SOURCE_LABELS, SIGNATURE_LABELS,
} from '../types';
import { StatFilterKey } from './StatsSection';

const FILTER_LABELS: Record<StatFilterKey, string> = {
  isNew: 'Нових документів',
  isError: 'Потребують уваги',
  needsRework: 'Потребують доопрацювання',
  notInBAS: 'Не передані в BAS',
};

interface Props {
  documents: AccountingDocument[];
  onDocumentClick?: (doc: AccountingDocument) => void;
  activeFilters?: Set<StatFilterKey>;
  onFilterToggle?: (key: StatFilterKey) => void;
}

const PAGE_SIZES = [10, 25, 50];

const PREVIEW_IMAGES: Record<string, string> = {
  '21': '/docs/paper-doc-main.jpg',
  '1': '/docs/doc-preview-p1.png',
  '22': '/docs/delivery-note-4587.png',
};

type SortField = 'dateReceived' | 'dateCompiled';
type SortDir = 'asc' | 'desc';

function parseDMY(date: string): number {
  const [d, m, y] = date.split('.');
  return parseInt(y) * 10000 + parseInt(m) * 100 + parseInt(d);
}

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceIcon({ source }: { source: DocumentSource }) {
  if (source === 'email') return <AtSign size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'chatbot') return <MessageCircle size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'upload') return <CloudUpload size={16} className="text-[#2c2c2c] shrink-0" />;
  if (source === 'vchasno') {
    return <img src="/logos/vchasno.png" className="w-4 h-4 rounded-full object-cover shrink-0" alt="Вчасно" />;
  }
  return <img src="/logos/sota.png" className="w-4 h-4 rounded-full object-cover shrink-0" alt="Сота" />;
}

function SourceBadge({ source }: { source: DocumentSource }) {
  return (
    <div className="inline-flex items-center gap-1 bg-[#f6f6f6] border border-[rgba(44,44,44,0.1)] rounded-full pl-1 pr-3 py-1 shrink-0">
      <SourceIcon source={source} />
      <span className="text-[12px] text-[#2c2c2c] leading-4 whitespace-nowrap">
        {SOURCE_LABELS[source]}
      </span>
    </div>
  );
}

// ─── Signature badge ──────────────────────────────────────────────────────────

const SIGNATURE_ICONS: Record<SignatureStatus, string> = {
  signed_all: '✅',
  not_signed: '❌',
  awaiting_mine: '⌛',
};

function SignatureBadge({ status }: { status: SignatureStatus }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white border border-[rgba(44,44,44,0.1)] rounded-full px-3 py-1 max-w-full overflow-hidden">
      <span className="text-[12px] shrink-0">{SIGNATURE_ICONS[status]}</span>
      <span className="text-[12px] text-[#2c2c2c] leading-4 overflow-hidden text-ellipsis whitespace-nowrap">
        {SIGNATURE_LABELS[status]}
      </span>
    </div>
  );
}

// ─── Row background ───────────────────────────────────────────────────────────

function rowBg(doc: AccountingDocument): React.CSSProperties {
  if (doc.isNew && doc.isError) {
    return { backgroundColor: 'rgba(213,24,24,0.08)', backgroundImage: 'none' };
  }
  if (doc.isNew) {
    return {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(90deg, rgba(63,153,243,0.05) 0%, rgba(63,153,243,0.05) 100%)',
    };
  }
  if (doc.isError) {
    return {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(90deg, rgba(213,24,24,0.08) 0%, rgba(213,24,24,0.08) 100%)',
    };
  }
  return { backgroundColor: '#ffffff', backgroundImage: 'none' };
}

// ─── Main table ───────────────────────────────────────────────────────────────

export default function DocumentTable({ documents, onDocumentClick, activeFilters, onFilterToggle }: Props) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const [previewState, setPreviewState] = useState<{ imgSrc: string | null; x: number; y: number } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<{ x: number; y: number; docId: string }>({ x: 0, y: 0, docId: '' });
  const [sortField, setSortField] = useState<SortField | null>('dateReceived');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sortUserActive, setSortUserActive] = useState(false);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setSortUserActive(true);
    setPage(0);
  }

  const sortedDocs = sortField
    ? [...documents].sort((a, b) => {
        const av = parseDMY(a[sortField]);
        const bv = parseDMY(b[sortField]);
        return sortDir === 'desc' ? bv - av : av - bv;
      })
    : documents;

  const totalPages = Math.ceil(sortedDocs.length / pageSize);
  const pageDocs = sortedDocs.slice(page * pageSize, (page + 1) * pageSize);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(0);
    setShowPageSizeMenu(false);
  }

  return (
    <div className="flex flex-col">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[24px] font-semibold text-[#0f172a] leading-6 whitespace-nowrap">
            Всі документи
          </h2>
          <div className="bg-white border border-[rgba(44,44,44,0.1)] rounded-full px-3 py-1">
            <span className="text-[14px] font-medium text-[#2c2c2c] leading-4">
              {documents.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-[4px] hover:bg-white/60 transition-colors text-[#2c2c2c]">
            <ListFilter size={16} />
          </button>
          <button className="p-2 rounded-[4px] hover:bg-white/60 transition-colors text-[#2c2c2c]">
            <ArrowDownUp size={16} />
          </button>
          <button className="p-2 rounded-[4px] hover:bg-white/60 transition-colors text-[#2c2c2c]">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilters && activeFilters.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {([...activeFilters] as StatFilterKey[]).map(key => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 bg-white border border-[#d9d9d9] rounded-full px-3 py-1.5 text-[13px] text-[#2c2c2c] leading-4"
            >
              {FILTER_LABELS[key]}
              <button
                onClick={() => onFilterToggle?.(key)}
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[#e2e2e2] transition-colors shrink-0"
                aria-label={`Прибрати фільтр ${FILTER_LABELS[key]}`}
              >
                <X size={10} className="text-[#64748b]" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div>
        {/* Header row — transparent bg (page #f6f6f6 shows through), no shadow */}
        <div className="flex items-center border-b border-[#d9d9d9]">
          <div className="flex items-center px-2 py-3 shrink-0">
            <div className="w-[14px] h-[14px] border border-[#d9d9d9] rounded-[2px]" />
          </div>
          <div className="flex flex-1 items-center gap-2 px-2 py-3 min-w-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Документ</span>
          </div>
          <div className="flex w-[192px] items-center shrink-0">
            <button
              onClick={() => handleSort('dateReceived')}
              className="flex items-center gap-2 px-2 py-3 hover:text-[#0975e2] transition-colors group"
            >
              {(() => {
                const active = sortUserActive && sortField === 'dateReceived';
                return <>
                  <span className={`text-[14px] leading-4 whitespace-nowrap ${active ? 'text-[#0975e2]' : 'text-[#4c5c72]'}`}>
                    Дата надходження
                  </span>
                  {active
                    ? sortDir === 'desc'
                      ? <ChevronDown size={14} className="text-[#0975e2] shrink-0" />
                      : <ChevronUp size={14} className="text-[#0975e2] shrink-0" />
                    : <ChevronsUpDown size={14} className="text-[#4c5c72] shrink-0 group-hover:text-[#0975e2]" />
                  }
                </>;
              })()}
            </button>
          </div>
          <div className="flex flex-1 items-center gap-2 px-2 py-3 min-w-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Компанія / ПІБ</span>
          </div>
          <div className="flex w-[192px] items-center shrink-0">
            <button
              onClick={() => handleSort('dateCompiled')}
              className="flex items-center gap-2 px-2 py-3 hover:text-[#0975e2] transition-colors group"
            >
              {(() => {
                const active = sortUserActive && sortField === 'dateCompiled';
                return <>
                  <span className={`text-[14px] leading-4 whitespace-nowrap ${active ? 'text-[#0975e2]' : 'text-[#4c5c72]'}`}>
                    Дата складання
                  </span>
                  {active
                    ? sortDir === 'desc'
                      ? <ChevronDown size={14} className="text-[#0975e2] shrink-0" />
                      : <ChevronUp size={14} className="text-[#0975e2] shrink-0" />
                    : <ChevronsUpDown size={14} className="text-[#4c5c72] shrink-0 group-hover:text-[#0975e2]" />
                  }
                </>;
              })()}
            </button>
          </div>
          <div className="flex w-[96px] items-center px-2 py-3 shrink-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Номер</span>
          </div>
          <div className="flex w-[128px] items-center px-2 py-3 shrink-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Джерело</span>
          </div>
          <div className="flex w-[192px] items-center px-2 py-3 shrink-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 whitespace-nowrap">Підпис</span>
          </div>
          <div className="flex w-[120px] items-center justify-center px-2 py-3 shrink-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 text-center">Доопрацювання</span>
          </div>
          <div className="flex w-[136px] items-start justify-center px-2 py-3 shrink-0">
            <span className="text-[14px] text-[#4c5c72] leading-4 text-center whitespace-nowrap">Передано в BAS</span>
          </div>
          <div className="w-10 shrink-0" />
        </div>

        {/* Body — shadow + rounded bottom, separate from header */}
        <div className="shadow-[0px_2px_4px_rgba(0,0,0,0.08)] rounded-b-[8px] overflow-hidden">
        {pageDocs.map((doc, idx) => (
          <div
            key={doc.id}
            className={`flex items-center border-b cursor-pointer hover:brightness-[0.97] transition-[filter] ${
              idx === pageDocs.length - 1
                ? 'border-transparent'
                : 'border-[#e2e2e2]'
            }`}
            style={rowBg(doc)}
            onClick={() => onDocumentClick?.(doc)}
            onMouseEnter={e => {
              cursorRef.current = { x: e.clientX, y: e.clientY, docId: doc.id };
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = setTimeout(() => {
                const { x, y, docId } = cursorRef.current;
                setPreviewState({ imgSrc: PREVIEW_IMAGES[docId] ?? null, x, y });
              }, 1000);
            }}
            onMouseMove={e => {
              cursorRef.current = { ...cursorRef.current, x: e.clientX, y: e.clientY };
              setPreviewState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : prev);
            }}
            onMouseLeave={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
              hoverTimerRef.current = null;
              setPreviewState(null);
            }}
          >
            {/* Checkbox */}
            <div className="flex items-center h-[56px] px-2 py-[18px] shrink-0">
              <div className="w-[14px] h-[14px] border border-[#d9d9d9] rounded-[2px]" />
            </div>

            {/* Document name */}
            <div className="flex flex-1 gap-2 items-center h-[56px] px-2 py-[18px] min-w-0">
              {doc.isNew && (
                <div className="w-2 h-2 rounded-full bg-[#0975e2] shrink-0" />
              )}
              {doc.isError && (
                <span className="text-[12px] leading-4 shrink-0">🚨</span>
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-[14px] leading-5 ${
                    doc.isNew ? 'font-bold text-[#2c2c2c]' : 'font-normal text-[#64748b]'
                  }`}
                >
                  {doc.name}
                </span>
                {doc.isNewVersion && (
                  <span className="text-[12px] font-medium text-[#0975e2] leading-4 whitespace-nowrap">
                    (Нова версія)
                  </span>
                )}
              </div>
            </div>

            {/* Date received */}
            <div className="flex h-[56px] items-center w-[192px] px-2 py-[18px] shrink-0">
              <span
                className={`text-[14px] leading-5 w-full ${
                  doc.isNew ? 'font-bold text-[#2c2c2c]' : 'font-normal text-[#64748b]'
                }`}
              >
                {doc.dateReceived}
              </span>
            </div>

            {/* Counterparty */}
            <div className="flex flex-1 h-[56px] items-center px-2 py-[18px] min-w-0">
              <span className={`text-[14px] leading-5 w-full truncate ${doc.isNew ? 'font-bold' : 'font-medium'} text-[#2c2c2c]`}>
                {doc.counterparty}
              </span>
            </div>

            {/* Date compiled */}
            <div className="flex h-[56px] items-center w-[192px] px-2 py-[18px] shrink-0">
              <span
                className={`text-[14px] leading-5 w-full ${
                  doc.isNew ? 'font-bold text-[#2c2c2c]' : 'font-normal text-[#64748b]'
                }`}
              >
                {doc.dateCompiled}
              </span>
            </div>

            {/* Number */}
            <div className="flex h-[56px] items-center w-[96px] px-2 py-[18px] shrink-0">
              <span
                className={`text-[14px] leading-5 w-full ${
                  doc.isNew ? 'font-bold text-[#2c2c2c]' : 'font-normal text-[#64748b]'
                }`}
              >
                {doc.number}
              </span>
            </div>

            {/* Source */}
            <div className="flex h-[56px] items-center w-[128px] px-2 py-4 shrink-0">
              <SourceBadge source={doc.source} />
            </div>

            {/* Signature */}
            <div className="flex h-[56px] items-center w-[192px] px-2 py-5 shrink-0">
              <SignatureBadge status={doc.signature} />
            </div>

            {/* Rework */}
            <div className="flex h-[56px] items-center justify-center w-[120px] px-2 py-5 shrink-0">
              {doc.needsRework ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-[#2c2c2c] whitespace-nowrap">
                  <span>⚠️</span>
                  <span>Потребує</span>
                </span>
              ) : (
                <span className="text-[12px] text-[#2c2c2c]">–</span>
              )}
            </div>

            {/* Transferred to BAS */}
            <div className="flex h-[56px] items-center justify-center w-[136px] px-2 py-5 shrink-0">
              {doc.transferredToBAS ? (
                <Check size={20} className="text-[#27ae60]" />
              ) : (
                <span className="text-[14px] text-[#64748b]">–</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex h-[56px] items-center justify-center w-10 px-2 py-5 shrink-0">
              <button className="text-[#2c2c2c] hover:opacity-60 transition-opacity">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
        </div>{/* end body shadow wrapper */}
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between pt-3">
        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#64748b] leading-[18px] whitespace-nowrap">
            Рядків на сторінці:
          </span>
          <div className="relative">
            <button
              onClick={() => setShowPageSizeMenu(v => !v)}
              className="flex items-center gap-2 bg-white border border-[#d9d9d9] rounded-[4px] px-3 py-2 text-[14px] text-[#2c2c2c] hover:border-[#0975e2] transition-colors"
            >
              {pageSize}
              <ChevronDown size={16} />
            </button>
            {showPageSizeMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-[#d9d9d9] rounded-[4px] shadow-table z-10 overflow-hidden min-w-[60px]">
                {PAGE_SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    className={`block w-full px-4 py-2 text-left text-[14px] hover:bg-[#f6f6f6] transition-colors ${
                      size === pageSize ? 'text-[#0975e2] font-semibold' : 'text-[#2c2c2c]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Page info + navigation */}
        <div className="flex items-center gap-4">
          <span className="text-[12px] leading-[18px] whitespace-nowrap">
            <span className="font-semibold text-[#2c2c2c]">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedDocs.length)}
            </span>
            <span className="text-[#64748b]"> з {sortedDocs.length} документів</span>
          </span>
          <div className="flex items-center gap-[5px]">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center justify-center w-8 h-8 bg-white border border-[#d9d9d9] rounded-[4px] disabled:opacity-40 hover:enabled:border-[#0975e2] transition-colors"
            >
              <ChevronLeft size={16} className="text-[#2c2c2c]" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center justify-center w-8 h-8 bg-white border border-[#d9d9d9] rounded-[4px] disabled:opacity-40 hover:enabled:border-[#0975e2] transition-colors"
            >
              <ChevronRight size={16} className="text-[#2c2c2c]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Document preview tooltip ── */}
      {previewState && (
        <div
          className="fixed z-50 rounded-[8px] overflow-hidden pointer-events-none bg-white"
          style={{
            width: 208,
            height: 160,
            boxShadow: '0px 4px 8px 0px rgba(0,0,0,0.15)',
            top: Math.min(previewState.y + 14, window.innerHeight - 168),
            left: Math.max(8, Math.min(previewState.x - 104, window.innerWidth - 216)),
            animation: 'previewFadeIn 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {previewState.imgSrc
            ? <img src={previewState.imgSrc} className="w-full h-full object-contain" alt="" />
            : <div className="w-full h-full flex items-center justify-center px-4">
                <span className="text-[12px] text-[#64748b] text-center leading-5">
                  Прев'ю для цього документа не доступне
                </span>
              </div>
          }
        </div>
      )}
    </div>
  );
}
