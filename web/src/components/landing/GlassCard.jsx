import useScrollAnimation from '../../hooks/useScrollAnimation';

export default function GlassCard({ children, className = '', delay = 0 }) {
  const [ref, visible] = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}