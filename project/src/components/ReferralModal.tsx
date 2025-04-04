import React from 'react';
import { X, Instagram } from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-red-600/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Instagram className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold text-white">Programa de Afiliados</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              Para se tornar um afiliado e ganhar 50% de comissão em todas as vendas, entre em contato através do nosso Instagram:
            </p>
            <a
              href="https://www.instagram.com/estatisticastlas?igsh=MXB6ejF6NzkwdmIwbw%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:-translate-y-1"
            >
              <Instagram className="w-5 h-5" />
              @estatisticastlas
            </a>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 text-sm text-gray-300">
            <h4 className="font-semibold text-white mb-2">Benefícios:</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                50% de comissão em todas as vendas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                Material promocional exclusivo
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                Suporte prioritário
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                Pagamentos rápidos e garantidos
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}