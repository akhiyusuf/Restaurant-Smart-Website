import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, Truck, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { CartItem, CheckoutStep } from '../types';
import TiltCard from './TiltCard';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (instanceId: string) => void;
  updateQuantity: (instanceId: string, delta: number) => void;
  total: number;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, onClose, cart, removeFromCart, updateQuantity, total 
}) => {
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.CART);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', card: '', expiry: '', cvc: '' });
  const [passcode, setPasscode] = useState('');

  // Reset step when opening
  useEffect(() => {
    if (isOpen) setStep(CheckoutStep.CART);
  }, [isOpen]);

  const generatePasscode = () => {
    const code = 'LUM-' + Math.floor(1000 + Math.random() * 9000);
    setPasscode(code);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      generatePasscode();
      setStep(CheckoutStep.TRACKING);
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case CheckoutStep.CART:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-stone-100">Your Selection</h2>
              <span className="text-amber-500 font-medium">{cart.length} Items</span>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.instanceId} className="flex justify-between items-center bg-stone-900/50 p-4 rounded-xl border border-stone-800">
                    <div>
                      <h4 className="font-medium text-stone-200">{item.name}</h4>
                      <p className="text-sm text-stone-500">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-stone-800 rounded-lg">
                        <button onClick={() => updateQuantity(item.instanceId, -1)} className="p-2 hover:text-amber-500 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.instanceId, 1)} className="p-2 hover:text-amber-500 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.instanceId)} className="p-2 text-stone-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
               <div className="pt-6 border-t border-stone-800">
                 <div className="flex justify-between items-end mb-6">
                   <span className="text-stone-400">Total</span>
                   <span className="text-3xl font-serif text-amber-500">${total}</span>
                 </div>
                 <button 
                  onClick={() => setStep(CheckoutStep.DETAILS)}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2"
                 >
                   Proceed to Checkout <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
            )}
          </div>
        );

      case CheckoutStep.DETAILS:
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-serif font-bold text-stone-100">Delivery Details</h2>
             <div className="space-y-4">
               <div>
                 <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Full Name</label>
                 <input 
                    type="text" 
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-200 focus:border-amber-500 outline-none"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Delivery Address</label>
                 <div className="relative">
                   <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-stone-500" />
                   <input 
                      type="text" 
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 pl-10 text-stone-200 focus:border-amber-500 outline-none"
                      placeholder="Street address, Apt, Suite"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                 </div>
               </div>
             </div>
             <button 
                onClick={() => setStep(CheckoutStep.PAYMENT)}
                disabled={!formData.name || !formData.address}
                className="w-full py-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-xl font-bold tracking-wide transition-all mt-4"
              >
                Continue to Payment
             </button>
             <button onClick={() => setStep(CheckoutStep.CART)} className="w-full text-sm text-stone-500 hover:text-stone-300 py-2">Back</button>
          </div>
        );

      case CheckoutStep.PAYMENT:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-stone-100">Payment</h2>
            
            <TiltCard depth={5} className="mb-6">
              <div className="bg-gradient-to-br from-stone-800 to-stone-900 p-6 rounded-xl border border-stone-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div className="w-12 h-8 bg-amber-500/20 rounded border border-amber-500/30 flex items-center justify-center">
                    <div className="w-8 h-4 border border-amber-500/40 rounded-sm"></div>
                  </div>
                  <span className="font-serif italic text-stone-500">Lumina Card</span>
                </div>
                <div className="space-y-4">
                  <div className="text-xl font-mono tracking-widest text-stone-300">
                    {formData.card || '0000 0000 0000 0000'}
                  </div>
                  <div className="flex justify-between">
                    <div className="text-xs text-stone-500 uppercase">Card Holder<br/><span className="text-stone-300 font-mono text-sm">{formData.name || 'YOUR NAME'}</span></div>
                    <div className="text-xs text-stone-500 uppercase text-right">Expires<br/><span className="text-stone-300 font-mono text-sm">{formData.expiry || 'MM/YY'}</span></div>
                  </div>
                </div>
              </div>
            </TiltCard>

            <div className="space-y-4">
               <input 
                  type="text" 
                  maxLength={19}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-200 focus:border-amber-500 outline-none font-mono"
                  placeholder="Card Number"
                  value={formData.card}
                  onChange={e => setFormData({...formData, card: e.target.value})}
               />
               <div className="grid grid-cols-2 gap-4">
                 <input 
                    type="text" 
                    maxLength={5}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-200 focus:border-amber-500 outline-none font-mono"
                    placeholder="MM/YY"
                    value={formData.expiry}
                    onChange={e => setFormData({...formData, expiry: e.target.value})}
                 />
                 <input 
                    type="text" 
                    maxLength={3}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-stone-200 focus:border-amber-500 outline-none font-mono"
                    placeholder="CVC"
                    value={formData.cvc}
                    onChange={e => setFormData({...formData, cvc: e.target.value})}
                 />
               </div>
            </div>

            <button 
                onClick={handleProcessPayment}
                disabled={isProcessing}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing Authorization...
                  </span>
                ) : (
                  <>Pay ${total}</>
                )}
             </button>
             <button onClick={() => setStep(CheckoutStep.DETAILS)} disabled={isProcessing} className="w-full text-sm text-stone-500 hover:text-stone-300 py-2">Back</button>
          </div>
        );

      case CheckoutStep.TRACKING:
        return (
          <div className="text-center space-y-6">
             <div className="bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 relative h-48 flex items-center justify-center">
                {/* Radar UI */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-stone-950 to-stone-950"></div>
                
                {/* Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.1]"></div>

                {/* Concentric Circles */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border border-amber-500/10 rounded-full animate-ping"></div>
                    <div className="absolute w-32 h-32 border border-amber-500/20 rounded-full"></div>
                    <div className="absolute w-16 h-16 border border-amber-500/30 rounded-full bg-amber-500/5"></div>
                </div>

                {/* Moving Drone Dot */}
                <div className="absolute w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-[spin_4s_linear_infinite_reverse] top-1/2 left-1/2 ml-10 -mt-10"></div>
                
                {/* Scan Line */}
                <div className="absolute w-1/2 h-1 bg-gradient-to-r from-transparent to-amber-500/50 top-1/2 left-1/2 origin-left animate-[spin_3s_linear_infinite]"></div>
             
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-mono text-stone-400">DRONE_LINK: ACTIVE</span>
                </div>
             </div>
             
             <div className="space-y-1">
               <h2 className="text-2xl font-serif font-bold text-white">Incoming Delivery</h2>
               <p className="text-stone-400 text-sm">Autonomous Drone #482 en route</p>
             </div>

            {/* Passcode Card */}
            <div className="bg-stone-900/80 p-5 rounded-xl border border-dashed border-amber-900/50 relative">
               <div className="flex items-center justify-center gap-2 mb-2">
                 <ShieldCheck className="w-4 h-4 text-amber-500" />
                 <span className="text-xs uppercase tracking-widest text-stone-500">Secure Handover Code</span>
               </div>
               <div className="text-4xl font-mono font-bold text-stone-200 tracking-wider">
                 {passcode}
               </div>
               <div className="text-[10px] text-stone-500 mt-2">
                 Provide this code to the agent to unlock your meal container.
               </div>
            </div>

             <div className="text-left space-y-3 px-2">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-stone-300 text-sm">Order Confirmed & Prepared</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-stone-300 text-sm">Out for Delivery (ETA: 12m)</span>
                </div>
             </div>

             <button 
                onClick={onClose}
                className="text-stone-500 hover:text-white text-sm transition-colors mt-4"
              >
                Close Window
              </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/50">
               <div className="flex items-center gap-2">
                 <Lock className="w-4 h-4 text-amber-500" />
                 <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Lumina Secure Checkout</span>
               </div>
               <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
               <AnimatePresence mode="wait">
                 <motion.div
                    key={step}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                 >
                    {renderStep()}
                 </motion.div>
               </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;