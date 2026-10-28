import { FileCheck, TriangleAlert, FileCog, MonitorOff } from 'lucide-react';
import { AccountingDocument } from '../types';

export type StatFilterKey = 'isNew' | 'isError' | 'needsRework' | 'notInBAS';

interface Props {
  documents: AccountingDocument[];
  activeFilters: Set<StatFilterKey>;
  onFilterToggle: (key: StatFilterKey) => void;
}

interface StatCardData {
  key: StatFilterKey;
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

export default function StatsSection({ documents, activeFilters, onFilterToggle }: Props) {
  const stats: StatCardData[] = [
    {
      key: 'isNew',
      label: 'Нових документів',
      value: documents.filter(d => d.isNew).length,
      icon: FileCheck,
      color: '#0975e2',
    },
    {
      key: 'isError',
      label: 'Потребують вашої уваги',
      value: documents.filter(d => d.isError).length,
      icon: TriangleAlert,
      color: '#da3535',
    },
    {
      key: 'needsRework',
      label: 'Потребує доопрацювання',
      value: documents.filter(d => d.needsRework).length,
      icon: FileCog,
      color: '#fb8524',
    },
    {
      key: 'notInBAS',
      label: 'Не передані в BAS',
      value: documents.filter(d => !d.transferredToBAS).length,
      icon: MonitorOff,
      color: '#b024fb',
    },
  ];

  return (
    <div className="flex gap-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          {...stat}
          isActive={activeFilters.has(stat.key)}
          onClick={() => onFilterToggle(stat.key)}
        />
      ))}
    </div>
  );
}

interface StatCardProps extends StatCardData {
  isActive: boolean;
  onClick: () => void;
}

function StatCard({ label, value, icon: Icon, color, isActive, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 bg-white rounded-[8px] flex items-center gap-4 p-[17px] text-left transition-all duration-150 hover:shadow-md focus:outline-none"
      style={{
        border: isActive ? `2px solid ${color}` : '1px solid #d9d9d9',
        padding: isActive ? '16px' : '17px',
        backgroundColor: isActive ? `${color}0d` : '#ffffff',
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <Icon size={24} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[32px] font-bold text-[#0f172a] leading-8">{value}</p>
        <p className="text-[14px] text-[#64748b] leading-4 mt-0.5">{label}</p>
      </div>
    </button>
  );
}
