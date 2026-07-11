"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  Star, 
  X, 
  Quote
} from 'lucide-react';
import { DishCard } from '../components/DishCard';
import { SIGNATURE_DISHES as STATIC_DISHES, GALLERY_PHOTOS as STATIC_GALLERY, TESTIMONIALS as STATIC_TESTIMONIALS } from '../utils/menuData';
import { Loader2 } from 'lucide-react';

// ─── Circular Review Card ────────────────────────────────────────────────────────
interface CircularReviewCardProps {
  testimonial: any;
  onClick: () => void;
}
const CircularReviewCard: React.FC<CircularReviewCardProps> = ({ testimonial, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative w-72 h-72 md:w-80 md:h-80 rounded-full bg-[#F6EFE3] border border-brand-dark/15 shadow-md flex flex-col items-center justify-center p-8 text-center shrink-0 cursor-pointer select-none overflow-hidden group transition-all duration-300 hover:shadow-xl hover:border-brand-gold/45"
    >
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-gold/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-brand-accent/5 rounded-full blur-xl pointer-events-none" />

      {/* Avatar in Gold Ring */}
      <div className="relative mb-3 shrink-0">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-brand-gold shadow-md"
        />
        <div className="absolute -bottom-1 right-0 bg-[#F6EFE3] text-brand-gold p-0.5 rounded-full border border-brand-gold/25 text-[8px] font-bold">
          ⭐
        </div>
      </div>

      <h4 className="font-display font-extrabold text-sm md:text-base text-brand-dark group-hover:text-brand-accent transition-colors mt-1">
        {testimonial.name}
      </h4>

      <p className="text-[9px] text-brand-olive uppercase tracking-widest font-semibold mt-0.5">
        {testimonial.source}
      </p>

      <p className="text-xs font-sans text-brand-dark/70 italic leading-relaxed mt-3 flex-grow line-clamp-3 max-w-[200px] md:max-w-[230px]">
        "{testimonial.content}"
      </p>

      <div className="flex gap-0.5 text-brand-gold mt-4 shrink-0">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={10} className="fill-current text-brand-gold" />
        ))}
      </div>
    </motion.div>
  );
};

// ─── Review Modal popup ──────────────────────────────────────────────────────────
interface ReviewModalProps {
  testimonial: any;
  onClose: () => void;
}
const ReviewModal: React.FC<ReviewModalProps> = ({ testimonial, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 bg-[#F6EFE3] rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl overflow-hidden border border-brand-dark/10"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-brand-dark/10 hover:bg-brand-dark/20 text-brand-dark rounded-full p-2 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="absolute top-2 right-6 text-brand-gold/10 pointer-events-none select-none">
          <Quote size={100} />
        </div>

        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-full h-full rounded-full object-cover border-4 border-brand-gold shadow-lg"
            />
            <span className="absolute bottom-0 right-0 bg-[#4285F4] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow border border-white">
              G
            </span>
          </div>

          <h3 className="font-display text-xl font-extrabold text-brand-dark">{testimonial.name}</h3>
          <p className="text-xs text-brand-olive font-semibold tracking-wider uppercase mt-1">
            {testimonial.role}
          </p>

          <div className="flex justify-center gap-1 my-4 text-brand-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < testimonial.rating ? 'fill-current text-brand-gold' : 'text-brand-dark/20'}
              />
            ))}
          </div>

          <p className="text-sm font-sans text-brand-dark/80 italic leading-relaxed my-6 bg-brand-dark/5 p-5 rounded-2xl border border-brand-dark/5 text-left">
            "{testimonial.content}"
          </p>

          <div className="flex justify-between items-center text-[10px] font-bold text-brand-dark/50 uppercase tracking-widest pt-4 border-t border-brand-dark/5">
            <span>Posted: {testimonial.date}</span>
            <span className="bg-brand-accent/15 text-brand-accent px-3 py-1 rounded-full">
              {testimonial.source}
            </span>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const HOME_BRANCHES = [
  {
    name: "Moinabad Branch",
    address: "4-15/2part, Aziz Nagar, Himayat Sagar Rd, Moinabad, Telangana 500075",
    phone: "098494 98681",
    mapEmbedUrl: "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Aziz%20Nagar%20Himayat%20Sagar%20Rd%20Moinabad%20Telangana&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Family+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana",
    openingTime: "11:00",
    closingTime: "23:00"
  },
  {
    name: "Chinthal Branch",
    address: "1 2nd floor, HMT Rd, above The Kakatiya Co-operative Bank, Chinthal, Quthbullapur, Hyderabad, Telangana 500037",
    phone: "098494 98681",
    mapEmbedUrl: "https://maps.google.com/maps?q=1%202nd%20floor,%20HMT%20Rd,%20above%20The%20kakatiya%20co-operative%20Bank.LTD,%20beside%20Ridge%20Towers,%20Chinthal,%20Quthbullapur,%20Hyderabad,%20Telangana%20500037&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: "https://www.google.com/maps/search/?api=1&query=1+2nd+floor,+HMT+Rd,+above+The+kakatiya+co-operative+Bank.LTD,+beside+Ridge+Towers,+Chinthal,+Quthbullapur,+Hyderabad,+Telangana+500037",
    openingTime: "11:00",
    closingTime: "23:00"
  }
];

