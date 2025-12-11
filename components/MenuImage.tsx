import React, { useState, useEffect } from 'react';
import { generateDishImage, imageCache } from '../services/geminiService';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuImageProps {
  dishName: string;
  description: string;
  className?: string;
}

const MenuImage: React.FC<MenuImageProps> = ({ dishName, description, className = "" }) => {
  // Initialize from cache if available
  const [imageUrl, setImageUrl] = useState<string | null>(imageCache[dishName] || null);
  const [loading, setLoading] = useState(!imageCache[dishName]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchImage = async () => {
      // Re-check cache in case it was populated while component was mounting
      if (imageCache[dishName]) {
        setImageUrl(imageCache[dishName]);
        setLoading(false);
        return;
      }

      try {
        const base64Image = await generateDishImage(dishName, description);
        if (mounted) {
          if (base64Image) {
            setImageUrl(base64Image);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!imageUrl) {
        fetchImage();
    }

    return () => {
      mounted = false;
    };
  }, [dishName, description, imageUrl]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-stone-800/50 ${className}`}>
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
        <span className="text-xs text-amber-500/80 font-medium tracking-wider uppercase animate-pulse">Plating...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-stone-800 ${className}`}>
        <ImageIcon className="w-10 h-10 text-stone-700" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8 }}
      className={`relative overflow-hidden ${className}`}
    >
      <img 
        src={imageUrl} 
        alt={dishName}
        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000 ease-out"
      />
    </motion.div>
  );
};

export default MenuImage;