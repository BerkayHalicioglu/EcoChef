import { Leaf } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="py-10 px-6 border-t border-border text-center">
      <div className="flex items-center justify-center gap-2 text-primary font-bold text-lg mb-2">
        <Leaf className="w-5 h-5" /> EcoChef
      </div>
      <p className="text-xs text-muted-foreground">{t.footer.tagline}</p>
      <p className="text-xs text-muted-foreground mt-3">{t.footer.copy}</p>
    </footer>
  );
}