export const Home: React.FC = () => {
  const navigate = useRouter();
  const [activeBranch, setActiveBranch] = useState(0);
  const activeCategory = 'Starters';

  // CMS Dynamic States
  const [cmsSettings, setCmsSettings] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected review for details modal
  const [selectedReview, setSelectedReview] = useState<any>(null);

  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const reviewsDragRef = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasDragged: false });

  useEffect(() => {
    async function loadCMSData() {
      try {
        const previewMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';
        
        const [settingsRes, menuRes, offersRes, testimonialsRes, galleryRes, branchesRes] = await Promise.all([
          fetch(`/api/cms/homepage?draft=${previewMode}`),
          fetch(`/api/cms/menu?cacheBust=${Date.now()}_${Math.random().toString(36).substring(7)}`, {
            cache: 'no-store',
            next: { revalidate: 0 },
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }),
          fetch('/api/cms/offers?activeOnly=true&homepageOnly=true'),
          fetch('/api/cms/testimonials?approvedOnly=true'),
          fetch('/api/cms/gallery?featured=true'),
          fetch('/api/cms/branches')
        ]);

        const [settingsData, menuData, offersData, testimonialsData, galleryData, branchesData] = await Promise.all([
          settingsRes.json(),
          menuRes.json(),
          offersRes.json(),
          testimonialsRes.json(),
          galleryRes.json(),
          branchesRes.json()
        ]);

        if (settingsData.success) setCmsSettings(settingsData.settings);
        
        if (menuData.success) {
          const all: any[] = [];
          menuData.categories.forEach((cat: any) => {
            cat.dishes.forEach((d: any) => {
              if (!d.isHidden) {
                all.push({ ...d, category: cat.name });
              }
            });
          });
          setDishes(all);
        }

        if (offersData.success) setOffers(offersData.offers);
        if (testimonialsData.success) setTestimonials(testimonialsData.testimonials);
        if (galleryData.success) setGalleryPhotos(galleryData.photos);
        if (branchesData.success) setBranches(branchesData.branches);

      } catch (error) {
        console.error('Failed to load CMS data on home:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCMSData();
  }, []);

  useEffect(() => {
    const el = galleryScrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    let startX: number;
    let scrollLeft: number;
    let isDown = false;

    const autoScroll = () => {
      if (!isDown && el) {
        el.scrollLeft += 0.6; // slow scroll speed
        // If we scrolled past half the width (loop-around point), reset to 0
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      isDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // drag speed
      el.scrollLeft = scrollLeft - walk;
    };

    const onTouchStart = () => {
      isDown = true;
    };
    const onTouchEnd = () => {
      isDown = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Reviews auto-scroll + drag-to-scroll
  useEffect(() => {
    const el = reviewsScrollRef.current;
    const drag = reviewsDragRef.current;
    if (!el) return;

    let animationFrameId: number;

    const autoScroll = () => {
      if (!drag.isDown && el) {
        el.scrollLeft += 0.5;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    const onMouseDown = (e: MouseEvent) => {
      drag.isDown = true;
      drag.hasDragged = false;
      drag.startX = e.pageX - el.offsetLeft;
      drag.scrollLeft = el.scrollLeft;
    };
    const onMouseLeave = () => { drag.isDown = false; };
    const onMouseUp = () => { drag.isDown = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - drag.startX) * 1.5;
      if (Math.abs(walk) > 5) drag.hasDragged = true;
      el.scrollLeft = drag.scrollLeft - walk;
    };
    const onTouchStart = () => { drag.isDown = true; drag.hasDragged = false; };
    const onTouchEnd = () => { drag.isDown = false; };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Use DB loaded values or fallback to static defaults
  const listDishes = dishes.length > 0 ? dishes : STATIC_DISHES.map(d => ({ ...d, isVegetarian: d.isVegetarian ?? true }));
  const filteredDishes = listDishes.filter(dish => dish.category === activeCategory).slice(0, 4);

  const listOffers = offers.length > 0 ? offers : [
    {
      id: 'online-booking-offer',
      title: '10% Off Online Bookings',
      description: 'Skip the wait and get 10% off your entire bill when you reserve a table online.',
      price: '-10%',
      badge: 'Limited Time',
      cta: 'Book Now',
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000&auto=format&fit=crop',
      link: '/reserve'
    },
    {
      id: 'family-combo',
      title: 'Jumbo Family Pack',
      description: 'Perfect for 4-5 people. Includes Biryani, Curries, Rotis, and Desserts.',
      price: '₹1499',
      badge: 'Best Value',
      cta: 'Order Now',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
      link: '/menu?category=Combo+Family+Pack'
    }
  ];

  const listTestimonials = testimonials.length > 0 ? testimonials : STATIC_TESTIMONIALS;
  const listGallery = galleryPhotos.length > 0 ? galleryPhotos : STATIC_GALLERY;
  const listBranches = branches.length > 0 ? branches.map(b => ({
    name: b.name,
    address: b.address,
    phone: b.phone,
    mapEmbedUrl: b.id === '52ae6a0f-daee-40f5-aa0e-ac44e17d325e' 
      ? "https://maps.google.com/maps?q=Balaji%20Santosh%20Family%20Dhaba%20Aziz%20Nagar%20Himayat%20Sagar%20Rd%20Moinabad%20Telangana&t=&z=15&ie=UTF8&iwloc=&output=embed"
      : "https://maps.google.com/maps?q=1%202nd%20floor,%20HMT%20Rd,%20above%20The%20kakatiya%20co-operative%20Bank.LTD,%20beside%20Ridge%20Towers,%20Chinthal,%20Quthbullapur,%20Hyderabad,%20Telangana%20500037&t=&z=15&ie=UTF8&iwloc=&output=embed",
    mapNavUrl: b.id === '52ae6a0f-daee-40f5-aa0e-ac44e17d325e'
      ? "https://www.google.com/maps/search/?api=1&query=Balaji+Santosh+Dhaba+Aziz+Nagar+Himayat+Sagar+Rd+Moinabad+Telangana"
      : "https://www.google.com/maps/search/?api=1&query=1+2nd+floor,+HMT+Rd,+above+The+kakatiya+co-operative+Bank.LTD,+beside+Ridge+Towers,+Chinthal,+Quthbullapur,+Hyderabad,+Telangana+500037",
    openingTime: b.openingTime,
    closingTime: b.closingTime
  })) : HOME_BRANCHES;

  // Destructure homepage CMS settings or fallback
  const sectionsMap = cmsSettings?.homepage_sections || {
    hero: true,
    announcement: true,
    featuredDishes: true,
    offers: true,
    about: true,
    gallery: true,
    testimonials: true,
    contact: true
  };

  const heroData = cmsSettings?.homepage_hero || {
    title: 'Authentic Indian Cuisine',
    subtitle: 'Experience the rich flavors of traditional pure vegetarian recipes cooked with love and passion.',
    videoUrl: 'https://www.youtube-nocookie.com/embed/VRKIM1pytu8?autoplay=1&mute=1&loop=1&playlist=VRKIM1pytu8&playsinline=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&vq=hd1080',
    ctaText: 'Reserve A Table',
    ctaLink: '/reserve',
    secondaryCtaText: 'Order Online',
    secondaryCtaLink: '/menu'
  };

  const announcementData = cmsSettings?.announcement_bar || {
    text: '🎉 Special Offer: Flat 10% Off on Table Bookings Online! Show your QR code at the counter.',
    isActive: true
  };

  const aboutData = cmsSettings?.homepage_about || {
    heading: 'Our Culinary Journey',
    subheading: 'A Legacy of Pure Vegetarian Excellence Since 1999',
    content: 'At Balaji Chilkur Family Dhaba, we bring you the finest flavors of North & South Indian cuisine. Our dishes are prepared by expert chefs using the freshest local produce and pure spices. Perfect for family dining, farm events, and travelers looking for a premium dining stop.',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    isActive: true
  };

  return (
    <div className="relative bg-brand-bg noise-overlay min-h-screen">
      
      {/* Announcement Bar */}
      {sectionsMap.announcement && announcementData.isActive && (
        <div className="bg-brand-accent text-white py-3 px-4 text-center text-xs font-bold uppercase tracking-wider relative z-50">
          {announcementData.text}
        </div>
      )}

      {/* 1. HERO SECTION */}
      {sectionsMap.hero && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark">
          {/* Full-Screen Background Video — all devices */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Fallback background colour while video loads */}
            <div className="absolute inset-0 bg-brand-dark" />

            {/* YouTube Video or image */}
            <iframe
              src={heroData.videoUrl}
              title="Balaji Santosh Family Dhaba Background Video"
              allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 'none', pointerEvents: 'none' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[177.78vh] h-[100vh]
                         min-w-full min-h-full
                         opacity-50 scale-110"
            />

            {/* Subtle dark gradient overlay for branding integration without losing video clarity */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/60" />
          </div>

          {/* Hero Content Overlay */}
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
            <span className="text-[#F6EFE3] text-[10px] font-bold uppercase tracking-[0.2em] bg-brand-accent/20 border border-brand-accent/40 px-4 py-1.5 rounded-full backdrop-blur-md mb-6 animate-pulse">
              Balaji Chilkur Family Dhaba
            </span>
            <h1 className="font-display text-4xl md:text-7xl font-black text-[#F6EFE3] leading-tight drop-shadow-xl uppercase tracking-tight">
              {heroData.title}
            </h1>
            <p className="text-sm md:text-lg text-[#F6EFE3]/80 font-sans mt-4 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {heroData.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
              <Link
                href={heroData.ctaLink}
                className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/90 text-[#F6EFE3] px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-brand-accent/25 transition-all text-sm block"
              >
                {heroData.ctaText}
              </Link>
              <Link
                href={heroData.secondaryCtaLink}
                className="w-full sm:w-auto bg-transparent hover:bg-[#F6EFE3]/10 border-2 border-[#F6EFE3] text-[#F6EFE3] px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all text-sm block"
              >
                {heroData.secondaryCtaText}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. FEATURED DISHES SECTION */}
      {sectionsMap.featuredDishes && (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Signature Selection</span>
            <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
              Delicious Pure Vegetarian Cuisine
            </h2>
            <p className="text-brand-dark/70 font-sans text-sm md:text-base mt-4">
              Select a category below to explore our delicious Indian vegetarian options, freshly prepared with quality ingredients.
            </p>
          </div>

          {/* Grid display of signature dishes */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredDishes.map((dish) => (
                <motion.div 
                  key={dish.id} 
                  layout 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <DishCard dish={dish} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Explore Full Menu Button */}
          <div className="flex justify-center mt-12">
            <Link 
              href="/menu" 
              className="bg-brand-accent hover:bg-brand-accent/90 text-[#F6EFE3] px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-lg shadow-brand-accent/25 transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>Explore Full Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}


      {/* 4. SPECIAL OFFERS SECTION */}
      {sectionsMap.offers && (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Exclusive Indulgence</span>
            <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
              Limited Time Promotions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {listOffers.map((offer) => (
              <div 
                key={offer.id}
                onClick={() => navigate.push(offer.link)}
                className="relative rounded-2xl overflow-hidden min-h-[300px] flex items-center bg-brand-dark text-[#F6EFE3] group cursor-pointer"
              >
                {/* Offer Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={offer.image} 
                    alt={offer.title}
                    className="w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/80 to-transparent" />
                </div>

                {/* Offer Content */}
                <div className="relative z-10 p-8 md:p-12 max-w-md">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-accent text-brand-bg px-2.5 py-1 rounded-md">
                    {offer.badge}
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-extrabold mt-4 text-[#F6EFE3]">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-[#F6EFE3]/70 mt-2 font-sans">
                    {offer.description}
                  </p>
                  <div className="flex items-center space-x-6 mt-6">
                    <span className="font-display text-3xl font-black text-brand-gold">
                      {offer.price}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate.push(offer.link);
                      }}
                      className="text-xs font-bold uppercase tracking-widest bg-[#F6EFE3] text-brand-dark hover:bg-brand-accent hover:text-[#F6EFE3] px-6 py-3 rounded-full transition-colors duration-300"
                    >
                      {offer.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. ABOUT SECTION */}
      {sectionsMap.about && aboutData.isActive && (
        <section className="py-24 bg-[#ECE3D4]/50 border-y border-brand-dark/5 px-6 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Simple Image Column */}
            <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-xl relative group">
              <img 
                src={aboutData.image} 
                alt="Balaji Chilkur Family Dhaba Dining Setup" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
            </div>

            {/* Simplified Description Column */}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">About Us</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3 leading-tight">
                {aboutData.heading}
              </h2>
              
              <p className="text-brand-dark/75 font-sans text-sm md:text-base mt-6 leading-relaxed">
                {aboutData.content}
              </p>

              <div className="mt-8">
                <Link 
                  href="/about" 
                  className="inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors duration-300"
                >
                  <span>Our Story</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. PHOTO GALLERY SECTION */}
      {sectionsMap.gallery && (
        <section className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visual feast</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Capturing Culinary Art
              </h2>
            </div>
            <Link 
              href="/gallery" 
              className="group inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-brand-accent mt-4 md:mt-0"
            >
              <span>View Full Gallery</span>
              <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Draggable & Scrollable Auto-Scrolling Container */}
          <div 
            ref={galleryScrollRef}
            className="relative w-full flex overflow-x-auto py-4 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            style={{ scrollSnapType: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex space-x-6 shrink-0">
              {(() => {
                // Drop duplicate photo entries entirely by tracking seen ids
                const seen = new Set();
                const uniqueGallery = listGallery.filter(photo => {
                  if (!photo.id) return false;
                  if (seen.has(photo.id)) return false;
                  seen.add(photo.id);
                  return true;
                });

                return uniqueGallery.map((photo) => (
                  <div 
                    key={photo.id}
                    className="relative overflow-hidden rounded-2xl bg-brand-dark group aspect-square w-72 md:w-80 shrink-0 shadow-md pointer-events-none"
                  >
                    <img 
                      src={photo.src} 
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <p className="font-display font-bold text-[#F6EFE3] text-base leading-tight">
                        {photo.title}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      )}

      {/* 7. TESTIMONIALS SECTION */}
      {sectionsMap.testimonials && (
        <section id="reviews" className="py-24 bg-[#ECE3D4]/50 border-t border-brand-dark/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Verified Feedback</span>
              <h2 className="font-display text-3xl md:text-5xl font-black text-brand-dark mt-3">
                Words From Our Patrons
              </h2>
              <p className="text-xs text-brand-dark/50 uppercase tracking-widest font-semibold mt-2">
                Click any review card to read the full patron feedback
              </p>
            </div>
          </div>

          {/* Draggable & Scrollable Auto-Scrolling Reviews */}
          <div
            ref={reviewsScrollRef}
            className="relative w-full flex overflow-x-auto py-6 no-scrollbar cursor-grab active:cursor-grabbing select-none"
            style={{ scrollSnapType: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="flex space-x-8 shrink-0">
              {/* Duplicated array to allow seamless scrolling loop */}
              {[...listTestimonials, ...listTestimonials].map((testimonial, index) => (
                <CircularReviewCard 
                  key={`${testimonial.id}-${index}`}
                  testimonial={testimonial}
                  onClick={() => {
                    if (!reviewsDragRef.current.hasDragged) {
                      setSelectedReview(testimonial);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Review Lightbox Portal Modal */}
          <AnimatePresence>
            {selectedReview && (
              <ReviewModal 
                testimonial={selectedReview} 
                onClose={() => setSelectedReview(null)} 
              />
            )}
          </AnimatePresence>
        </section>
      )}

      {/* 8. LOCATION & MAP SECTION */}
      {sectionsMap.contact && listBranches.length > 0 && (
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          {/* Branch Switcher Tabs */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-[#ECE3D4]/50 p-1.5 rounded-2xl border border-brand-dark/5 shadow-sm">
              {listBranches.map((b, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBranch(idx)}
                  className={`px-6 py-3 rounded-xl font-display font-extrabold text-sm transition-all duration-300 ${
                    activeBranch === idx
                      ? 'bg-brand-accent text-brand-bg shadow-md'
                      : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-dark/5'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const currentBranch = listBranches[activeBranch] || listBranches[0] || {};
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Map Contact Card */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visit Us</span>
                  <h2 className="font-display text-3xl md:text-4xl font-extrabold text-brand-dark mt-3">
                    Welcome to {currentBranch.name}
                  </h2>

                  <div className="space-y-6 mt-8">
                    {/* Address */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Address</h4>
                        <a href={currentBranch.mapNavUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-dark/70 mt-1 underline hover:text-brand-accent leading-relaxed">
                          {currentBranch.address}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <Phone size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Phone</h4>
                        <a href={`tel:${currentBranch.phone?.replace(/\s+/g, '')}`} className="text-sm text-brand-dark hover:text-brand-accent font-semibold transition-colors mt-1 block">
                          {currentBranch.phone}
                        </a>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-accent/10 text-brand-accent rounded-full mt-1">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-dark uppercase text-sm tracking-wider">Operating Hours</h4>
                        <p className="text-sm text-brand-dark/70 mt-1">
                          Daily Operation: {currentBranch.openingTime || '11:00'} – {currentBranch.closingTime || '23:00'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                    <a 
                      href={currentBranch.mapNavUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-brand-accent hover:bg-brand-accent/90 text-brand-bg px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs shadow-md transition-colors text-center"
                    >
                      Google Maps Navigation
                    </a>
                    <a 
                      href={currentBranch.mapNavUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="border border-brand-dark/20 hover:border-brand-accent text-brand-dark hover:text-brand-accent px-6 py-3.5 rounded-full font-bold uppercase tracking-wider text-xs transition-colors text-center"
                    >
                      Get Directions
                    </a>
                  </div>
                </div>

                {/* Embedded Styled Map simulation */}
                <div className="lg:col-span-7 h-[450px] w-full rounded-2xl overflow-hidden border border-brand-dark/15 shadow-lg relative bg-brand-dark/5">
                  <iframe 
                    title={`${currentBranch.name} Location Map`}
                    src={currentBranch.mapEmbedUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })()}
        </section>
      )}

    </div>
  );
};
