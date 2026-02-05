import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MenuGrid from './components/MenuGrid';
import AIChat from './components/AIChat';
import TiltCard from './components/TiltCard';
import MenuImage from './components/MenuImage';
import CheckoutModal from './components/CheckoutModal';
import LoadingScreen from './components/LoadingScreen';
import DeveloperModal from './components/DeveloperModal';
import { MenuItem, CartItem } from './types';
import { preloadApp } from './services/geminiService';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ChefHat, MessageSquare } from 'lucide-react';

function App() {
  const [isLoadingScreenVisible, setIsLoadingScreenVisible] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chatSuggestion, setChatSuggestion] = useState<string | undefined>(undefined);
  const { scrollY } = useScroll();

  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  // Preload App Resources (AI Connection + Hero Image)
  useEffect(() => {
    const init = async () => {
      const heroDish = "Signature Plating";
      const heroDesc = "A highly artistic, top-down view of a chef's special creation, modern gastronomy, edible flowers, negative space, dramatic lighting";
      
      // Start the preloader
      await preloadApp(heroDish, heroDesc);
      
      // Mark as ready to signal LoadingScreen
      setIsAppReady(true);
    };

    init();
  }, []);

  const addToCart = (item: MenuItem, qty: number = 1) => {
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...item, quantity: qty, instanceId: Math.random().toString(36).substr(2, 9) }];
    });
  };

  const removeFromCartByInstance = (instanceId: string) => {
    setCart(prev => prev.filter(item => item.instanceId !== instanceId));
  };

  const removeFromCartById = (itemId: string) => {
    setCart(prev => {
      const itemIndex = prev.findIndex(i => i.id === itemId);
      if (itemIndex > -1) {
        const newCart = [...prev];
        newCart.splice(itemIndex, 1);
        return newCart;
      }
      return prev;
    });
  };

  const updateQuantity = (instanceId: string, delta: number) => {
    setCart(prev => prev.map(item => {
       if (item.instanceId === instanceId) {
         const newQty = Math.max(1, item.quantity + delta);
         return { ...item, quantity: newQty };
       }
       return item;
    }));
  };

  const handleAskConcierge = (item: MenuItem) => {
    setChatSuggestion(`What would you pair with the ${item.name}?`);
    setIsChatOpen(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 selection:bg-amber-500/30 font-sans">
      <AnimatePresence>
        {isLoadingScreenVisible && (
          <LoadingScreen 
            isReady={isAppReady} 
            onFinished={() => setIsLoadingScreenVisible(false)} 
          />
        )}
      </AnimatePresence>

      <Navbar 
        onChatToggle={() => setIsChatOpen(!isChatOpen)} 
        onCartClick={() => setIsCheckoutOpen(true)}
        onDevClick={() => setIsDevModalOpen(true)}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
      />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-900/10 rounded-full blur-[150px] transform translate-x-1/3 -translate-y-1/3"></div>
         <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-stone-800/20 rounded-full blur-[100px] transform -translate-x-1/4 translate-y-1/4"></div>
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-10 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content */}
            <div className="space-y-10 relative z-10 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: isLoadingScreenVisible ? 0 : 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-amber-500 text-xs font-bold tracking-widest uppercase mb-8 shadow-lg">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Contemporary Fine Dining</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-[0.9] text-stone-100 mb-8">
                  Artistry <br />
                  <span className="italic text-stone-500 font-light">&</span> Innovation
                </h1>
                
                <p className="text-lg md:text-xl text-stone-400 max-w-xl leading-relaxed mx-auto lg:mx-0 font-light">
                  Lumina harmonizes classic culinary techniques with visionary design to create a dining experience that satisfies every sense.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <button 
                    onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-medium transition-all shadow-[0_10px_20px_rgba(217,119,6,0.2)] hover:shadow-[0_15px_25px_rgba(217,119,6,0.3)] flex items-center justify-center gap-3 group"
                  >
                    Explore Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="px-8 py-4 bg-transparent border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100 rounded-full font-medium transition-all flex items-center justify-center gap-3"
                  >
                    <ChefHat className="w-4 h-4" /> Ask Concierge
                  </button>
                </div>
              </motion.div>
            </div>

            {/* 2.5D Hero Graphic */}
            <div className="relative h-[600px] hidden lg:flex items-center justify-center perspective-1000">
              <TiltCard depth={20} className="relative z-20 w-full max-w-md aspect-[3/4]">
                <div className="relative w-full h-full bg-stone-900 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-stone-800 group">
                   
                   {/* Main Hero Image - Using cached version from preloader if available */}
                   <div className="absolute inset-0 z-10">
                      <MenuImage 
                        dishName="Signature Plating" 
                        description="A highly artistic, top-down view of a chef's special creation, modern gastronomy, edible flowers, negative space, dramatic lighting" 
                        className="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60"></div>
                   </div>

                   {/* Floating Elements */}
                   <motion.div 
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ delay: 1, duration: 0.8 }}
                     className="absolute bottom-8 left-8 right-8 z-20 bg-stone-900/80 backdrop-blur-md p-6 rounded-xl border border-stone-700/50 shadow-xl"
                   >
                      <div className="flex items-center gap-4 mb-3">
                         <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-stone-900 font-bold font-serif">A</div>
                         <div>
                            <p className="text-xs text-stone-400 uppercase tracking-widest">Chef's Selection</p>
                            <h3 className="text-lg font-bold text-white font-serif">Seasonal Tasting Menu</h3>
                         </div>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-500 fill-current" />)}
                      </div>
                   </motion.div>
                </div>
              </TiltCard>

              {/* Decorative Elements behind tilt card */}
              <div className="absolute -right-10 -top-10 w-64 h-64 border border-stone-800 rounded-full opacity-50 animate-pulse"></div>
              <div className="absolute -left-10 -bottom-10 w-48 h-48 border border-amber-900/30 rounded-full opacity-50"></div>
            </div>

          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 2, duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-stone-500"
          >
            <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-stone-500 to-transparent mx-auto mb-2"></div>
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          </motion.div>
        </motion.section>

        <MenuGrid addToCart={addToCart} onAskConcierge={handleAskConcierge} />

        {/* Footer */}
        <section id="about" className="py-24 bg-stone-900 border-t border-stone-800 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
            <h2 className="text-3xl font-serif font-bold text-stone-100 mb-8">The Philosophy</h2>
            <p className="text-stone-400 mb-12 text-lg font-light leading-relaxed">
              Food is memory. We use predictive algorithms not to replace the chef, but to enhance the human connection to flavor. 
              Our menu evolves daily based on seasonal availability and guests' collective palate preferences.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-xs text-stone-500 uppercase tracking-widest">
              <span className="hover:text-amber-500 cursor-pointer transition-colors">Reservations</span>
              <span className="hidden md:block">•</span>
              <span className="hover:text-amber-500 cursor-pointer transition-colors">Private Dining</span>
              <span className="hidden md:block">•</span>
              <span className="hover:text-amber-500 cursor-pointer transition-colors">Careers</span>
            </div>
            
            <div className="mt-16 flex flex-col items-center gap-3">
              <p className="text-stone-600 text-[10px]">
                © 2024 Lumina.
              </p>
            </div>
          </div>
        </section>
      </main>

      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        addToCart={addToCart}
        removeFromCart={removeFromCartById}
        cart={cart}
        suggestedMessage={chatSuggestion}
        onClearSuggestion={() => setChatSuggestion(undefined)}
      />

      {/* Floating Chat Button - Only visible when chat is closed */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-600 rounded-full shadow-lg shadow-amber-900/40 flex items-center justify-center text-stone-100 hover:bg-amber-500 transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        removeFromCart={removeFromCartByInstance}
        updateQuantity={updateQuantity}
        total={cartTotal}
      />

      <DeveloperModal 
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
      />
    </div>
  );
}

export default App;
