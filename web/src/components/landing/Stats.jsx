import useScrollAnimation from '../../hooks/useScrollAnimation';
import { useI18n } from '../../context/I18nContext';

export default function Stats() {
  const { t } = useI18n();
  const [ref, visible] = useScrollAnimation();
  return (
    <section ref={ref} className="py-16 px-6 bg-primary/10 border-y border-primary/20">
      <div className={`max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {t.stats.map((s, i) => (
          <div key={i}>
            <div className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</div>
            <div className="font-semibold mt-1">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
