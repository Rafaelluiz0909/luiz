import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';

interface PvpAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PvpAccessModal({ isOpen, onClose }: PvpAccessModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('Usuário não autenticado');
      if (!name.trim()) throw new Error('Nome é obrigatório');

      const { error: requestError } = await supabase
        .from('pvp_access_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          name: name.trim()
        });

      if (requestError) throw requestError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erro ao solicitar acesso:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Erro ao processar sua solicitação. Por favor, tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-red-600/20">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Solicitar Acesso PVP</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center">
            <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded mb-4">
              Solicitação enviada com sucesso! Aguarde a aprovação.
            </div>
            <p className="text-gray-300 text-sm">
              Você será notificado quando sua solicitação for aprovada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="bg-zinc-700/50 rounded-lg p-4 text-sm text-gray-300">
              <p>Importante:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Sua solicitação será analisada em até 24 horas</li>
                <li>Mantenha seu e-mail atualizado para receber a resposta</li>
                <li>Após aprovação, você terá acesso imediato aos jogos PVP</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Enviar Solicitação'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}