import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Minimize2, CreditCard, ChevronDown } from 'lucide-react';
import { ChatMessage, MenuItem, CartItem } from '../types';
import { sendMessageToGemini, sendToolResponseToGemini } from '../services/geminiService';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Good evening. I am Astra, your personal dining concierge. I can modify your order, recommend pairings, or process your checkout.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleResponse = async (response: GenerateContentResponse | null) => {
    if (!response) {
       setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the network right now. Please check your connection or try again in a moment.", timestamp: Date.now() }]);
       return;
    }

    // 1. Handle Tool Calls
    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const toolResponses = [];

      for (const fc of functionCalls) {
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

        toolResponses.push({
          functionResponse: {
            name: fc.name,
            response: { result: result },
            id: fc.id
          }
        });
      }
      
      // Send tool results back to AI to get the final text response
      if (toolResponses.length > 0) {
        const followUpResponse = await sendToolResponseToGemini(toolResponses);
        await handleResponse(followUpResponse);
      }
      return;
    }

    // 2. Handle Text Response
    const textContent = response.text;
    
    if (textContent) {
      let text = textContent;
      let action: 'checkout' | undefined = undefined;
      
      // Check for checkout token
      if (text.includes('{{OPEN_CHECKOUT}}')) {
        text = text.replace('{{OPEN_CHECKOUT}}', '').trim();
        action = 'checkout';
      }

      // Only add message if there is actual text or an action
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

    // Pass current cart state to AI
    const response = await sendMessageToGemini(input, cart);
    await handleResponse(response);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
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
          {/* Container - Full screen on mobile, Floating card on Desktop */}
          <div className="relative flex-1 bg-stone-950 md:bg-stone-900/95 backdrop-blur-xl md:border md:border-stone-700/50 md:rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col font-sans w-full h-full">
            
            {/* Header */}
            <div className="p-4 pt- safe-top md:pt-4 border-b border-stone-800 bg-stone-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/50">
                    <Sparkles className="w-4 h-4 text-stone-900" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-stone-900"></div>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-100 tracking-wide">Astra</h3>
                  <p className="text-[10px] text-amber-500 uppercase tracking-widest font-medium">Lumina Intelligence</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full transition-colors group">
                  <span className="md:hidden"><ChevronDown className="w-6 h-6 text-stone-400 group-hover:text-white" /></span>
                  <span className="hidden md:block"><Minimize2 className="w-4 h-4 text-stone-400 group-hover:text-white" /></span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-gradient-to-b from-stone-900 to-stone-950">
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Message Bubble */}
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

                  {/* Action Buttons */}
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

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIChat;