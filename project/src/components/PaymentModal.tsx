import React, { useState, useEffect } from 'react';
import { X, Loader2, Copy, CheckCircle2, Instagram } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: {
    title: string;
    price: number;
    description: string;
  };
  minAmount?: number;
  allowCustomAmount?: boolean;
}

export function PaymentModal({ isOpen, onClose, plan, minAmount = 5, allowCustomAmount = false }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    amount: plan?.price || minAmount,
  });

  const PIX_KEY = '0cb3f491-4a3f-4dbb-a6a8-ef60afa139f2';

  // Reset states when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      setShowPaymentInfo(false);
      setError(null);
      setCopied(false);
      setFormData({
        name: '',
        email: user?.email || '',
        amount: plan?.price || minAmount,
      });
    }
  }, [isOpen, user?.email, plan?.price, minAmount]);

  const getPlanWarning = () => {
    if (!plan) return null;

    const warnings = {
      'Teste Rápido': 'R$ 10,00',
      'Plano Semanal': 'R$ 70,00',
      'Plano Mensal': 'R$ 120,00',
      'Plano Trimestral': 'R$ 300,00',
      'Acesso Vitalício': 'R$ 500,00',
      'ATLAS CHAT FULL - 10 Dias': 'R$ 68,00',
      'ATLAS CHAT FULL - Mensal': 'R$ 204,00',
      'ATLAS CHAT FULL - Trimestral': 'R$ 612,00'
    };

    return warnings[plan.title as keyof typeof warnings];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.amount < minAmount) {
        throw new Error(`O valor mínimo ${plan ? '' : 'para depósito '}é R$ ${minAmount.toFixed(2)}`);
      }

      // Simular processamento com 5 segundos de delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      setShowPaymentInfo(true);
    } catch (err) {
      setError(
        err instanceof Error 
          ? err.message 
          : 'Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar chave PIX:', err);
    }
  };

  const handleClose = () => {
    setShowPaymentInfo(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start md:items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-800 rounded-lg p-4 md:p-6 w-full max-w-md my-4 md:my-0 border border-red-600/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {plan ? plan.title : 'Depósito'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showPaymentInfo ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {allowCustomAmount && (
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                  Valor do Depósito
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">R$</span>
                  <input
                    type="number"
                    id="amount"
                    required
                    min={minAmount}
                    step="0.01"
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-red-500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Valor mínimo: R$ {minAmount.toFixed(2)}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="bg-zinc-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center text-gray-300 mb-2">
                <span>Valor {plan ? 'do Plano' : 'do Depósito'}</span>
                <span className="font-semibold">R$ {formData.amount.toFixed(2)}</span>
              </div>
              {plan && (
                <p className="text-sm text-gray-400">{plan.description}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando Pagamento PIX...
                </>
              ) : (
                'Gerar Pagamento'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Pague com PIX</h4>
              <div className="bg-zinc-700 rounded-lg p-4">
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-200">
                    <strong>ATENÇÃO:</strong> Para ativar {plan ? 'o plano' : 'seu depósito'} corretamente, você deve enviar o valor exato de{' '}
                    <span className="font-bold">{getPlanWarning() || `R$ ${formData.amount.toFixed(2)}`}</span>
                  </p>
                  {plan && (
                    <p className="text-xs text-yellow-200/80 mt-2">
                      O envio de qualquer outro valor resultará em falha na ativação do plano.
                    </p>
                  )}
                </div>
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-200">
                    <strong>IMPORTANTE:</strong> Ao fazer o pagamento via PIX, selecione a opção <span className="font-bold">"Chave Aleatória"</span> e cole a chave abaixo.
                  </p>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  1. Copie a chave PIX abaixo:
                </p>
                <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded-lg">
                  <div className="flex-1 font-mono text-sm text-gray-300 break-all text-left">
                    {PIX_KEY}
                  </div>
                  <button
                    onClick={handleCopyPix}
                    className={`flex-shrink-0 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  2. Abra o app do seu banco
                  <br />
                  3. Escolha pagar com PIX e selecione "Chave Aleatória"
                  <br />
                  4. Cole a chave e confirme o pagamento
                </p>
              </div>
            </div>

            {/* Aviso sobre verificação manual */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Instagram className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">Atenção</span>
              </div>
              <p className="text-sm text-gray-300">
                Caso o acesso não seja liberado automaticamente após o pagamento, envie o comprovante para nosso Instagram:
                <a
                  href="https://www.instagram.com/estatisticastlas?igsh=MXB6ejF6NzkwdmIwbw%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  @estatisticastlas
                </a>
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-zinc-700 text-white py-2 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}