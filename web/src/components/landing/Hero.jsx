import { useState } from 'react';
import { ZoomIn, X, Download } from 'lucide-react';
import FloatingEmoji from './FloatingEmoji';
import { useI18n } from '../../context/I18nContext';

function PosterModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur border-b border-border" onClick={e => e.stopPropagation()}>
        <span className="font-semibold text-sm text-foreground">EcoChef — Research Poster</span>
        <div className="flex items-center gap-3">
          <a
            href="/poster.pdf"
            download="EcoChef-Poster.pdf"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            İndir
          </a>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden" onClick={e => e.stopPropagation()}>
        <iframe src="/poster.pdf" className="w-full h-full" title="EcoChef Research Poster" />
      </div>
    </div>
  );
}

export default function Hero() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <PosterModal onClose={() => setOpen(false)} />}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <FloatingEmoji />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
              {t.hero.badge}
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight font-inter">
              Eco<span className="text-primary">Chef</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary font-semibold mt-3">
              {t.hero.subtitle}
            </p>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {t.hero.desc}
            </p>
            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              <a href="#how-it-works" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all">
                {t.hero.learnMore}
              </a>
              <a href="#tech" className="px-6 py-3 rounded-xl border border-primary/40 text-primary font-semibold text-sm hover:bg-primary/10 transition-all">
                {t.hero.watchDemo}
              </a>
            </div>
          </div>

          {/* Poster preview */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div
              className="relative group cursor-pointer w-[220px] md:w-[280px] rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500"
              onClick={() => setOpen(true)}
            >
              <img
                src="/poster-preview.jpg.jpeg"
                alt="EcoChef Research Poster"
                className="w-full h-auto object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ZoomIn className="w-10 h-10 text-white" />
                <span className="text-white text-sm font-semibold">
                  {locale === 'tr' ? 'Posteri İncele' : 'View Poster'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'tr' ? 'Akademik Poster · CENG 495/496' : 'Research Poster · CENG 495/496'}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
