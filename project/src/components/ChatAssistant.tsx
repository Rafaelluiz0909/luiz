import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Mic, MicOff, VolumeX, Phone, PhoneOff, Video, VideoOff, AlertCircle } from 'lucide-react';
import { VideoChat } from './VideoChat';
import { Avatar3D } from './Avatar3D';
import { useAuthStore } from '../store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UsageLimits {
  textInteractions: number;
  audioInteractions: number;
  callMinutes: number;
}

export function ChatAssistant() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [usageToday, setUsageToday] = useState<UsageLimits>({
    textInteractions: 0,
    audioInteractions: 0,
    callMinutes: 0
  });
  const [showLimitsWarning, setShowLimitsWarning] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const restartTimeoutRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);

  const DAILY_LIMITS = {
    textInteractions: 120,
    audioInteractions: 120,
    callMinutes: 5
  };

  const isPlanEligible = () => {
    if (!user?.plan_type) return false;
    return ['Plano Trimestral', 'Acesso Vitalício'].includes(user.plan_type);
  };

  useEffect(() => {
    // Carregar uso diário do localStorage
    const today = new Date().toISOString().split('T')[0];
    const savedUsage = localStorage.getItem(`chatUsage_${today}_${user?.id}`);
    if (savedUsage) {
      setUsageToday(JSON.parse(savedUsage));
    } else {
      setUsageToday({
        textInteractions: 0,
        audioInteractions: 0,
        callMinutes: 0
      });
    }
  }, [user?.id]);

  useEffect(() => {
    // Salvar uso no localStorage
    if (user?.id) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`chatUsage_${today}_${user.id}`, JSON.stringify(usageToday));
    }
  }, [usageToday, user?.id]);

  const updateUsage = (type: keyof UsageLimits, value: number) => {
    setUsageToday(prev => ({
      ...prev,
      [type]: prev[type] + value
    }));
  };

  const checkLimits = (type: keyof UsageLimits): boolean => {
    if (!isPlanEligible()) {
      setError('Este recurso está disponível apenas nos planos Trimestral e Vitalício.');
      return false;
    }

    if (usageToday[type] >= DAILY_LIMITS[type]) {
      setError(`Você atingiu o limite diário de ${type === 'callMinutes' ? 'minutos de chamada' : 'interações'}. O limite será renovado à meia-noite.`);
      return false;
    }

    return true;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsSpeaking(false);
      if (isCallActive) {
        startListening();
      }
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive]);

  const startListening = () => {
    if (!checkLimits('audioInteractions')) {
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      setError("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    if (isListening) {
      console.log('Recognition already active, skipping start');
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (isCallActive) {
          restartTimeoutRef.current = window.setTimeout(() => {
            if (isCallActive && !isListening) {
              recognitionRef.current?.start();
            }
          }, 100);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError("Permissão de microfone negada. Por favor, permita o acesso ao microfone.");
        } else {
          setError("Erro no reconhecimento de voz. Tente novamente.");
        }
        setIsListening(false);
      };

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        await handleSubmit(new Event('submit') as any, transcript);
        updateUsage('audioInteractions', 1);
      };
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      if (error instanceof Error) {
        setError(`Erro ao iniciar reconhecimento: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const startCall = () => {
    if (!checkLimits('callMinutes')) {
      return;
    }

    setIsCallActive(true);
    startListening();

    // Iniciar timer para controlar duração da chamada
    let minutes = 0;
    callTimerRef.current = window.setInterval(() => {
      minutes++;
      if (minutes >= DAILY_LIMITS.callMinutes) {
        endCall();
        setError('Você atingiu o limite diário de minutos de chamada.');
      }
      updateUsage('callMinutes', 1);
    }, 60000); // Checar a cada minuto
  };

  const endCall = () => {
    setIsCallActive(false);
    stopListening();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
    setIsVideoEnabled(false);
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
      if (isCallActive) {
        startListening();
      }
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const playAudioResponse = async (text: string) => {
    if (!checkLimits('audioInteractions')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar áudio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsSpeaking(true);
        updateUsage('audioInteractions', 1);
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setError('Erro ao reproduzir resposta em áudio');
    }
  };

  const handleSubmit = async (e: React.FormEvent, voiceInput?: string) => {
    e.preventDefault();
    const messageToSend = voiceInput || inputMessage;
    
    if (!messageToSend.trim() || isLoading) return;

    if (!checkLimits('textInteractions')) {
      return;
    }

    const newMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao obter resposta');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);

      updateUsage('textInteractions', 1);

      if (isCallActive || voiceInput) {
        await playAudioResponse(data.response);
      }
    } catch (error) {
      console.error('Erro:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar sua mensagem');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const showUsageLimits = () => {
    setShowLimitsWarning(true);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!isPlanEligible()) {
            setError('Este recurso está disponível apenas nos planos Trimestral e Vitalício.');
            return;
          }
          setIsOpen(true);
        }}
        className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
      >
        <img 
          src="https://images.vexels.com/media/users/3/151205/isolated/preview/8857efb275fbf2435db40a222d05b1e6-icone-da-roda-de-roleta.png" 
          alt="Chat Icon"
          className="w-6 h-6"
        />
      </button>
    );
  }

  return (
    <>
      <div 
        ref={chatContainerRef}
        className="fixed bottom-0 right-0 w-full md:bottom-4 md:right-4 md:w-96 h-[600px] bg-zinc-800 flex flex-col z-50 md:rounded-lg shadow-xl border border-red-600/20"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-red-600/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="https://images.vexels.com/media/users/3/151205/isolated/preview/8857efb275fbf2435db40a222d05b1e6-icone-da-roda-de-roleta.png" 
              alt="Atlas Chat"
              className="w-6 h-6"
            />
            <h3 className="text-lg font-semibold text-white">Atlas Chat</h3>
            {isCallActive && (
              <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full">
                Chamada ativa
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={showUsageLimits}
              className="text-gray-400 hover:text-white transition-colors"
              title="Ver limites de uso"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
            {!isCallActive ? (
              <button
                onClick={startCall}
                className="text-gray-400 hover:text-green-500 transition-colors"
                title="Iniciar chamada"
              >
                <Phone className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={toggleVideo}
                  className={`text-gray-400 hover:text-white transition-colors ${
                    isVideoEnabled ? 'text-green-500' : ''
                  }`}
                  title={isVideoEnabled ? "Desativar vídeo" : "Ativar vídeo"}
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={endCall}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Encerrar chamada"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </>
            )}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="text-gray-400 hover:text-white transition-colors"
                title="Parar de falar"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Usage Warning Modal */}
        {showLimitsWarning && (
          <div className="absolute inset-0 bg-zinc-900/95 z-10 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-white">Limites de Uso Diário</h4>
              <button
                onClick={() => setShowLimitsWarning(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <h5 className="font-medium text-white mb-2">Texto</h5>
                <p className="text-gray-300">
                  • {usageToday.textInteractions}/{DAILY_LIMITS.textInteractions} interações
                  <br />
                  • Aproximadamente 1.000 palavras por dia
                  <br />
                  • Custo: R$ 1,68/dia
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg">
                <h5 className="font-medium text-white mb-2">Áudio</h5>
                <p className="text-gray-300">
                  • {usageToday.audioInteractions}/{DAILY_LIMITS.audioInteractions} interações
                  <br />
                  • Aproximadamente 1.000 palavras ou 600 caracteres
                  <br />
                  • Custo: R$ 1,50/dia
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg">
                <h5 className="font-medium text-white mb-2">Chamadas</h5>
                <p className="text-gray-300">
                  • {usageToday.callMinutes}/{DAILY_LIMITS.callMinutes} minutos
                  <br />
                  • 1 chamada de 5 minutos por dia
                  <br />
                  • Custo: R$ 0,22/dia
                </p>
              </div>

              <div className="text-gray-400 text-xs">
                * Os limites são renovados diariamente à meia-noite
              </div>
            </div>
          </div>
        )}

        {/* Avatar */}
        {isCallActive && !isVideoEnabled && (
          <div className="p-4 flex justify-center">
            <Avatar3D isSpeaking={isSpeaking} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <img 
                src="https://images.vexels.com/media/users/3/151205/isolated/preview/8857efb275fbf2435db40a222d05b1e6-icone-da-roda-de-roleta.png" 
                alt="Atlas Chat"
                className="w-12 h-12 mx-auto mb-3 opacity-50"
              />
              <p>Olá! Como posso ajudar você hoje?</p>
              <p className="text-sm mt-2">
                {isCallActive 
                  ? "Chamada ativa. Pode começar a falar!"
                  : "Você pode digitar, usar o microfone ou iniciar uma chamada."}
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-700 text-gray-200 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Digitando...
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-red-600/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isCallActive ? "Chamada ativa - Use sua voz" : "Digite sua mensagem..."}
              disabled={isCallActive}
              className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {!isCallActive && (
              <>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`${
                    isListening ? 'bg-red-700' : 'bg-zinc-700'
                  } text-white p-2 rounded-lg hover:bg-red-600 transition-colors`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Video Chat */}
      <VideoChat 
        isActive={isCallActive && isVideoEnabled} 
        onClose={() => setIsVideoEnabled(false)} 
        isSpeaking={isSpeaking}
      />
    </>
  );
}