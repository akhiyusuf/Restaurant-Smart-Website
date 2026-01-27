import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Code, Server, Zap, CheckCircle2, ExternalLink, Mail, Terminal } from 'lucide-react';

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperModal: React.FC<DeveloperModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Terminal className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-100">Developer Insights</h2>
                    <p className="text-xs text-stone-500 uppercase tracking-widest">Architectural Overview</p>
                </div>
              </div>
              <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
                {/* Intro */}
                <div className="mb-8">
                    <p className="text-stone-300 leading-relaxed font-light">
                        You are viewing a <strong className="text-amber-500 font-medium">high-fidelity concept application</strong> designed to showcase the intersection of modern web performance and generative AI. This project demonstrates how a restaurant can elevate its digital presence beyond simple menus.
                    </p>
                </div>

                {/* Tech Stack */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-stone-900/50 p-5 rounded-xl border border-stone-800">
                        <h3 className="flex items-center gap-2 text-stone-100 font-medium mb-3">
                            <Zap className="w-4 h-4 text-yellow-500" /> Frontend Engineering
                        </h3>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>React 19 & TypeScript</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>Tailwind CSS + Framer Motion</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>2.5D Tilt Interactions</li>
                        </ul>
                    </div>
                    <div className="bg-stone-900/50 p-5 rounded-xl border border-stone-800">
                        <h3 className="flex items-center gap-2 text-stone-100 font-medium mb-3">
                            <Server className="w-4 h-4 text-blue-500" /> AI Infrastructure
                        </h3>
                         <ul className="space-y-2 text-sm text-stone-400">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>Google Gemini 3 Flash</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>Real-time Function Calling</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-stone-600 rounded-full"></div>Dynamic Asset Generation</li>
                        </ul>
                    </div>
                </div>

                {/* Road to Production */}
                <div className="mb-8">
                    <h3 className="text-lg font-serif text-stone-100 mb-4">Production Readiness</h3>
                    <p className="text-sm text-stone-500 mb-4">The hard work is done. Transitioning this concept to a live commercial product requires only minimal integrations:</p>
                    
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-stone-200 text-sm font-medium">Payment Gateway</h4>
                                <p className="text-xs text-stone-500">Stripe/Square API keys just need to be plugged into the existing checkout logic.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-stone-200 text-sm font-medium">CMS Connection</h4>
                                <p className="text-xs text-stone-500">Menu data structure is standardized; simply point to your existing inventory system.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-stone-200 text-sm font-medium">Domain & Hosting</h4>
                                <p className="text-xs text-stone-500">Codebase is optimized for edge deployment (Vercel/Netlify) instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Contact */}
                <div className="bg-gradient-to-r from-amber-900/20 to-stone-900 border border-amber-900/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-stone-100 font-bold text-lg">Brother Yusuf</h4>
                        <p className="text-sm text-stone-400">(Built by broyusuf.xyz)</p>
                    </div>
                    <div className="flex gap-3">
                        <a href="https://broyusuf.xyz" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors border border-stone-700">
                            <ExternalLink className="w-3 h-3" /> Website
                        </a>
                         <a href="mailto:contact@broyusuf.xyz" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20">
                            <Mail className="w-3 h-3" /> Contact
                        </a>
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeveloperModal;