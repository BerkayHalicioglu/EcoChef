import { Smartphone, Server, Brain } from 'lucide-react';
import GlassCard from './GlassCard';
import { useI18n } from '../../context/I18nContext';

const ICONS  = [Smartphone, Server, Brain];
const COLORS = ['text-green-400', 'text-emerald-400', 'text-lime-400'];

export default function TechArchitecture() {
  const { t } = useI18n();
  return (
    <section id="tech" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-extrabold font-inter">{t.tech.title}</h2>
        <p className="text-muted-foreground mt-3">{t.tech.subtitle}</p>
      </div>
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {t.tech.layers.map((l, i) => {
          const Icon = ICONS[i];
          return (
            <GlassCard key={i} delay={i * 120}>
              <div className="flex items-center gap-3 mb-5">
                <Icon className={`w-6 h-6 ${COLORS[i]}`} />
                <h3 className="font-bold text-lg">{l.title}</h3>
              </div>
              <ul className="space-y-2.5">
                {l.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
