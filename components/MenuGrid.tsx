import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { Category, MenuItem } from '../types';
import TiltCard from './TiltCard';
import MenuImage from './MenuImage';
import { Plus, Sparkles, Leaf, WheatOff, WineOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuGridProps {
  addToCart: (item: MenuItem) => void;
  onAskConcierge: (item: MenuItem) => void;
}

const DIETARY_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'V', label: 'Vegetarian', icon: Leaf },
  { id: 'GF', label: 'Gluten Free', icon: WheatOff },
  { id: 'Zero-Proof', label: 'Zero Proof', icon: WineOff },
];

const MenuGrid: React.FC<MenuGridProps> = ({ addToCart, onAskConcierge }) => {
  const [activeCategory, setActiveCategory] = useState<Category>(Category.STARTER);
  const [activeDiet, setActiveDiet] = useState<string>('all');

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesDiet = activeDiet === 'all' || item.tags.includes(activeDiet);
    return matchesCategory && matchesDiet;
  });

  return (
    <section id="menu" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-stone-100">
          Our Collection
        </h2>
        <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full mb-6"></div>
        <p className="text-stone-400 max-w-2xl mx-auto text-lg font-light">
          A symphony of flavors, meticulously curated and visualized with precision.
        </p>
      </div>

      {/* Controls Container */}
      <div className="flex flex-col items-center gap-8 mb-16">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4">
          {Object.values(Category).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 tracking-wide uppercase ${
                activeCategory === cat
                  ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20'
                  : 'bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary Filters */}
        <div className="flex flex-wrap justify-center gap-2 bg-stone-900/50 p-1.5 rounded-xl border border-stone-800">
           {DIETARY_FILTERS.map((filter) => {
             const Icon = filter.icon;
             return (
               <button
                  key={filter.id}
                  onClick={() => setActiveDiet(filter.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                    activeDiet === filter.id
                      ? 'bg-stone-800 text-amber-500 shadow-sm'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
               >
                 {Icon && <Icon className="w-3 h-3" />}
                 {filter.label}
                 {activeDiet === filter.id && <motion.div layoutId="activeFilter" className="w-1.5 h-1.5 bg-amber-500 rounded-full ml-1" />}
               </button>
             )
           })}
        </div>

      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <TiltCard className="h-full" depth={10}>
                <div className="bg-stone-900/80 backdrop-blur-md border border-stone-800 rounded-xl overflow-hidden h-full flex flex-col group hover:border-amber-500/30 transition-colors shadow-xl shadow-black/20">
                  <div className="h-64 relative overflow-hidden">
                     <MenuImage dishName={item.name} description={item.description} className="w-full h-full transform group-hover:scale-105 transition-transform duration-700" />
                     <div className="absolute top-3 right-3 z-20 flex flex-wrap justify-end gap-1.5 max-w-[80%]">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-stone-950/80 backdrop-blur-md text-stone-300 px-2 py-1 rounded border border-stone-800 tracking-wider uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow relative">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-serif text-stone-100 group-hover:text-amber-400 transition-colors">{item.name}</h3>
                      <span className="text-lg font-medium text-amber-500">${item.price}</span>
                    </div>
                    
                    <p className="text-stone-400 text-sm mb-6 flex-grow leading-relaxed font-light">
                      {item.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-auto border-t border-stone-800 pt-5">
                      <button 
                         onClick={() => onAskConcierge(item)}
                         className="flex items-center justify-center gap-2 bg-stone-800/50 hover:bg-stone-800 text-stone-400 hover:text-amber-500 px-3 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider border border-stone-800 hover:border-amber-500/30"
                      >
                         <Sparkles className="w-3.5 h-3.5" /> Pairing
                      </button>
                      
                      <button 
                        onClick={() => addToCart(item)}
                        className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-white text-stone-900 px-3 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-3.5 h-3.5" /> Order
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredItems.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center text-stone-500 py-12">
             <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center mb-4 border border-stone-800">
                <Leaf className="w-6 h-6 opacity-20" />
             </div>
             <p>No items match your dietary preference in this category.</p>
           </div>
        )}
      </div>
    </section>
  );
};

export default MenuGrid;
