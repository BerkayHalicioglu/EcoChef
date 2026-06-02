import { Camera, Cpu, ChefHat } from 'lucide-react';
import GlassCard from './GlassCard';
import { useI18n } from '../../context/I18nContext';

const ICONS = [Camera, Cpu, ChefHat];

export default function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{t.howItWorks.title}</h2>
        <p className="text-muted-foreground mt-3">{t.howItWorks.subtitle}</p>
      </div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {t.howItWorks.steps.map((s, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={i} delay={i * 120} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-xs text-primary font-bold mb-2">{t.howItWorks.step} {i + 1}</div>
              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
