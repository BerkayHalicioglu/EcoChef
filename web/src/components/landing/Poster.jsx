import { useState } from 'react';
import { FileText, X, Download, ZoomIn } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export default function Poster() {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);

  const title    = locale === 'tr' ? 'Akademik Poster' : 'Research Poster';
  const subtitle = locale === 'tr'
    ? 'CENG 495/496 Senior Design Project posterini tam ekranda incele veya indir.'
    : 'View or download the CENG 495/496 Senior Design Project poster in full screen.';
  const btnView  = locale === 'tr' ? 'Posteri İncele' : 'View Poster';
  const btnDl    = locale === 'tr' ? 'İndir'          : 'Download';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between px-6 py-3 bg-background/80 backdrop-blur border-b border-border" onClick={e => e.stopPropagation()}>
            <span className="font-semibold text-sm text-foreground">EcoChef — {title}</span>
            <div className="flex items-center gap-3">
              <a
                href="/poster.pdf"
                download="EcoChef-Poster.pdf"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                {btnDl}
              </a>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden" onClick={e => e.stopPropagation()}>
            <iframe
              src="/poster.pdf"
              className="w-full h-full"
              title="EcoChef Research Poster"
            />
          </div>
        </div>
      )}

      <section className="py-20 px-6" id="poster">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <FileText className="w-4 h-4" />
            {title}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold font-inter mb-4">
            {locale === 'tr' ? 'Proje Posterimiz' : 'Our Project Poster'}
          </h2>
          <p className="text-muted-foreground mb-8">{subtitle}</p>

          <div
            className="relative group cursor-pointer mx-auto max-w-lg rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/30 bg-muted hover:border-primary/40 transition-all duration-300"
            onClick={() => setOpen(true)}
          >
            <iframe
              src="/poster.pdf"
              className="w-full h-64 pointer-events-none"
              title="poster-preview"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn className="w-10 h-10 text-white" />
              <span className="text-white font-semibold">{btnView}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ZoomIn className="w-4 h-4" />
              {btnView}
            </button>
            <a
              href="/poster.pdf"
              download="EcoChef-Poster.pdf"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              {btnDl}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
