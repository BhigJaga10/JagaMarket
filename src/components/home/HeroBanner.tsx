import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  onOpenRequestModal: () => void;
  onExploreCategory: (category: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenRequestModal,
  onExploreCategory
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Nigeria’s Direct Multi-Vendor Marketplace',
      subtitle: 'From Alaba International to Balogun Market & Kano produce — discover thousands of verified products with manual bank transfer protection.',
      badge: '🔥 Nationwide 36 States Delivery',
      bgGradient: 'from-emerald-950 via-emerald-900 to-slate-900',
      actionText: 'Shop Ankara & Senator Styles',
      actionCategory: 'Fashion & Ankara',
      tagline: 'Ticket ID: JAG-2026-XXXXXX',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Alaba Solar Systems & Genuine Mobile Tech',
      subtitle: 'Pure sine wave inverters, lithium/gel batteries, smart Android TVs & original warranty electronics from verified Lagos importers.',
      badge: '⚡ Power Backup & Inverter Deals',
      bgGradient: 'from-amber-950 via-slate-900 to-emerald-950',
      actionText: 'Explore Solar & Inverters',
      actionCategory: 'Electronics & Solar',
      tagline: 'Verified CAC & RC Merchants',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Can’t Find What You Need? We’ll Source It!',
      subtitle: 'Submit any product description, photo, or target budget. JAGA agents source it from verified wholesalers and send you an official quotation.',
      badge: '✨ Bespoke Sourcing Service',
      bgGradient: 'from-slate-900 via-emerald-950 to-amber-950',
      actionText: 'Submit Product Sourcing Request',
      actionCategory: '',
      isCustomRequest: true,
      tagline: 'Requests: JAG-REQ-2026-XXXX',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-2xl mx-4 my-4 border border-slate-800 shadow-xl">
      <div className={`p-6 sm:p-10 bg-gradient-to-r ${slide.bgGradient} text-white flex flex-col md:flex-row items-center justify-between gap-8 min-h-[300px] transition-all duration-500`}>
        <div className="max-w-xl z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/15">
            <Zap className="w-3.5 h-3.5" />
            <span>{slide.badge}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight mb-3">
            {slide.title}
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            {slide.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {slide.isCustomRequest ? (
              <button
                onClick={onOpenRequestModal}
                className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{slide.actionText}</span>
              </button>
            ) : (
              <button
                onClick={() => onExploreCategory(slide.actionCategory)}
                className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <span>{slide.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenRequestModal}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition"
            >
              Request Custom Item
            </button>
          </div>
        </div>

        {/* Visual Preview */}
        <div className="relative w-full md:w-80 h-52 sm:h-64 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover transition duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <Shield className="w-4 h-4" />
              <span>{slide.tagline}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Arrows */}
      <div className="absolute bottom-3 left-6 flex items-center gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentSlide ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-3 hidden sm:flex flex-col gap-2 z-20">
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
