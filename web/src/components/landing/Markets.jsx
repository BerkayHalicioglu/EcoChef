import useScrollAnimation from '../../hooks/useScrollAnimation';
import { useI18n } from '../../context/I18nContext';

const MARKET_META = {
  Migros:   { logo: '/markets/migros.png',   border: 'border-orange-500/30', bg: 'bg-white/5' },
  Getir:    { logo: '/markets/getir.png',    border: 'border-purple-500/30', bg: 'bg-white/5' },
  Trendyol: { logo: '/markets/trendyol.png', border: 'border-orange-400/30', bg: 'bg-white/5' },
  A101:     { logo: '/markets/a101.png',     border: 'border-blue-500/30',    bg: 'bg-white/5' },
};

export default function Markets() {
  const { t } = useI18n();
  const [ref, visible] = useScrollAnimation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{t.markets.title}</h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t.markets.subtitle}</p>
      </div>

      <div
        ref={ref}
        className={`max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {t.markets.items.map((name, i) => {
          const m = MARKET_META[name] ?? { logo: null, border: 'border-primary/30', bg: 'bg-white/5' };
          return (
            <div
              key={i}
              style={{ transitionDelay: `${i * 80}ms` }}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border ${m.border} ${m.bg} py-6 px-4 hover:scale-105 transition-transform duration-300`}
            >
              {m.logo
                ? <img src={m.logo} alt={name} className="h-12 w-auto object-contain" />
                : <span className="text-3xl">🛒</span>
              }
              <span className="font-semibold text-xs text-muted-foreground">{name}</span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        🔗 {t.markets.items.join(' · ')}
      </p>
    </section>
  );
}
