import { useState } from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import { useI18n } from '../../context/I18nContext';

const TILTS   = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-1'];
const EMOJIS  = ['🏠', '📷', '🍽️', '📅', '🛒', '👤'];
const COLORS  = [
  'from-primary/25 via-muted to-primary/15',
  'from-yellow-400/25 via-muted to-yellow-400/10',
  'from-orange-400/20 via-muted to-orange-400/10',
  'from-blue-400/20 via-muted to-blue-400/10',
  'from-purple-400/20 via-muted to-purple-400/10',
  'from-pink-400/20 via-muted to-pink-400/10',
];
const IMAGES  = [
  '/screenshots/screen-0.png.jpeg',
  '/screenshots/screen-1.png.jpeg',
  '/screenshots/screen-2.png.jpeg',
  '/screenshots/screen-3.png.jpeg',
  '/screenshots/screen-4.png.jpeg',
  '/screenshots/screen-5.png.jpeg',
];

function Modal({ image, label, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl border-[3px] border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <img src={image} alt={label} className="max-h-[88vh] w-auto object-contain" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-lg leading-none hover:bg-black/80 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function PhoneCard({ label, desc, tilt, emoji, gradient, image, delay }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && image && <Modal image={image} label={label} onClose={() => setOpen(false)} />}

      <div
        className={`flex flex-col items-center gap-3 transition-all duration-700`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {/* Phone shell */}
        <div
          className={`relative w-[160px] h-[320px] md:w-[180px] md:h-[360px] rounded-[2.25rem] border-[3px] border-white/20 shadow-2xl shadow-black/50 overflow-hidden ${tilt} hover:rotate-0 transition-transform duration-500 bg-black ${image ? 'cursor-pointer' : ''}`}
          onClick={() => image && setOpen(true)}
        >
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-2 rounded-full bg-black/60 z-10" />

          {image ? (
            <>
              <img
                src={image}
                alt={label}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
              {/* click hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Tam ekran</span>
              </div>
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2`}>
              <span className="text-3xl">{emoji}</span>
              <span className="text-[10px] text-muted-foreground text-center px-3 leading-tight">{label}</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
    </>
  );
}

export default function Screenshots() {
  const { t } = useI18n();
  const [ref, visible] = useScrollAnimation();

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{t.screens.title}</h2>
        <p className="text-muted-foreground mt-3">{t.screens.subtitle}</p>
      </div>
      <div
        ref={ref}
        className={`max-w-5xl mx-auto flex flex-wrap justify-center gap-6 md:gap-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {t.screens.items.map((s, i) => (
          <PhoneCard
            key={i}
            label={s.label}
            desc={s.desc}
            tilt={TILTS[i]}
            emoji={EMOJIS[i]}
            gradient={COLORS[i]}
            image={IMAGES[i]}
            delay={i * 80}
          />
        ))}
      </div>
    </section>
  );
}
