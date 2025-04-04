import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpToLine, History, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { PaymentModal } from './PaymentModal';

interface WalletData {
  id: string;
  balance: number;
  total_wagered: number;
  can_withdraw: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'loss';
  amount: number;
  created_at: string;
}

export function BetaWallet() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWallet();
      loadTransactions();
    }
  }, [user]);

  const loadWallet = async () => {
    if (!user) return;

    try {
      // First try to get existing wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('beta_game_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingWallet) {
        // No wallet found, create one
        const { data: newWallet, error: createError } = await supabase
          .from('beta_game_wallets')
          .insert([
            {
              user_id: user.id,
              balance: 0,
              total_wagered: 0,
              can_withdraw: false
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        setWallet(newWallet);
      } else {
        setWallet(existingWallet);
      }
    } catch (err) {
      console.error('Erro ao carregar carteira:', err);
      setError('Erro ao carregar dados da carteira');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!wallet?.id) return;

    try {
      const { data, error } = await supabase
        .from('beta_game_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet?.can_withdraw) {
      setError('Você precisa movimentar 100% do valor depositado para sacar');
      return;
    }
    setShowWithdrawModal(true);
  };

  const processWithdrawal = async () => {
    if (!user || !wallet || !withdrawAmount) return;

    try {
      setWithdrawing(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            amount: withdrawAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar saque');
      }

      // Reload wallet and transactions
      await loadWallet();
      await loadTransactions();
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (err) {
      console.error('Erro ao processar saque:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar saque');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-8 bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="h-6 bg-zinc-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-blue-600/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Sua Carteira Beta</h3>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-white">
          R$ {wallet?.balance.toFixed(2)}
        </div>
        <div className="text-sm text-gray-400">
          Total movimentado: R$ {wallet?.total_wagered.toFixed(2)}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowDeposit(true)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Depositar
        </button>
        <button
          onClick={handleWithdraw}
          disabled={!wallet?.can_withdraw}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpToLine className="w-4 h-4" />
          Sacar
        </button>
      </div>

      {showHistory && (
        <div className="mt-4 border-t border-zinc-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Últimas Transações
          </h4>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      tx.type === 'win' || tx.type === 'deposit'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <span className="text-gray-300">
                    {tx.type === 'deposit'
                      ? 'Depósito'
                      : tx.type === 'withdraw'
                      ? 'Saque'
                      : tx.type === 'win'
                      ? 'Vitória'
                      : 'Derrota'}
                  </span>
                </div>
                <span
                  className={`font-medium ${
                    tx.type === 'win' || tx.type === 'deposit'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'}
                  R$ {tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-green-600/20">
            <h3 className="text-xl font-bold text-white mb-4">Realizar Saque</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Valor do Saque
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">R$</span>
                <input
                  type="number"
                  min="1"
                  max={wallet?.balance}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg pl-8 pr-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Saldo disponível: R$ {wallet?.balance.toFixed(2)}
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 bg-zinc-700 text-white px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processWithdrawal}
                disabled={withdrawing || !withdrawAmount || withdrawAmount > (wallet?.balance || 0)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Saque'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        minAmount={5}
        allowCustomAmount={true}
      />
    </div>
  );
}