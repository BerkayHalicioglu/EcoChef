import { useState, useEffect } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

function FlagTR() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className="w-6 h-4 rounded-sm">
      <rect width="30" height="20" fill="#E30A17"/>
      <circle cx="12" cy="10" r="5" fill="white"/>
      <circle cx="13.5" cy="10" r="4" fill="#E30A17"/>
      <polygon points="18,10 22.5,8.5 21,13 21,7 22.5,11.5" fill="white"/>
    </svg>
  );
}

function FlagGB() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-6 h-4 rounded-sm">
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="white" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 V30 M0,15 H60" stroke="white" strokeWidth="10"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  );
}

export default function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { label: t.navbar.features,    href: '#features' },
    { label: t.navbar.howItWorks,  href: '#how-it-works' },
    { label: t.navbar.tech,        href: '#tech' },
    { label: locale === 'en' ? '🗺️ Diagrams' : '🗺️ Diyagramlar', href: '#diagrams' },
    { label: t.navbar.team,        href: '#team' },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-inter ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Leaf className="w-6 h-6" />
          EcoChef
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <div className="flex items-center rounded-full border border-primary/30 overflow-hidden">
            {[{ code: 'tr', Flag: FlagTR }, { code: 'en', Flag: FlagGB }].map(({ code, Flag }) => (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={`px-2.5 py-1.5 transition-all ${locale === code ? 'bg-primary' : 'hover:bg-primary/10'}`}
              >
                <Flag />
              </button>
            ))}
          </div>
        </div>

        <div className="md:hidden flex items-center gap-3">
          <div className="flex items-center rounded-full border border-primary/30 overflow-hidden">
            {[{ code: 'tr', Flag: FlagTR }, { code: 'en', Flag: FlagGB }].map(({ code, Flag }) => (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={`px-2.5 py-1 transition-all ${locale === code ? 'bg-primary' : 'hover:bg-primary/10'}`}
              >
                <Flag />
              </button>
            ))}
          </div>
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border px-6 pb-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
