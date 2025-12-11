import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DID_YOU_KNOW_FACTS } from '../constants';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onFinished: () => void;
  isReady: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinished, isReady }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    // Rotate facts every 10 seconds
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % DID_YOU_KNOW_FACTS.length);
    }, 10000);

    // Ensure screen stays up for at least 10 seconds
    const minTimer = setTimeout(() => {
      setMinTimePassed(true);
    }, 10000);

    return () => {
      clearInterval(factInterval);
      clearTimeout(minTimer);
    };
  }, []);

  useEffect(() => {
    if (isReady && minTimePassed) {
      setTimeout(onFinished, 500); // Smooth exit
    }
  }, [isReady, minTimePassed, onFinished]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center px-6 text-center"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-900/10 rounded-full blur-[150px] transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-stone-800/20 rounded-full blur-[100px] transform -translate-x-1/4 translate-y-1/4"></div>

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
        {/* Logo Mark */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-12 relative"
        >
          <div className="w-20 h-20 rounded-full border border-amber-500/20 flex items-center justify-center relative">
            <div className="absolute inset-0 border border-amber-500/10 rounded-full animate-ping"></div>
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
        </motion.div>

        {/* Fact Card */}
        <div className="h-32 flex items-center justify-center mb-12 w-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={factIndex}
               initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
               animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
               transition={{ duration: 0.5 }}
               className="space-y-4 max-w-md mx-auto"
             >
               <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600 block">Did You Know?</span>
               <p className="text-xl md:text-2xl font-serif text-stone-300 italic leading-relaxed">
                 "{DID_YOU_KNOW_FACTS[factIndex]}"
               </p>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Loading Indicator */}
        <div className="w-full max-w-xs flex flex-col items-center gap-3">
            <div className="w-full h-0.5 bg-stone-800 rounded-full overflow-hidden relative">
              <motion.div 
                className="h-full bg-amber-500/50 absolute left-0 top-0 w-1/3"
                animate={{ left: ["-30%", "130%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </div>
            
            <motion.div 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-[10px] text-stone-500 font-mono uppercase tracking-wider flex items-center gap-2"
            >
                {isReady ? (
                  <span className="text-green-500">Welcome</span>
                ) : (
                  <>
                    <span>Loading Menu</span>
                    <span className="animate-pulse">...</span>
                  </>
                )}
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;