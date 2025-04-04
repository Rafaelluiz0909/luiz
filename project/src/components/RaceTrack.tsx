import React from 'react';

interface RaceTrackProps {
  results: string[];
}

export function RaceTrack({ results }: RaceTrackProps) {
  // Definição dos números em cada seção
  const trackNumbers = [
    { number: '23', color: 'red' },
    { number: '8', color: 'black' },
    { number: '30', color: 'red' },
    { number: '11', color: 'black' },
    { number: '36', color: 'red' },
    { number: '13', color: 'black' },
    { number: '27', color: 'red' },
    { number: '6', color: 'black' },
    { number: '34', color: 'red' },
    { number: '17', color: 'black' },
    { number: '25', color: 'red' },
    { number: '2', color: 'black' },
    { number: '21', color: 'red' },
    { number: '4', color: 'black' },
    { number: '19', color: 'red' },
    { number: '15', color: 'black' },
    { number: '32', color: 'red' },
    { number: '0', color: 'green' },
    { number: '26', color: 'black' },
    { number: '3', color: 'red' },
    { number: '35', color: 'black' },
    { number: '12', color: 'red' },
    { number: '28', color: 'black' },
    { number: '7', color: 'red' },
    { number: '29', color: 'black' },
    { number: '18', color: 'red' },
    { number: '22', color: 'black' },
    { number: '9', color: 'red' },
    { number: '31', color: 'black' },
    { number: '14', color: 'red' },
    { number: '20', color: 'black' },
    { number: '1', color: 'red' },
    { number: '33', color: 'black' },
    { number: '16', color: 'red' },
    { number: '24', color: 'black' },
    { number: '5', color: 'red' },
    { number: '10', color: 'black' }
  ];

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Container circular para os números */}
        <div className="relative min-h-[240px] sm:min-h-[280px]">
          {/* Números em formato de pista oval */}
          <div className="flex flex-wrap justify-center">
            {trackNumbers.map((item, index) => {
              const isActive = results.includes(item.number);
              const totalNumbers = trackNumbers.length;
              const angle = (index / totalNumbers) * 2 * Math.PI;
              // Raio responsivo baseado no tamanho da tela
              const radius = window.innerWidth < 640 ? 120 : 160;

              // Calcular posição em círculo
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              // Rotação do número para acompanhar a curva
              const rotation = (angle * 180) / Math.PI + 90;

              return (
                <div key={item.number} style={{ position: 'absolute', left: '50%', top: '50%' }}>
                  {/* Número */}
                  <div
                    className={`
                      w-8 h-6 sm:w-10 sm:h-8 flex items-center justify-center
                      ${item.color === 'red' ? 'bg-red-600' : 
                        item.color === 'black' ? 'bg-black' : 
                        'bg-green-600'}
                      ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-100' : ''}
                      text-white text-xs sm:text-sm font-bold rounded
                      transform-gpu transition-all duration-200
                      hover:scale-110
                    `}
                    style={{
                      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                      transformOrigin: 'center',
                      position: 'absolute',
                      marginLeft: window.innerWidth < 640 ? '-16px' : '-20px',
                      marginTop: window.innerWidth < 640 ? '-12px' : '-16px'
                    }}
                  >
                    {item.number}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}