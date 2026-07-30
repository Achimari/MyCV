import { Navbar } from "./components/Navbar";
import { GrainOverlay } from "./components/ui/GrainOverlay";
import { About } from "./sections/About";
import { StreamContent } from "./sections/StreamContent";
import { Schedule } from "./sections/Schedule";
import { Socials } from "./sections/Socials";
import { CommunityCTA } from "./sections/CommunityCTA";
import { Footer } from "./sections/Footer";

export function App() {
  return (
    <>
      <GrainOverlay />
      <Navbar />
      <main id="main-content">
        <About />
        <StreamContent />
        <Schedule />
        <Socials />
        <CommunityCTA />
      </main>
      <Footer />
    </>
  );
}

export default App;
