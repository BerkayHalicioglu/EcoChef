import { GraduationCap } from 'lucide-react';
import GlassCard from './GlassCard';
import { useI18n } from '../../context/I18nContext';

export default function Team() {
  const { t } = useI18n();
  return (
    <section id="team" className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <GlassCard>
          <GraduationCap className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold font-inter mb-2">{t.team.title}</h2>
          <p className="text-secondary font-semibold mb-4">{t.team.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t.team.desc}
          </p>
        </GlassCard>
      </div>
    </section>
  );
}
