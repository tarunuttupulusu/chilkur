"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GALLERY_PHOTOS as STATIC_GALLERY } from '../utils/menuData';

export const GalleryPage: React.FC = () => {
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<string>('All');
  const [albums, setAlbums] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  
  const navigate = useRouter();

  useEffect(() => {
    async function loadGallery() {
      try {
        // Cache-busting ensures we always get fresh data from the DB
        const res = await fetch(`/api/cms/gallery?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        if (data.success) {
          setGalleryList(data.photos);
          setAlbums(['All', ...data.albums]);
        }
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();

    // BroadcastChannel: instantly reflects admin gallery changes in the same browser
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('gallery-updates');
      channel.onmessage = (event) => {
        if (event.data === 'gallery-updated') loadGallery();
      };
    } catch { /* old browsers — graceful degradation */ }

    // Focus/visibility refresh: reload when user switches back to this tab
    const handleFocus = () => loadGallery();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadGallery();
    });

    return () => {
      channel?.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, []);


  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const displayList = galleryList.length > 0 ? galleryList : STATIC_GALLERY.map(p => ({
    ...p,
    altText: p.title,
    isFeatured: false,
    albumName: 'General'
  }));

  const uniqueDisplayList = React.useMemo(() => {
    const seen = new Set();
    return displayList.filter(photo => {
      const key = (photo.src || photo.id || '').toString().toLowerCase().trim();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [displayList]);

  const filteredPhotos = activeAlbum === 'All' 
    ? uniqueDisplayList 
    : uniqueDisplayList.filter(p => p.albumName === activeAlbum);

  // Freeze background scrolling when lightbox is active
  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [selectedPhotoIndex]);

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  const goToMenuItem = (photo: any) => {
    closeLightbox();
    if (!photo.menuCategory || !photo.menuDishName) {
      navigate.push('/menu');
      return;
    }
    const categoryId = `cat-${photo.menuCategory.replace(/\s+/g, '-').toLowerCase()}`;
    navigate.push(`/menu?category=${encodeURIComponent(photo.menuCategory)}&dish=${encodeURIComponent(photo.menuDishName)}`);
    setTimeout(() => {
      const el = document.getElementById(categoryId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand-accent mb-4" size={48} />
        <p className="font-display text-xl font-bold text-brand-dark">Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-brand-bg noise-overlay min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Visual Archives</span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-brand-dark mt-3">
            The Gallery
          </h1>
          <p className="text-brand-dark/70 font-sans text-sm md:text-base mt-4">
            Click any dish to jump directly to it on our interactive menu and place an order.
          </p>
        </div>

        {/* Album Switcher Tabs */}
        {albums.length > 2 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {albums.map((album) => (
              <button
                key={album}
                onClick={() => {
                  setActiveAlbum(album);
                  setSelectedPhotoIndex(null);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                  activeAlbum === album
                    ? 'bg-brand-accent text-[#F6EFE3]'
                    : 'bg-brand-dark/5 text-brand-dark/70 hover:bg-brand-dark/10'
                }`}
              >
                {album}
              </button>
            ))}
          </div>
        )}

        {/* Masonry Layout Grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredPhotos.map((photo, index) => (
            <motion.div
              key={photo.id || index}
              onClick={() => openLightbox(index)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.8) }}
              className="break-inside-avoid relative overflow-hidden rounded-2xl bg-brand-dark cursor-pointer group shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className="relative w-full h-full min-h-[200px] bg-brand-dark/5">
                {!loadedImages[photo.id || index] && (
                  <div className="absolute inset-0 bg-[#ECE3D4]/40 animate-pulse flex items-center justify-center">
                    <Loader2 className="animate-spin text-brand-accent/30" size={24} />
                  </div>
                )}
                <img
                  src={photo.src}
                  alt={photo.altText || photo.title}
                  onLoad={() => setLoadedImages(prev => ({ ...prev, [photo.id || index]: true }))}
                  className={`w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
                    loadedImages[photo.id || index] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-brand-dark/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-start justify-end p-5">
                {photo.menuCategory && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brand-gold mb-1">{photo.menuCategory}</p>
                )}
                <p className="font-display font-bold text-[#F6EFE3] text-base leading-tight">{photo.title}</p>
                {photo.menuDishName && (
                  <span className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-gold/80">
                    View on Menu <ArrowRight size={10} />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {selectedPhotoIndex !== null && filteredPhotos[selectedPhotoIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-md flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute top-6 right-6 text-brand-bg hover:text-brand-accent p-2 transition-colors z-[55]"
              >
                <X size={32} />
              </button>

              {/* Prev */}
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 md:left-6 text-brand-bg hover:text-brand-accent p-2 transition-colors z-[55]"
              >
                <ChevronLeft size={40} />
              </button>

              {/* Next */}
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 md:right-6 text-brand-bg hover:text-brand-accent p-2 transition-colors z-[55]"
              >
                <ChevronRight size={40} />
              </button>

              {/* Image + CTA */}
              <div
                className="max-w-4xl w-full flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.img
                  key={selectedPhotoIndex}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={filteredPhotos[selectedPhotoIndex].src}
                  alt={filteredPhotos[selectedPhotoIndex].altText || filteredPhotos[selectedPhotoIndex].title}
                  className="max-w-full max-h-[60vh] rounded-2xl object-contain shadow-2xl"
                />
                <div className="mt-6 text-center">
                  {filteredPhotos[selectedPhotoIndex].menuCategory && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-1">
                      {filteredPhotos[selectedPhotoIndex].menuCategory}
                    </p>
                  )}
                  <p className="font-display text-[#F6EFE3] text-xl md:text-2xl font-black">
                    {filteredPhotos[selectedPhotoIndex].title}
                  </p>
                  {filteredPhotos[selectedPhotoIndex].menuDishName && (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => goToMenuItem(filteredPhotos[selectedPhotoIndex])}
                      className="mt-5 flex items-center gap-2 mx-auto bg-brand-accent hover:bg-brand-gold text-[#F6EFE3] font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full shadow-lg transition-colors"
                    >
                      View on Menu <ArrowRight size={14} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
