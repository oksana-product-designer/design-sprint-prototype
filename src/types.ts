// Document source — where the document came from
export type DocumentSource = 'chatbot' | 'email' | 'vchasno' | 'upload' | 'sota';

export interface LineItemSimple {
  naym: string;
  kilk: string;
  od: string;
  cina: string;
  suma: string;
}

export interface LineItemCoded {
  code: string;
  naym: string;
  kilk: string;
  cina: string;
  suma: string;
}

export interface DocumentDetails {
  dataSkl: string;       // human-readable date, e.g. "30 квітня 2026 р."
  misceSkl?: string;     // place of compilation (paper docs)
  dohovir?: string;      // contract reference (omit for paper docs)
  vykonavets: string;    // executor company name
  predstavnyk: string;   // executor representative — use '<не розпізнано>' sentinel when OCR failed
  edrpouVyk: string;     // executor EDRPOU
  ipn?: string;          // executor IPN (paper docs)
  prakh: string;         // executor IBAN
  bank: string;          // executor bank
  adresaVyk: string;     // executor address
  telefon?: string;      // executor phone (omit for paper docs)
  mfo?: string;          // executor bank MFO (omit for paper docs)
  shoCe: string;         // tax status
  zamovnyk?: string;     // customer company name (explicit; falls back to doc.counterparty)
  edrpouZam: string;     // customer EDRPOU / IPN
  adresaZam: string;     // customer address
  lineItem?: LineItemSimple;   // single line item (e-docs)
  lineItems?: LineItemCoded[]; // multiple line items with codes (paper docs)
  razom?: string;        // total sum
  pdv?: string;          // VAT amount
  sklad?: string;        // warehouse (delivery notes)
  sumaPropys?: string;   // sum in words (delivery notes)
}

// Signature status
export type SignatureStatus = 'signed_all' | 'not_signed' | 'awaiting_mine';

export interface AccountingDocument {
  id: string;
  details?: DocumentDetails;
  isPaperScan?: boolean;     // true = photo of paper doc (not an e-document)
  timeReceived?: string;     // optional HH:MM, defaults to '13:00'
  name: string;              // Document type name (e.g. "Акт надання послуг")
  isNew: boolean;            // Shows blue dot + bold text + blue tint row
  isNewVersion: boolean;     // Shows "(Нова версія)" label underneath
  isError: boolean;          // Shows 🚨 emoji + red tint row
  dateReceived: string;      // "dd.mm.yyyy" — Дата надходження
  dateCompiled: string;      // "dd.mm.yyyy" — Дата складання
  counterparty: string;      // Company or individual name
  number: string;            // Document number
  source: DocumentSource;
  signature: SignatureStatus;
  needsRework: boolean;      // Доопрацювання column
  transferredToBAS: boolean; // Передано в BAS column
}

export const SOURCE_LABELS: Record<DocumentSource, string> = {
  chatbot: 'Чат-бот',
  email: 'Ел. пошта',
  vchasno: 'Вчасно',
  upload: 'Завантажено',
  sota: 'Сота',
};

export const SIGNATURE_LABELS: Record<SignatureStatus, string> = {
  signed_all: 'Підписано всіма',
  not_signed: 'Не підписано',
  awaiting_mine: 'Очікує вашого підпису',
};
