import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Filter, BarChart2, ArrowRight, MessageSquare, Mic, Phone, Bot, Brain, BarChart as ChartBar, Gamepad2, Lock, X, DollarSign } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { AuthModal } from './AuthModal';
import { ReferralModal } from './ReferralModal';
import { useAuthStore } from '../store/authStore';

interface PricingPlan {
  title: string;
  price: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

export function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const pricingPlans: PricingPlan[] = [
    {
      title: "Teste Rápido",
      price: 10,
      description: "24 horas liberadas",
      features: ["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real"]
    },
    {
      title: "10 Dias",
      price: 70,
      description: "10 dias de funções liberadas",
      features: ["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte prioritário"]
    },
    {
      title: "Plano Mensal",
      price: 120,
      description: "Um mês de funções liberadas",
      features: ["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte prioritário", "Análises detalhadas"],
      highlight: true
    },
    {
      title: "Plano Trimestral",
      price: 300,
      description: "3 meses de funções liberadas",
      features: ["Acesso a todas as roletas", "Filtros avançados", "Estatísticas em tempo real", "Suporte VIP", "Análises detalhadas", "Consultoria personalizada"]
    },
    {
      title: "Acesso Vitalício",
      price: 500,
      description: "Acesso vitalício a todas as funções",
      features: ["Acesso ilimitado a todas as funções", "Atualizações gratuitas", "Suporte VIP", "Análises exclusivas", "Consultoria personalizada", "Prioridade em novos recursos"]
    },
    {
      title: "ATLAS CHAT FULL - 10 Dias",
      price: 68,
      description: "10 dias de assistente IA especializado",
      features: [
        "Chat em tempo real com IA especializada",
        "Análises baseadas em grandes apostadores",
        "Reconhecimento de voz para consultas",
        "Chamadas em tempo real com assistente virtual",
        "Respostas instantâneas 24/7",
        "Dicas e estratégias profissionais",
        "Análise de padrões e tendências",
        "Suporte multilíngue",
        "Histórico de conversas salvo"
      ],
      highlight: true
    },
    {
      title: "ATLAS CHAT FULL - Mensal",
      price: 204,
      description: "1 mês de assistente IA especializado",
      features: [
        "Chat em tempo real com IA especializada",
        "Análises baseadas em grandes apostadores",
        "Reconhecimento de voz para consultas",
        "Chamadas em tempo real com assistente virtual",
        "Respostas instantâneas 24/7",
        "Dicas e estratégias profissionais",
        "Análise de padrões e tendências",
        "Suporte multilíngue",
        "Histórico de conversas salvo",
        "Relatórios semanais personalizados",
        "Acesso prioritário em horários de pico"
      ],
      highlight: true
    },
    {
      title: "ATLAS CHAT FULL - Trimestral",
      price: 612,
      description: "3 meses de assistente IA especializado",
      features: [
        "Chat em tempo real com IA especializada",
        "Análises baseadas em grandes apostadores",
        "Reconhecimento de voz para consultas",
        "Chamadas em tempo real com assistente virtual",
        "Respostas instantâneas 24/7",
        "Dicas e estratégias profissionais",
        "Análise de padrões e tendências",
        "Suporte multilíngue",
        "Histórico de conversas salvo",
        "Relatórios semanais personalizados",
        "Acesso prioritário em horários de pico",
        "Consultoria personalizada mensal",
        "Análises avançadas de probabilidade",
        "Desconto especial de fidelidade"
      ],
      highlight: true
    }
  ];

  const handlePlanSelection = (plan: PricingPlan) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleAffiliateClick = () => {
    setShowReferralModal(true);
  };

  const scrollToPlans = () => {
    const plansSection = document.getElementById('pricing-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900">
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

      {/* Hero Section */}
      <div 
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat h-screen"
        style={{
          backgroundImage: 'url(https://media.istockphoto.com/id/819400032/pt/foto/casino-roulette-banner.jpg?s=612x612&w=0&k=20&c=7mKy0tWRkpYAHcXyiUKI76ZiaqjYwrevtp2FcIflb3c=)',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 drop-shadow-lg">
              Análise Avançada de Roletas
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto drop-shadow-lg">
              Sistema profissional para análise de roletas em tempo real com estatísticas avançadas e filtros inteligentes.
            </p>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Acessar Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={scrollToPlans}
                  className="bg-zinc-800 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-zinc-700 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border border-red-600/20"
                >
                  Ver Planos
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleAffiliateClick}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  <DollarSign className="w-5 h-5" />
                  Seja Afiliado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div 
        className="relative py-16 overflow-hidden"
        style={{
          backgroundImage: 'url(https://www.betsson.com/wp-content/uploads/2023/03/21-Roleta-Como-funciona.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-zinc-900/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Recursos Exclusivos</h2>
            <p className="text-gray-300">Ferramentas poderosas para maximizar seus resultados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-800/80 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
              <Filter className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Filtros Avançados</h3>
              <p className="text-gray-300">Filtros por dúzias e regiões para análise detalhada dos resultados.</p>
            </div>

            <div className="bg-zinc-800/80 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
              <BarChart2 className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Estatísticas em Tempo Real</h3>
              <p className="text-gray-300">Acompanhe estatísticas detalhadas e números quentes/frios em tempo real.</p>
            </div>

            <div className="bg-zinc-800/80 backdrop-blur-sm p-6 rounded-lg border border-red-600/20">
              <Clock className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Atualização Instantânea</h3>
              <p className="text-gray-300">Resultados atualizados instantaneamente para todas as roletas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div 
        id="pricing-section"
        className="relative py-16 overflow-hidden"
        style={{
          backgroundImage: 'url(https://media.istockphoto.com/id/819400032/pt/foto/casino-roulette-banner.jpg?s=612x612&w=0&k=20&c=7mKy0tWRkpYAHcXyiUKI76ZiaqjYwrevtp2FcIflb3c=)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-75"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Planos e Preços</h2>
            <p className="text-gray-300">Escolha o plano ideal para suas necessidades</p>
          </div>

          {/* Regular Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-12">
            {pricingPlans.slice(0, 5).map((plan, index) => (
              <div
                key={index}
                className={`bg-zinc-800/90 backdrop-blur-sm rounded-lg p-6 border ${
                  plan.highlight
                    ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50'
                    : 'border-red-600/20'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  R$ {plan.price.toFixed(2)}
                </div>
                <p className="text-gray-300 mb-4">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanSelection(plan)}
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Começar Agora
                </button>
              </div>
            ))}
          </div>

          {/* ATLAS CHAT FULL Plans */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-2">
                <MessageSquare className="w-8 h-8 text-red-500" />
                ATLAS CHAT FULL
              </h2>
              <p className="text-gray-300">Assistente virtual especializado em análise de roletas</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.slice(5).map((plan, index) => (
                <div
                  key={index + 5}
                  className="bg-zinc-800/90 backdrop-blur-sm rounded-lg p-6 border border-red-500 ring-2 ring-red-500 ring-opacity-50"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{plan.title}</h3>
                  <div className="text-3xl font-bold text-white mb-4">
                    R$ {plan.price.toFixed(2)}
                  </div>
                  <p className="text-gray-300 mb-4">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePlanSelection(plan)}
                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Começar Agora
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />
    </div>
  );
}