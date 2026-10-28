import { useState, useRef } from 'react';
import Header from './components/Header';
import StatsSection, { StatFilterKey } from './components/StatsSection';
import DocumentTable from './components/DocumentTable';
import DocumentModal from './components/DocumentModal';
import { AccountingDocument } from './types';
import { mockDocuments } from './data';

export default function App() {
  const [documents, setDocuments] = useState<AccountingDocument[]>(mockDocuments);
  const [activeFilters, setActiveFilters] = useState<Set<StatFilterKey>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<AccountingDocument | null>(null);
  const [showBlockedMsg, setShowBlockedMsg] = useState(false);
  const blockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [docEdits, setDocEdits] = useState<Record<string, { fields?: Record<string, string>; originalStatus?: string }>>({});

  function handleDocEditsChange(docId: string, edits: { fields?: Record<string, string>; originalStatus?: string }) {
    setDocEdits(prev => ({ ...prev, [docId]: edits }));
  }

  function handleFilterToggle(key: StatFilterKey) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const filteredDocuments = activeFilters.size === 0
    ? documents
    : documents.filter(d =>
        (activeFilters.has('isNew') && d.isNew) ||
        (activeFilters.has('isError') && d.isError) ||
        (activeFilters.has('needsRework') && d.needsRework) ||
        (activeFilters.has('notInBAS') && !d.transferredToBAS)
      );

  function handleNeedsReworkChange(docId: string, needsRework: boolean) {
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, needsRework } : d)
    );
    if (selectedDocument?.id === docId) {
      setSelectedDocument(prev => prev ? { ...prev, needsRework } : prev);
    }
  }

  const availableDocs = documents.slice(0, 2);
  const selectedIdx = selectedDocument ? availableDocs.findIndex(d => d.id === selectedDocument.id) : -1;

  function handlePrevDoc() {
    if (selectedIdx < availableDocs.length - 1) setSelectedDocument(availableDocs[selectedIdx + 1]);
  }

  function handleNextDoc() {
    if (selectedIdx > 0) setSelectedDocument(availableDocs[selectedIdx - 1]);
  }

  function handleNewVersion(docId: string) {
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, isNew: false, isError: false, isNewVersion: false, signature: 'signed_all' } : d)
    );
  }

  function handleTransferToBAS(docId: string) {
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, transferredToBAS: true } : d)
    );
    if (selectedDocument?.id === docId) {
      setSelectedDocument(prev => prev ? { ...prev, transferredToBAS: true } : prev);
    }
  }

  function handleDocumentClick(doc: AccountingDocument) {
    if (documents.indexOf(doc) >= 2) {
      setShowBlockedMsg(true);
      if (blockedTimerRef.current) clearTimeout(blockedTimerRef.current);
      blockedTimerRef.current = setTimeout(() => setShowBlockedMsg(false), 3000);
      return;
    }
    setSelectedDocument(doc);
    if (doc.isNew) {
      setDocuments(prev =>
        prev.map(d => d.id === doc.id ? { ...d, isNew: false } : d)
      );
    }
  }

  return (
    <div className="bg-[#f6f6f6] min-h-screen">
      <Header />

      {/* Main content — offset below fixed 80px header */}
      <main className="pt-[80px] px-6">
        {/* Stat cards */}
        <div className="pt-6">
          <StatsSection
            documents={documents}
            activeFilters={activeFilters}
            onFilterToggle={handleFilterToggle}
          />
        </div>

        {/* Document table */}
        <div className="pt-6 pb-8">
          <DocumentTable
            documents={filteredDocuments}
            onDocumentClick={handleDocumentClick}
            activeFilters={activeFilters}
            onFilterToggle={handleFilterToggle}
          />
        </div>
      </main>

      {selectedDocument && (
        <DocumentModal
          key={selectedDocument.id}
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onNeedsReworkChange={handleNeedsReworkChange}
          onTransferToBAS={handleTransferToBAS}
          onNewVersion={handleNewVersion}
          onPrevDoc={handlePrevDoc}
          onNextDoc={handleNextDoc}
          hasPrev={selectedIdx < availableDocs.length - 1}
          hasNext={selectedIdx > 0}
          savedEdits={docEdits[selectedDocument.id]}
          onEditsChange={handleDocEditsChange}
        />
      )}

      {showBlockedMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#1e293b] text-white text-[14px] leading-5 rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.2)] whitespace-nowrap pointer-events-none">
          На жаль, наразі відкрити цей документ неможливо
        </div>
      )}
    </div>
  );
}
