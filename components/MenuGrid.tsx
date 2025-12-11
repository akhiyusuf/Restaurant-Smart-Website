import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { Category, MenuItem } from '../types';
import TiltCard from './TiltCard';
import MenuImage from './MenuImage';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuGridProps {
  addToCart: (item: MenuItem) => void;
}

const MenuGrid: React.FC<MenuGridProps> = ({ addToCart }) => {
  const [activeCategory, setActiveCategory] = useState<Category>(Category.STARTER);

  const filteredItems = MENU_ITEMS.filter(item => item.category === activeCategory);

  return (
    <section id="menu" className="py-24 px-6 max-w-7xl mx-auto relative z-10">
      <div className="mb-16 text-center">
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-stone-100">
          Our Collection
        </h2>
        <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full mb-6"></div>
        <p className="text-stone-400 max-w-2xl mx-auto text-lg font-light">
          A symphony of flavors, meticulously curated and visualized with precision.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-6 mb-16">
        {Object.values(Category).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 tracking-wide uppercase ${
              activeCategory === cat
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20'
                : 'bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-200 border border-stone-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <div className="h-64 relative">
                     <MenuImage dishName={item.name} description={item.description} className="w-full h-full" />
                     <div className="absolute top-3 right-3 z-20 flex gap-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-stone-950/80 backdrop-blur-md text-stone-200 px-2.5 py-1 rounded-md border border-stone-800 tracking-wider uppercase">
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
                    
                    <p className="text-stone-400 text-sm mb-8 flex-grow leading-relaxed font-light">
                      {item.description}
                    </p>

                    <div className="flex justify-between items-center mt-auto border-t border-stone-800 pt-4">
                      <span className="text-xs text-stone-500 font-medium">{item.calories} KCAL</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-2 bg-stone-800 hover:bg-stone-100 hover:text-stone-900 text-stone-300 px-5 py-2 rounded-lg transition-all text-sm font-medium tracking-wide group/btn"
                      >
                        <Plus className="w-4 h-4 transition-transform group-hover/btn:rotate-90" /> Add to Order
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default MenuGrid;