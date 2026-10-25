import React from 'react';

interface FrenchAccentBarProps {
  onInsert: (char: string) => void;
  className?: string;
}

const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ô', 'ù', 'û', 'œ', '« »'];

export const FrenchAccentBar: React.FC<FrenchAccentBarProps> = ({ onInsert, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 py-1 ${className}`}>
      <span className="text-[11px] font-medium text-slate-400 select-none mr-1">Accents:</span>
      {ACCENTS.map((char) => (
        <button
          key={char}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onInsert(char === '« »' ? '«  »' : char);
          }}
          className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors shadow-xs active:scale-95"
          title={`Insert ${char}`}
        >
          {char}
        </button>
      ))}
    </div>
  );
};
