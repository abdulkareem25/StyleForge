import Navbar from '../components/landing/Navbar'
import HeroSection from '../components/landing/HeroSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import Footer from '../components/landing/Footer'

/**
 * LAND-01 — Public Landing Page
 *
 * Unauthenticated entry point. Single-scroll, Canvas background.
 * Sections: Navbar · Hero · HowItWorks · Footer
 * No testimonials / social proof (per Frontend Spec §3).
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  )
}
