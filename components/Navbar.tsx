import React, { useState, useEffect } from 'react';
import { MessageSquare, ShoppingBag, Menu as MenuIcon, X, Code } from 'lucide-react';

interface NavbarProps {
  onChatToggle: () => void;
  onCartClick: () => void;
  onDevClick: () => void;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ onChatToggle, onCartClick, onDevClick, cartCount }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`backdrop-blur-xl border transition-all duration-500 rounded-full px-8 py-4 flex items-center justify-between shadow-2xl ${
          scrolled 
            ? 'bg-stone-900/90 border-stone-800 shadow-stone-950/50' 
            : 'bg-stone-900/40 border-white/5 shadow-transparent'
        }`}>
          
          <div className="flex items-center gap-3">
            <span className="text-2xl font-serif font-bold text-stone-100 tracking-tight">
              Lumina<span className="text-amber-500">.</span>
            </span>
            <button 
              onClick={onDevClick}
              className="ml-2 p-1.5 bg-amber-500/10 rounded-md border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-stone-900 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] group"
              title="Developer Info"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide uppercase"
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Menu
            </button>
            <button 
              className="text-stone-300 hover:text-amber-400 transition-colors text-sm font-medium tracking-wide uppercase"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Philosophy
            </button>
            
            <div className="h-4 w-px bg-stone-700"></div>

            <button 
              onClick={onChatToggle}
              className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors group"
            >
              <div className="p-1.5 bg-stone-800 rounded-full group-hover:bg-amber-500 group-hover:text-stone-900 transition-colors">
                 <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Concierge</span>
            </button>

            <button onClick={onCartClick} className="relative group">
              <div className="p-2 bg-stone-800/50 rounded-full hover:bg-stone-100 hover:text-stone-900 transition-colors text-stone-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full text-stone-900">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          <button className="md:hidden text-stone-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <MenuIcon />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-24 left-6 right-6 bg-stone-900 border border-stone-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl md:hidden">
            <button onClick={() => {document.getElementById('menu')?.scrollIntoView(); setMobileMenuOpen(false)}} className="text-stone-300 py-2 border-b border-stone-800">Menu</button>
            <button onClick={() => {document.getElementById('about')?.scrollIntoView(); setMobileMenuOpen(false)}} className="text-stone-300 py-2 border-b border-stone-800">Philosophy</button>
            <button onClick={() => {onChatToggle(); setMobileMenuOpen(false)}} className="text-amber-500 py-2 font-medium">Ask Concierge</button>
            <button onClick={() => {onCartClick(); setMobileMenuOpen(false)}} className="text-stone-300 py-2 font-medium border-t border-stone-800">My Cart ({cartCount})</button>
            <button onClick={() => {onDevClick(); setMobileMenuOpen(false)}} className="text-amber-500 py-2 text-xs flex items-center gap-2 font-bold"><Code className="w-3 h-3"/> Developer Info</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;