import React from 'react';
import { Flame, Snowflake } from 'lucide-react';

interface HotColdNumbersProps {
  results: string[];
}

export function HotColdNumbers({ results }: HotColdNumbersProps) {
  const frequency = results.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  const allNumbers = Array.from({ length: 37 }, (_, i) => i.toString());

  allNumbers.forEach(num => {
    if (!frequency[num]) {
      frequency[num] = 0;
    }
  });

  const sortedByFrequency = Object.entries(frequency).sort(([, a], [, b]) => b - a);
  const hotNumbers = sortedByFrequency.slice(0, 5);
  const coldNumbers = sortedByFrequency.filter(([, count]) => count === 0).slice(0, 5);

  return (
    <div className="space-y-6 p-4 bg-zinc-800 rounded-lg">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-red-500" />
          <h4 className="font-semibold text-gray-200">Números Quentes</h4>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {hotNumbers.map(([number, count]) => (
            <div key={number} className="bg-zinc-900 border border-red-500/30 rounded-lg p-3 text-center shadow-lg hover:border-red-500 transition-colors">
              <div className="text-xl font-bold text-red-500">{number}</div>
              <div className="text-xs text-red-400/80">{count}x</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Snowflake className="w-5 h-5 text-blue-400" />
          <h4 className="font-semibold text-gray-200">Números Frios</h4>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {coldNumbers.map(([number]) => (
            <div key={number} className="bg-zinc-900 border border-blue-500/30 rounded-lg p-3 text-center shadow-lg hover:border-blue-500 transition-colors">
              <div className="text-xl font-bold text-blue-400">{number}</div>
              <div className="text-xs text-blue-400/80">0x</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}