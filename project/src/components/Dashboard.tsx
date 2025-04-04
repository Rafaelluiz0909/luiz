import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoletaBrasileira } from './RoletaBrasileira';
import { MegaRoulette } from './MegaRoulette';
import { Roleta3 } from './Roleta3';
import { RoletaAzure } from './RoletaAzure';
import { AuthModal } from './AuthModal';
import { ChatAssistant } from './ChatAssistant';
import { BankManagement, BankManagementModal } from './BankManagement';
import { useAuthStore } from '../store/authStore';
import { Lock, LogOut, ArrowLeft, AlertTriangle, X, Menu } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAlert, setShowAlert] = useState(true);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showBankManagement, setShowBankManagement] = useState(false);
  const { user, loading, initialized, checkAuth, signOut } = useAuthStore();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Verificar autenticação periodicamente
  useEffect(() => {
    checkAuth();
    
    // Verificar a cada minuto
    const authInterval = setInterval(() => {
      checkAuth();
    }, 60000);

    // Monitorar visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
        setIsReconnecting(true);
        // Tentar reconectar com delay crescente
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          setIsReconnecting(false);
        }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(authInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, reconnectAttempts]);

  const isPlanActive = () => {
    if (!user?.plan_type || !user?.plan_expires_at) return false;
    const expiresAt = new Date(user.plan_expires_at);
    const now = new Date();
    return expiresAt > now;
  };

  const getRemainingTime = () => {
    if (!user?.plan_expires_at) return null;
    const expiresAt = new Date(user.plan_expires_at);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `;
    timeString += `${minutes}m`;
    
    return timeString;
  };

  const getFirstName = () => {
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  };

  const handleViewPlans = () => {
    navigate('/');
    setTimeout(() => {
      const plansSection = document.getElementById('pricing-section');
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      {/* Vídeo invisível para manter conexão */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-[1px] h-[1px] opacity-0 absolute pointer-events-none"
      >
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
      </video>

      {/* Side Menu */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-zinc-800 transform transition-transform duration-300 ease-in-out z-30 border-r border-red-600/20 ${
          showSideMenu ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
          </div>
          <BankManagement onOpen={() => setShowBankManagement(true)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-zinc-800 border-b border-red-600/20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setShowSideMenu(!showSideMenu)}
              className="text-gray-400 hover:text-white md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">
                      Olá, {getFirstName()}
                    </span>
                    {user.plan_type && (
                      <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        isPlanActive() ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'
                      }`}>
                        {isPlanActive() ? (
                          <span className="whitespace-nowrap">
                            {getRemainingTime()} restantes
                          </span>
                        ) : 'Plano Expirado'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 text-white hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Criar Conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {/* Alert Message */}
          {showAlert && isPlanActive() && (
            <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 relative">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1 text-gray-300">
                  O nosso sistema utiliza API de mesas online. Para garantir que elas não parem, você não pode fechar o navegador em que está utilizando, independentemente de qual seja.
                  <br />
                  Você pode navegar entre abas, mas se fechar o navegador, as extensões irão desconectar.
                </div>
                <button
                  onClick={() => setShowAlert(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {!isPlanActive() && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-semibold">Funcionalidades Bloqueadas</span>
              </div>
              <p className="text-gray-300 mb-4">
                Para acessar todas as funcionalidades, escolha um plano que melhor se adapte às suas necessidades.
              </p>
              <button
                onClick={handleViewPlans}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ver Planos
              </button>
            </div>
          )}

          {isReconnecting && (
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-blue-400">Reconectando extensões...</span>
              </div>
            </div>
          )}

          <div className={`space-y-6 ${!isPlanActive() ? 'opacity-50 pointer-events-none' : ''}`}>
            <RoletaBrasileira key={`roleta-brasileira-${reconnectAttempts}`} />
            <MegaRoulette key={`mega-roulette-${reconnectAttempts}`} />
            <Roleta3 key={`roleta3-${reconnectAttempts}`} />
            <RoletaAzure key={`roleta-azure-${reconnectAttempts}`} />
          </div>
        </div>

        {isPlanActive() && <ChatAssistant />}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
        />

        <BankManagementModal 
          isOpen={showBankManagement} 
          onClose={() => setShowBankManagement(false)} 
        />

        {/* Overlay for mobile side menu */}
        {showSideMenu && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setShowSideMenu(false)}
          />
        )}
      </div>
    </div>
  );
}