"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Star, Flame, X, ChevronLeft, ChevronRight, Leaf, ShoppingBag, Loader2 } from 'lucide-react';
import type { Dish } from '../components/DishCard';

// Balaji Santosh Dhaba restaurant page URLs on delivery platforms
const SWIGGY_URL = 'https://www.swiggy.com/search?query=Balaji+Santosh+Family+Dhaba+Moinabad';
const ZOMATO_URL = 'https://www.zomato.com/hyderabad/restaurants?q=Balaji+Santosh+Family+Dhaba';

// ─── Order Platform Modal ──────────────────────────────────────────────────────
interface OrderModalProps {
  dishName: string;
  onClose: () => void;
}
const OrderModal: React.FC<OrderModalProps> = ({ dishName, onClose }) => {
  const swiggyItemUrl = `https://www.swiggy.com/search?query=${encodeURIComponent('Balaji Chilkur Family Dhaba ' + dishName)}`;
  const whatsappUrl = `https://wa.me/919849498681?text=${encodeURIComponent(`Hello, I would like to order "${dishName}" from Balaji Chilkur Family Dhaba.`)}`;
  const [showZomatoAlert, setShowZomatoAlert] = useState(false);

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-8">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-[#F6EFE3] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-brand-dark/10 hover:bg-brand-dark/20 text-brand-dark rounded-full p-2 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header strip */}
        <div className="bg-brand-dark px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={30} className="text-brand-gold" />
          </div>
          <h3 className="font-display text-2xl font-extrabold text-[#F6EFE3]">Order Online</h3>
          <p className="text-sm text-[#F6EFE3]/60 font-sans mt-1">
            Choose your platform to order&nbsp;
            <span className="text-brand-gold font-semibold">{dishName}</span>
          </p>
        </div>

        {/* Platform buttons */}
        <div className="p-6 space-y-4">
          {/* Swiggy + Zomato — side by side on desktop */}
          <div className="grid grid-cols-2 gap-4">
            {/* Swiggy */}
            <a
              href={swiggyItemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 bg-[#FC8019] hover:bg-[#e8710f] text-white px-4 py-6 rounded-2xl font-bold transition-all duration-250 hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-orange-300/30"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                <span className="text-[#FC8019] font-extrabold text-2xl leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>S</span>
              </div>
              <div className="text-center">
                <div className="font-extrabold text-lg tracking-wide">Swiggy</div>
                <div className="text-xs opacity-80 font-normal mt-0.5">Fast delivery · Live tracking</div>
              </div>
              <span className="text-white/70 text-sm group-hover:translate-x-1 transition-transform">Order Now →</span>
            </a>

            {/* Zomato */}
            <button
              onClick={() => setShowZomatoAlert(true)}
              className="group flex flex-col items-center gap-3 bg-[#E23744]/45 hover:bg-[#E23744]/55 text-[#2B1B12] border border-brand-dark/10 px-4 py-6 rounded-2xl font-bold transition-all duration-250 hover:scale-[1.03] active:scale-[0.97] shadow-sm cursor-pointer"
            >
              <div className="w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                <span className="text-[#E23744] font-extrabold text-2xl leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>Z</span>
              </div>
              <div className="text-center">
                <div className="font-extrabold text-lg tracking-wide text-brand-dark/80">Zomato</div>
                <div className="text-[10px] text-brand-dark/60 font-semibold mt-0.5">Not Active Online</div>
              </div>
              <span className="text-brand-dark/50 text-xs mt-1">Tap for Info →</span>
            </button>
          </div>

          {/* Zomato warning alert box */}
          <AnimatePresence>
            {showZomatoAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-2xl text-left"
              >
                <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <span>⚠️</span> Zomato Delivery Offline
                </div>
                <p className="text-xs text-brand-dark/85 font-sans mt-2 leading-relaxed">
                  Balaji Santosh Family Dhaba is currently not active on Zomato for delivery at this location. Please use the <strong>Swiggy</strong> option above or place a direct order via <strong>WhatsApp</strong> below!
                </p>
                <button
                  onClick={() => setShowZomatoAlert(false)}
                  className="mt-3 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:underline"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp — full width */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 bg-[#25D366] hover:bg-[#1eb85a] text-white px-6 py-4 rounded-2xl font-bold transition-all duration-250 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-300/30 w-full"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <span className="text-[#25D366] font-extrabold text-xl">💬</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-extrabold text-base">WhatsApp</div>
              <div className="text-xs opacity-80 font-normal">Call or chat to place order directly</div>
            </div>
            <span className="opacity-70 text-sm group-hover:translate-x-1 transition-transform shrink-0">→</span>
          </a>

          <p className="text-center text-[10px] text-brand-dark/40 font-sans pt-1">
            Balaji Chilkur Family Dhaba · Moinabad · +91 98494 98681
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

// ─── OrderTrigger ────────────────────────────────────────────────────────────────
const OrderTrigger: React.FC<{ dishName: string; isOutOfStock?: boolean }> = ({ dishName, isOutOfStock }) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const btnStyle: React.CSSProperties = {
    backgroundColor: isOutOfStock ? '#cbd5e1' : pressed ? '#15803d' : hovered ? '#16a34a' : '#C1440E',
    borderColor: isOutOfStock ? '#94a3b8' : pressed ? '#166534' : hovered ? '#15803d' : 'rgba(193,68,14,0.5)',
    boxShadow: isOutOfStock
      ? 'none'
      : pressed
      ? '0 0px 0 0 #14532d'
      : hovered
      ? '0 1px 0 0 #15803d'
      : '0 3px 0 0 #903008',
    transform: !isOutOfStock && pressed ? 'translateY(3px)' : !isOutOfStock && hovered ? 'translateY(2px)' : 'none',
    transition: 'all 0.15s ease',
  };

  return (
    <>
      <button
        disabled={isOutOfStock}
        onClick={() => setOpen(true)}
        onMouseEnter={() => !isOutOfStock && setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => !isOutOfStock && setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={btnStyle}
        className={`relative px-3 py-1.5 font-bold text-[9px] tracking-widest uppercase rounded-full border flex items-center gap-1 select-none ${
          isOutOfStock ? 'text-zinc-500 cursor-not-allowed' : 'text-[#F6EFE3]'
        }`}
      >
        {isOutOfStock ? (
          <span>Sold Out</span>
        ) : (
          <>
            <ShoppingBag size={10} /> Order
          </>
        )}
      </button>
      <AnimatePresence>
        {open && <OrderModal dishName={dishName} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

// ─── Lightbox ──────────────────────────────────────────────────────────────────
interface LightboxProps {
  dish: Dish;
  onClose: () => void;
}
const Lightbox: React.FC<LightboxProps> = ({ dish, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-10">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-[#F6EFE3] rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col md:flex-row"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-brand-dark/80 text-[#F6EFE3] rounded-full p-2 hover:bg-brand-accent transition-colors"
        >
          <X size={18} />
        </button>

        {/* Image */}
        <div className="md:w-1/2 aspect-square md:aspect-auto shrink-0 overflow-hidden">
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="p-8 flex flex-col justify-center md:w-1/2">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            {dish.isPopular && (
              <span className="flex items-center gap-1 bg-brand-accent text-[#F6EFE3] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                <Flame size={10} className="fill-current" /> Popular
              </span>
            )}
            {dish.isVegetarian !== undefined && (
              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border-2 ${dish.isVegetarian ? 'border-green-600 text-green-700 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'}`}>
                <Leaf size={10} /> {dish.isVegetarian ? 'Veg' : 'Non-Veg'}
              </span>
            )}
          </div>

          <span className="text-xs uppercase font-semibold tracking-wider text-brand-olive mb-1">{dish.category}</span>
          <h2 className="font-display text-2xl font-extrabold text-brand-dark mb-1">{dish.name}</h2>
          {dish.teluguName && (
            <p className="font-telugu text-sm text-brand-accent/80 mb-3">{dish.teluguName}</p>
          )}

          {/* Rating */}
          {dish.rating && (
            <div className="flex items-center gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} className={`${s <= Math.round(dish.rating!) ? 'text-brand-gold fill-current' : 'text-brand-dark/20'}`} />
              ))}
              <span className="text-sm font-bold text-brand-dark ml-1">{dish.rating}</span>
            </div>
          )}

          <p className="text-sm font-sans text-brand-dark/70 leading-relaxed mb-6">{dish.description}</p>

          <div className="flex items-center justify-between border-t border-brand-dark/10 pt-4">
            <span className="font-display text-3xl font-black text-brand-dark">{dish.price}</span>
            <OrderTrigger dishName={dish.name} />
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};


// ─── Horizontal Scroll Row ──────────────────────────────────────────────────────
interface CategoryRowProps {
  category: string;
  dishes: Dish[];
  onDishClick: (dish: Dish) => void;
  isHighlighted?: boolean;
  sectionId?: string;
}
const CategoryRow: React.FC<CategoryRowProps> = ({ category, dishes, onDishClick, isHighlighted, sectionId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'right' ? 240 : -240, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      id={sectionId}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`mb-10 scroll-mt-36 rounded-3xl transition-all duration-500 ${
        isHighlighted
          ? 'ring-2 ring-brand-gold/60 bg-brand-gold/5 p-5 -mx-5'
          : 'p-0'
      }`}
    >
      {/* Highlighted banner when arriving from Home page */}
      {isHighlighted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-brand-gold/15 border border-brand-gold/40 rounded-2xl px-5 py-3 mb-5"
        >
          <span className="text-lg">🍽️</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">Order from this section</p>
            <p className="text-xs text-brand-dark/60 font-sans mt-0.5">Click any dish to view details, then order via Swiggy or Zomato</p>
          </div>
        </motion.div>
      )}
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-dark leading-none">{category}</h2>
          <p className="text-xs text-brand-dark/50 uppercase tracking-widest font-semibold mt-1 leading-none">{dishes.length} items available</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-full border border-brand-dark/15 hover:border-brand-accent hover:bg-brand-accent hover:text-[#F6EFE3] text-brand-dark transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-full border border-brand-dark/15 hover:border-brand-accent hover:bg-brand-accent hover:text-[#F6EFE3] text-brand-dark transition-all duration-200"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-3 no-scrollbar scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {dishes.map((dish) => (
          <motion.div
            key={dish.id}
            whileHover={dish.isOutOfStock ? {} : { y: -4, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className={`shrink-0 w-44 md:w-52 bg-[#F6EFE3] rounded-xl overflow-hidden border border-brand-dark/10 shadow-sm transition-all ${
              dish.isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-xl group'
            }`}
            style={{ scrollSnapAlign: 'start' }}
            onClick={dish.isOutOfStock ? undefined : () => onDishClick(dish)}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-brand-dark/5">
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              {/* Overlay: price badge bottom-left */}
              <div className="absolute bottom-2 left-2 bg-brand-dark/80 text-[#F6EFE3] text-[10px] font-bold font-display px-2 py-0.5 rounded-full backdrop-blur-sm">
                {dish.price}
              </div>
              {/* Rating badge bottom-right */}
              {dish.rating && (
                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <Star size={8} className="fill-current" />
                  {dish.rating}
                </div>
              )}
              {/* Veg/Non-veg dot top-right */}
              {dish.isVegetarian !== undefined && (
                <div className={`absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded-md border-2 bg-white ${dish.isVegetarian ? 'border-green-600' : 'border-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dish.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
              )}
              {/* Popular top-left */}
              {dish.isPopular && !dish.isOutOfStock && (
                <span className="absolute top-2 left-2 flex items-center gap-0.5 bg-brand-accent text-[#F6EFE3] text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow">
                  <Flame size={7} className="fill-current" /> Popular
                </span>
              )}
              
              {/* Sold out overlay */}
              {dish.isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Sold Out
                  </span>
                </div>
              )}

              {/* Hover overlay – click to view */}
              {!dish.isOutOfStock && (
                <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#F6EFE3] text-[9px] font-bold uppercase tracking-widest bg-brand-accent/90 px-3 py-1.5 rounded-full">
                    View Details
                  </span>
                </div>
              )}
            </div>

            {/* Card body */}
            <div className="p-2.5">
              <h3 className="font-display text-xs font-extrabold text-brand-dark group-hover:text-brand-accent transition-colors duration-300 leading-tight line-clamp-1">
                {dish.name}
              </h3>
              {dish.teluguName && (
                <p className="font-telugu text-[10px] text-brand-accent/75 mt-0.5 line-clamp-1">{dish.teluguName}</p>
              )}
              <p className="text-[10px] font-sans text-brand-dark/60 leading-relaxed mt-1 line-clamp-2">{dish.description}</p>
              {/* Order button – stops propagation so lightbox doesn't open */}
              <div className="mt-2 pt-2 border-t border-brand-dark/5" onClick={(e) => e.stopPropagation()}>
                <OrderTrigger dishName={dish.name} isOutOfStock={dish.isOutOfStock} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Menu Page ──────────────────────────────────────────────────────────────────
export const Menu: React.FC = () => {
  const router = useRouter();
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Sweets'>('All');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const searchParams = useSearchParams();
  const targetCategory = searchParams.get('category') || '';
  const targetDish = searchParams.get('dish') || '';

  const [showAllHeadings, setShowAllHeadings] = useState(false);

  // Fetch live menu categories and dishes from the DB (no cache)
  const loadMenu = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/cms/menu?cacheBust=${Date.now()}_${Math.random().toString(36).substring(7)}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMenuCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // 1. Force Client-Side Router Route Refresh & Dynamic Polling
  // Refreshes Next.js client-side cache tree silently on window focus or 3-second interval heartbeat
  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
      loadMenu();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    
    // Background polling interval to fetch fresh DB state silently
    const interval = setInterval(() => {
      loadMenu();
      router.refresh();
    }, 3000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, [router, loadMenu]);

  // Flatten active dishes for search, filtering, and deep-linking
  const allDishes = useMemo(() => {
    const list: Dish[] = [];
    menuCategories.forEach(cat => {
      cat.dishes.forEach((d: any) => {
        // Exclude hidden dishes on public page
        if (d.isHidden) return;
        list.push({
          id: d.id,
          name: d.name,
          teluguName: d.teluguName || undefined,
          description: d.description || '',
          price: d.price,
          category: cat.name,
          image: d.image,
          rating: d.rating,
          isVegetarian: d.isVegetarian,
          isBestseller: d.isBestseller,
          isChefSpecial: d.isChefSpecial,
          isSeasonal: d.isSeasonal,
          isOutOfStock: d.isOutOfStock,
          images: d.images as string[] | undefined,
          scheduleDays: d.scheduleDays as string[] | undefined,
          scheduleTimings: d.scheduleTimings || undefined,
          isRecommended: d.isRecommended
        });
      });
    });
    return list;
  }, [menuCategories]);

  // Scroll to highlighted category on load
  useEffect(() => {
    if (!targetCategory) return;
    const id = `cat-${targetCategory.replace(/\s+/g, '-').toLowerCase()}`;
    const attempt = (tries = 0) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (tries < 10) {
        setTimeout(() => attempt(tries + 1), 150);
      }
    };
    attempt();
  }, [targetCategory]);

  // Auto-open lightbox for deep-linked dish
  useEffect(() => {
    if (!targetDish || allDishes.length === 0) return;
    const attempt = (tries = 0) => {
      const dish = allDishes.find(
        (d) => d.name.toLowerCase() === targetDish.toLowerCase()
      );
      if (dish) {
        setTimeout(() => setSelectedDish(dish), 600);
      } else if (tries < 8) {
        setTimeout(() => attempt(tries + 1), 200);
      }
    };
    attempt();
  }, [targetDish, allDishes]);

  const filteredDishes = useMemo(() => {
    const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    const currentTimeStr = new Date().toTimeString().slice(0, 5); // "HH:MM"

    return allDishes.filter((dish) => {
      // 1. Basic Text Search
      const matchesSearch =
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dish.teluguName && dish.teluguName.includes(searchQuery));

      // 2. Veg / Sweets Badge Filter
      const matchesVeg =
        vegFilter === 'All' ||
        (vegFilter === 'Veg' && dish.isVegetarian === true) ||
        (vegFilter === 'Sweets' && dish.category.toLowerCase().includes('sweets'));

      // 3. Scheduling logic (Only show if scheduled day/time matches)
      let matchesSchedule = true;
      if (dish.scheduleDays && Array.isArray(dish.scheduleDays) && dish.scheduleDays.length > 0) {
        matchesSchedule = dish.scheduleDays.includes(currentDay);
      }
      if (matchesSchedule && dish.scheduleTimings) {
        try {
          const [start, end] = dish.scheduleTimings.split('-');
          if (start && end) {
            matchesSchedule = currentTimeStr >= start.trim() && currentTimeStr <= end.trim();
          }
        } catch (e) {
          console.error('Failed to parse timings for', dish.name, e);
        }
      }

      return matchesSearch && matchesVeg && matchesSchedule;
    });
  }, [allDishes, searchQuery, vegFilter]);

  // Group by category, preserving order
  const grouped = useMemo(() => {
    const map = new Map<string, Dish[]>();
    filteredDishes.forEach((dish) => {
      if (!map.has(dish.category)) map.set(dish.category, []);
      map.get(dish.category)!.push(dish);
    });
    return map;
  }, [filteredDishes]);

  if (loading) {
    return (
      <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
        <p className="font-display text-xl font-bold text-brand-dark">Loading Premium Menu...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen">
      {/* Lightbox */}
      <AnimatePresence>
        {selectedDish && (
          <Lightbox dish={selectedDish} onClose={() => setSelectedDish(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Interactive Gastronomy</span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-brand-dark mt-3">
            The Balaji Chilkur Menu
          </h1>
          <p className="text-brand-dark/70 font-sans text-sm md:text-base mt-4">
            Scroll through our premium pure vegetarian selection. Click any dish to view full details and order online.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass-panel p-5 rounded-2xl border border-brand-dark/10 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40" size={18} />
            <input
              type="text"
              placeholder="Search dishes (e.g. Paneer Butter Masala, Veg Biryani)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/15 rounded-full pl-12 pr-6 py-3 text-sm font-sans focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all text-brand-dark placeholder-brand-dark/45"
            />
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowAllHeadings(!showAllHeadings)}
              className={`flex items-center space-x-2 text-brand-dark/65 hover:text-brand-accent transition-colors py-1.5 px-3 rounded-full hover:bg-brand-dark/5 select-none ${showAllHeadings ? 'text-brand-accent bg-brand-dark/5' : ''}`}
            >
              <SlidersHorizontal size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
            </button>
            <div className="flex bg-brand-dark/5 p-1 rounded-full border border-brand-dark/5">
              {(['All', 'Veg', 'Sweets'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVegFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                    vegFilter === filter
                      ? 'bg-brand-accent text-[#F6EFE3]'
                      : 'text-brand-dark/70 hover:text-brand-dark'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Headings / Category Quick Jump Panel */}
        <AnimatePresence>
          {showAllHeadings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="glass-panel p-6 rounded-2xl border border-brand-dark/10 shadow-sm bg-[#FAF6EE] flex flex-wrap gap-2.5">
                <p className="w-full text-xs font-bold uppercase tracking-widest text-brand-dark/50 mb-2">
                  Jump to Section:
                </p>
                {Array.from(grouped.keys()).map((category) => {
                  const sectionId = `cat-${category.replace(/\s+/g, '-').toLowerCase()}`;
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        const el = document.getElementById(sectionId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="px-3.5 py-2 bg-brand-bg hover:bg-brand-accent hover:text-[#F6EFE3] text-brand-dark border border-brand-dark/10 hover:border-brand-accent rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Rows */}
        {grouped.size > 0 ? (
          Array.from(grouped.entries()).map(([category, dishes]) => {
            const sectionId = `cat-${category.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <CategoryRow
                key={category}
                category={category}
                dishes={dishes}
                onDishClick={setSelectedDish}
                isHighlighted={!!targetCategory && category === targetCategory}
                sectionId={sectionId}
              />
            );
          })
        ) : vegFilter === 'Sweets' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-brand-gold/10 rounded-2xl border border-brand-gold/25 p-8 max-w-2xl mx-auto shadow-sm"
          >
            <span className="text-5xl">🍬</span>
            <h3 className="font-display text-2xl font-black mt-4 text-brand-dark">Sweets Coming Soon</h3>
            <p className="text-sm text-brand-dark/70 font-sans mt-3 max-w-md mx-auto leading-relaxed">
              We are currently curating and preparing a selection of traditional premium sweets for our menu. We will update the menu card with these additions very soon!
            </p>
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-[#ECE3D4]/20 rounded-2xl border border-dashed border-brand-dark/15">
            <span className="text-4xl">🥘</span>
            <h3 className="font-display text-xl font-bold mt-4 text-brand-dark">No dishes found</h3>
            <p className="text-sm text-brand-dark/60 font-sans mt-2">
              Try adjusting your search criteria or changing your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
