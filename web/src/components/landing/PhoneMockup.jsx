export default function PhoneMockup({ label, className = '', tilt = '' }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`relative w-[160px] h-[320px] md:w-[200px] md:h-[400px] rounded-[2rem] border-2 border-primary/30 bg-gradient-to-br from-primary/20 via-muted to-primary/10 shadow-lg shadow-primary/10 overflow-hidden ${tilt}`}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-border" />
        <div className="absolute inset-4 top-8 rounded-xl bg-background/40 backdrop-blur-sm flex items-center justify-center">
          <span className="text-xs text-muted-foreground text-center px-2">{label}</span>
        </div>
      </div>
      {label && <p className="text-xs text-muted-foreground text-center">{label}</p>}
    </div>
  );
}