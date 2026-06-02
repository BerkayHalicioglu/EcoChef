import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import HowItWorks from './components/landing/HowItWorks';
import Features from './components/landing/Features';
import Markets from './components/landing/Markets';
import TechArchitecture from './components/landing/TechArchitecture';
import Diagrams from './components/landing/Diagrams';
import Screenshots from './components/landing/Screenshots';
import Stats from './components/landing/Stats';
import Team from './components/landing/Team';
import Footer from './components/landing/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Markets />
      <TechArchitecture />
      <Diagrams />
      <Screenshots />
      <Stats />
      <Team />
      <Footer />
    </div>
  );
}
