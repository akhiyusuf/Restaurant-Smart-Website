import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Minimize2, CreditCard, ChevronDown, Headphones, Mic, MicOff, X } from 'lucide-react';
import { ChatMessage, MenuItem, CartItem } from '../types';
import { sendMessageToGemini, sendToolResponseToGemini, connectToLiveSession, float32ToPCM16, base64ToAudioBuffer } from '../services/geminiService';
import { MENU_ITEMS } from '../constants';
import { GenerateContentResponse } from '@google/genai';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  addToCart: (item: MenuItem, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  cart?: CartItem[];
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, onOpenCheckout, addToCart, removeFromCart, cart = [] }) => {
  // Text Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Good evening. I am Astra, your personal dining concierge. I can modify your order, recommend pairings, or process your checkout.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(0); // For visualization
  
  // Refs for Voice
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveClientRef = useRef<any>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // --- Text Chat Logic ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const executeToolCall = async (fc: any) => {
    let result = "failed";
    const args = fc.args as any;

    if (fc.name === 'addToOrder') {
        const item = MENU_ITEMS.find(i => i.id === args.itemId);
        const qty = args.quantity || 1;
        if (item) {
            addToCart(item, qty);
            result = `Added ${qty} ${item.name}(s) to cart.`;
        } else {
            result = "Item not found.";
        }
    } else if (fc.name === 'removeFromOrder') {
        removeFromCart(args.itemId);
        result = `Removed item ${args.itemId} from cart.`;
    }

    return {
        name: fc.name,
        response: { result: result },
        id: fc.id
    };
  };

  const handleResponse = async (response: GenerateContentResponse | null) => {
    if (!response) {
       setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the network right now.", timestamp: Date.now() }]);
       return;
    }

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const toolResponses = [];
      for (const fc of functionCalls) {
        const responseData = await executeToolCall(fc);
        toolResponses.push({ functionResponse: responseData });
      }
      
      if (toolResponses.length > 0) {
        const followUpResponse = await sendToolResponseToGemini(toolResponses);
        await handleResponse(followUpResponse);
      }
      return;
    }

    const textContent = response.text;
    if (textContent) {
      let text = textContent;
      let action: 'checkout' | undefined = undefined;
      
      if (text.includes('{{OPEN_CHECKOUT}}')) {
        text = text.replace('{{OPEN_CHECKOUT}}', '').trim();
        action = 'checkout';
      }

      if (text.trim() || action) {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: text.trim(), timestamp: Date.now(), action }
        ]);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    const response = await sendMessageToGemini(input, cart);
    await handleResponse(response);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  // --- Voice Mode Logic ---

  const stopVoiceSession = () => {
    if (liveClientRef.current) {
        liveClientRef.current.disconnect();
        liveClientRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    setIsVoiceMode(false);
    setIsConnectingVoice(false);
    setVoiceVolume(0);
  };

  const startVoiceSession = async () => {
    setIsVoiceMode(true);
    setIsConnectingVoice(true);

    try {
        // 1. Setup Audio Context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: 16000 }); // Input 16k
        audioContextRef.current = ctx;
        nextStartTimeRef.current = ctx.currentTime;

        // 2. Setup Mic
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = ctx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        // 3. Connect to Gemini Live
        const client = await connectToLiveSession({
            onOpen: () => {
                setIsConnectingVoice(false);
            },
            onAudioData: async (base64) => {
                // Decode and Play
                if (!audioContextRef.current) return;
                
                // Visualization trigger
                setVoiceVolume(Math.random() * 0.5 + 0.5); 
                setTimeout(() => setVoiceVolume(0.1), 200);

                const buffer = await base64ToAudioBuffer(base64, audioContextRef.current);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                
                const now = audioContextRef.current.currentTime;
                // Schedule next chunk
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
            },
            onToolCall: async (toolCall) => {
                const responses = [];
                for (const fc of toolCall.functionCalls) {
                     const resp = await executeToolCall(fc);
                     responses.push(resp);
                }
                liveClientRef.current?.sendToolResponse(responses);
            },
            onClose: () => {
                stopVoiceSession();
            }
        });

        if (!client) {
            throw new Error("Failed to connect");
        }
        liveClientRef.current = client;

        // 4. Setup Input Processor (Send Mic Data)
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
            if (!isMicOn) return;
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Simple Volume Visualization
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            setVoiceVolume(rms * 5); // Amplify for visual

            const b64 = float32ToPCM16(inputData);
            client.sendAudio(b64);
        };

        source.connect(processor);
        processor.connect(ctx.destination); // Required for script processor to run
        processorRef.current = processor;

    } catch (e) {
        console.error("Voice Error", e);
        stopVoiceSession();
    }
  };

  const toggleMic = () => {
     setIsMicOn(!isMicOn);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.4, type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] flex flex-col md:inset-auto md:bottom-6 md:right-6 md:w-full md:max-w-[380px] md:h-[550px] md:z-50"
        >
          {/* Container */}
          <div className="relative flex-1 bg-stone-950 md:bg-stone-900/95 backdrop-blur-xl md:border md:border-stone-700/50 md:rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col font-sans w-full h-full transition-all">
            
            {/* Header */}
            <div className="p-4 pt- safe-top md:pt-4 border-b border-stone-800 bg-stone-900 flex items-center justify-between shrink-0 relative z-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/50 ${isVoiceMode ? 'animate-pulse' : ''}`}>
                    <Sparkles className="w-4 h-4 text-stone-900" />
                  </div>
                  {isVoiceMode && <div className="absolute -inset-1 bg-amber-500/30 rounded-full animate-ping"></div>}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-100 tracking-wide">Astra</h3>
                  <p className="text-[10px] text-amber-500 uppercase tracking-widest font-medium">
                      {isVoiceMode ? (isConnectingVoice ? 'Connecting...' : 'Live Voice Session') : 'Lumina Intelligence'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                 {!isVoiceMode && (
                     <button onClick={startVoiceSession} className="p-2 hover:bg-stone-800 rounded-full transition-colors group" title="Start Voice Mode">
                        <Headphones className="w-4 h-4 text-stone-400 group-hover:text-amber-500" />
                     </button>
                 )}
                 <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full transition-colors group">
                    <span className="md:hidden"><ChevronDown className="w-6 h-6 text-stone-400 group-hover:text-white" /></span>
                    <span className="hidden md:block"><Minimize2 className="w-4 h-4 text-stone-400 group-hover:text-white" /></span>
                 </button>
              </div>
            </div>

            {/* Content Switcher */}
            {isVoiceMode ? (
                // --- Voice Interface ---
                <div className="flex-1 flex flex-col items-center justify-center relative bg-stone-950">
                    <div className="absolute inset-0 overflow-hidden">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-8">
                         {/* Visualizer Orb */}
                         <div className="relative w-32 h-32 flex items-center justify-center">
                            {/* Core */}
                            <motion.div 
                                animate={{ scale: 1 + voiceVolume }}
                                className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] z-20"
                            />
                            {/* Rings */}
                            <motion.div 
                                animate={{ scale: 1 + voiceVolume * 1.5, opacity: 0.5 - voiceVolume * 0.2 }}
                                className="absolute inset-0 border border-amber-500/50 rounded-full z-10"
                            />
                            <motion.div 
                                animate={{ scale: 1 + voiceVolume * 2, opacity: 0.3 - voiceVolume * 0.1 }}
                                className="absolute -inset-4 border border-amber-500/30 rounded-full z-0"
                            />
                         </div>
                         
                         <p className="text-stone-400 text-sm font-light tracking-wide animate-pulse">
                             {isConnectingVoice ? "Establishing secure link..." : "Listening..."}
                         </p>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                        <button 
                            onClick={toggleMic}
                            className={`p-4 rounded-full transition-all ${isMicOn ? 'bg-stone-800 text-stone-200 hover:bg-stone-700' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
                        >
                            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </button>
                        <button 
                            onClick={stopVoiceSession}
                            className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-900/30 transition-all hover:scale-105"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                // --- Text Interface ---
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-gradient-to-b from-stone-900 to-stone-950">
                    {messages.map((msg, idx) => (
                        <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                        {msg.text && (
                            <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} max-w-[90%]`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                msg.role === 'user' ? 'bg-stone-700' : 'bg-transparent border border-amber-500/30'
                            }`}>
                                {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-stone-300" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                            <div className={`p-3.5 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-stone-800 text-stone-100 rounded-2xl rounded-tr-sm' 
                                : 'bg-stone-900/50 border border-stone-800 text-stone-300 rounded-2xl rounded-tl-sm shadow-sm'
                            }`}>
                                {msg.text}
                            </div>
                            </div>
                        )}
                        {msg.action === 'checkout' && (
                            <motion.button
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={onOpenCheckout}
                            className={`
                                bg-amber-600 hover:bg-amber-500 text-white px-4 py-3 rounded-xl 
                                text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-900/20 
                                transition-all hover:scale-105 w-full justify-center
                                ${msg.text ? 'ml-10 max-w-[80%]' : 'ml-0 max-w-full'}
                            `}
                            >
                            <CreditCard className="w-4 h-4" />
                            Proceed to Checkout
                            </motion.button>
                        )}
                        </motion.div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-transparent border border-amber-500/30 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div className="bg-stone-900/50 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center border border-stone-800">
                            <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce delay-200"></span>
                        </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-stone-900 border-t border-stone-800 shrink-0 mb-safe-bottom">
                    <div className="relative">
                        <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Inquire about our menu..."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3.5 pl-4 pr-12 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-900/50 transition-all text-sm"
                        />
                        <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-500 rounded-lg disabled:opacity-50 disabled:hover:bg-stone-800 transition-colors"
                        >
                        <Send className="w-4 h-4" />
                        </button>
                    </div>
                    </div>
                </>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIChat;