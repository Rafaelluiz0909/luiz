import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, XCircle, X, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface DayResult {
  day: number;
  result: 'pending' | 'win' | 'loss';
  balance: number;
}

interface BankManagementProps {
  onOpen: () => void;
}

export function BankManagement({ onOpen }: BankManagementProps) {
  const { user } = useAuthStore();

  const isPlanActive = () => {
    if (!user?.plan_type || !user?.plan_expires_at) return false;
    const expiresAt = new Date(user.plan_expires_at);
    const now = new Date();
    return expiresAt > now;
  };

  return (
    <button
      onClick={() => isPlanActive() ? onOpen() : null}
      className={`w-full text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
        isPlanActive() ? 'bg-purple-600 hover:bg-purple-700' : 'bg-zinc-700 cursor-not-allowed'
      }`}
      title={isPlanActive() ? 'Abrir Gestão' : 'Disponível apenas para assinantes'}
    >
      {isPlanActive() ? (
        <Calculator className="w-5 h-5" />
      ) : (
        <Lock className="w-5 h-5" />
      )}
      Gestão de Banca
    </button>
  );
}

interface BankManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BankManagementModal({ isOpen, onClose }: BankManagementModalProps) {
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [stopWinPercentage, setStopWinPercentage] = useState<number>(0);
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(0);
  const [days, setDays] = useState<number>(7);
  const [dayResults, setDayResults] = useState<DayResult[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (hasStarted) {
      const newDayResults = Array.from({ length: days }, (_, index) => ({
        day: index + 1,
        result: 'pending' as const,
        balance: initialBalance
      }));
      setDayResults(newDayResults);
      setCurrentBalance(initialBalance);
    }
  }, [hasStarted, days, initialBalance]);

  const handleStart = () => {
    if (initialBalance <= 0 || stopWinPercentage <= 0 || stopLossPercentage <= 0 || days <= 0) {
      return;
    }
    setHasStarted(true);
  };

  const handleDayResult = (day: number, result: 'win' | 'loss') => {
    const dayIndex = day - 1;
    const updatedResults = [...dayResults];
    
    // Calculate balance change
    const changePercentage = result === 'win' ? 0.1 : -0.1; // 10% win/loss
    const balanceChange = currentBalance * changePercentage;
    const newBalance = currentBalance + balanceChange;

    // Update day result
    updatedResults[dayIndex] = {
      ...updatedResults[dayIndex],
      result,
      balance: newBalance
    };

    setDayResults(updatedResults);
    setCurrentBalance(newBalance);

    // Check stop conditions
    const totalChange = ((newBalance - initialBalance) / initialBalance) * 100;
    if (totalChange >= stopWinPercentage || totalChange <= -stopLossPercentage) {
      // Highlight that stop condition was reached
      alert(`Meta ${totalChange >= stopWinPercentage ? 'de ganho' : 'de perda'} atingida!`);
    }
  };

  const resetManagement = () => {
    setHasStarted(false);
    setDayResults([]);
    setCurrentBalance(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start md:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-zinc-800 w-full min-h-screen md:min-h-0 md:w-auto md:max-w-md md:rounded-lg p-4 md:p-6 m-0 md:m-4">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-800 pt-2 pb-4 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">Gestão de Banca</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!hasStarted ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Valor Inicial da Banca (R$)
              </label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Stop Win (%)
              </label>
              <input
                type="number"
                value={stopWinPercentage}
                onChange={(e) => setStopWinPercentage(Number(e.target.value))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Stop Loss (%)
              </label>
              <input
                type="number"
                value={stopLossPercentage}
                onChange={(e) => setStopLossPercentage(Number(e.target.value))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Quantidade de Dias
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                min="1"
                max="30"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={initialBalance <= 0 || stopWinPercentage <= 0 || stopLossPercentage <= 0 || days <= 0}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar Gestão
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-zinc-900 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Saldo Atual:</span>
                <span className={`text-xl font-bold ${
                  currentBalance >= initialBalance ? 'text-green-500' : 'text-red-500'
                }`}>
                  R$ {currentBalance.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Variação: {((currentBalance - initialBalance) / initialBalance * 100).toFixed(2)}%
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {dayResults.map((day) => (
                <div
                  key={day.day}
                  className="bg-zinc-900 p-3 rounded-lg text-center"
                >
                  <div className="text-sm text-gray-400 mb-2">Dia {day.day}</div>
                  {day.result === 'pending' ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDayResult(day.day, 'win')}
                        className="p-2 rounded-lg bg-green-900/20 hover:bg-green-900/40 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </button>
                      <button
                        onClick={() => handleDayResult(day.day, 'loss')}
                        className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 transition-colors"
                      >
                        <XCircle className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className={`text-2xl ${
                      day.result === 'win' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {day.result === 'win' ? '✓' : '✗'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 sticky bottom-0 bg-zinc-800 pt-4 pb-2">
              <button
                onClick={resetManagement}
                className="flex-1 bg-zinc-700 text-white py-3 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Reiniciar
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}