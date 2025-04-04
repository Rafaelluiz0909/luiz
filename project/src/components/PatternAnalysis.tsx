import React from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Repeat } from 'lucide-react';

interface PatternAnalysisProps {
  results: string[];
}

export function PatternAnalysis({ results }: PatternAnalysisProps) {
  // Função para identificar sequências
  const findSequences = (numbers: string[]) => {
    const sequences = {
      increasing: 0,
      decreasing: 0,
      alternating: 0,
      repeating: 0
    };

    for (let i = 0; i < numbers.length - 2; i++) {
      const current = parseInt(numbers[i]);
      const next = parseInt(numbers[i + 1]);
      const nextNext = parseInt(numbers[i + 2]);

      // Sequência crescente
      if (current < next && next < nextNext) {
        sequences.increasing++;
      }
      // Sequência decrescente
      else if (current > next && next > nextNext) {
        sequences.decreasing++;
      }
      // Sequência alternada
      else if ((current < next && next > nextNext) || (current > next && next < nextNext)) {
        sequences.alternating++;
      }
      // Números repetidos
      else if (current === next || next === nextNext) {
        sequences.repeating++;
      }
    }

    return sequences;
  };

  // Função para analisar padrões de paridade
  const analyzeParityPatterns = (numbers: string[]) => {
    let evenCount = 0;
    let oddCount = 0;
    let alternatingCount = 0;

    numbers.forEach((num, index) => {
      const isEven = parseInt(num) % 2 === 0;
      if (isEven) {
        evenCount++;
      } else {
        oddCount++;
      }

      if (index > 0) {
        const prevIsEven = parseInt(numbers[index - 1]) % 2 === 0;
        if (isEven !== prevIsEven) {
          alternatingCount++;
        }
      }
    });

    return { evenCount, oddCount, alternatingCount };
  };

  // Função para analisar padrões de colunas
  const analyzeColumnPatterns = (numbers: string[]) => {
    const columns = {
      first: 0,  // números 1-12
      second: 0, // números 13-24
      third: 0   // números 25-36
    };

    numbers.forEach(num => {
      const number = parseInt(num);
      if (number >= 1 && number <= 12) columns.first++;
      else if (number >= 13 && number <= 24) columns.second++;
      else if (number >= 25 && number <= 36) columns.third++;
    });

    return columns;
  };

  const sequences = findSequences(results);
  const parityPatterns = analyzeParityPatterns(results);
  const columnPatterns = analyzeColumnPatterns(results);

  return (
    <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-semibold text-white">Análise de Padrões</h3>
      </div>

      {/* Sequências */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-300">Crescentes</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{sequences.increasing}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-300">Decrescentes</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{sequences.decreasing}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-300">Alternadas</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{sequences.alternating}</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-300">Repetições</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{sequences.repeating}</p>
        </div>
      </div>

      {/* Paridade */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Distribuição Par/Ímpar</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Pares</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(parityPatterns.evenCount / results.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-green-500">{parityPatterns.evenCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Ímpares</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${(parityPatterns.oddCount / results.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-red-500">{parityPatterns.oddCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Alternâncias</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(parityPatterns.alternatingCount / (results.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-blue-500">{parityPatterns.alternatingCount}</span>
          </div>
        </div>
      </div>

      {/* Colunas */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-red-600/20">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Distribuição por Colunas</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">1-12</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${(columnPatterns.first / results.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-yellow-500">{columnPatterns.first}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">13-24</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(columnPatterns.second / results.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-orange-500">{columnPatterns.second}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">25-36</span>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${(columnPatterns.third / results.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="text-sm font-medium text-pink-500">{columnPatterns.third}</span>
          </div>
        </div>
      </div>
    </div>
  );
}