import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  results: string[];
}

export function PieChart({ results }: PieChartProps) {
  const frequency = results.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  const sortedNumbers = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Paleta de cores diversificada
  const colorPalette = [
    '#dc2626', // Vermelho
    '#2563eb', // Azul
    '#16a34a', // Verde
    '#9333ea', // Roxo
    '#ea580c', // Laranja
    '#0891b2', // Ciano
    '#4f46e5', // Índigo
    '#db2777', // Rosa
    '#ca8a04', // Amarelo
    '#84cc16', // Verde-limão
    '#7c3aed', // Violeta
    '#06b6d4', // Azul-claro
    '#f97316', // Laranja-claro
    '#8b5cf6', // Roxo-claro
    '#10b981', // Esmeralda
  ];

  const data = {
    labels: sortedNumbers.map(([number]) => number),
    datasets: [
      {
        data: sortedNumbers.map(([, count]) => count),
        backgroundColor: colorPalette,
        borderColor: '#18181b',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#f4f4f5',
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `Número ${label}: ${value} vezes`;
          },
        },
        backgroundColor: '#27272a',
        titleColor: '#f4f4f5',
        bodyColor: '#f4f4f5',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="h-[400px] w-full bg-zinc-800 p-6 rounded-lg">
      <Pie data={data} options={options} />
    </div>
  );
}