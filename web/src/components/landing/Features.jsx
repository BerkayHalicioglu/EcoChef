import { Camera, PenLine, WifiOff, CalendarDays, Flame, Target, Star, ShoppingCart, Globe } from 'lucide-react';
import GlassCard from './GlassCard';
import { useI18n } from '../../context/I18nContext';

const ICONS = [Camera, PenLine, WifiOff, CalendarDays, Flame, Target, Star, ShoppingCart, Globe];

export default function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{t.features.title}</h2>
        <p className="text-muted-foreground mt-3">{t.features.subtitle}</p>
      </div>
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {t.features.items.map((f, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={i} delay={i * 60} className="group hover:border-primary/30 hover:bg-primary/5 transition-colors">
              <div className="mb-3">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
