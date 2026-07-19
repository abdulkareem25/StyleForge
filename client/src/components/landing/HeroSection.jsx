import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Tag, Layers } from 'lucide-react'
import wardrobeItems from '../../assets/images/wardrobe-items.png'
import outfitComposed from '../../assets/images/outfit-composed.png'

// Garment-tag chip — the signature UI element per Frontend Spec §2
function GarmentChip({ label, selected = false }) {
  return (
    <span
      className={`text-micro px-2 py-0.5 rounded-tag border leading-none ${
        selected
          ? 'bg-indigo text-white border-indigo'
          : 'bg-surface/90 text-ink border-line'
      }`}
    >
      {label}
    </span>
  )
}

// Individual clothing item card with garment-tag chip overlays
function WardrobeCard({ chips = [], rotation = 0, zIndex = 0, offsetX = 0, offsetY = 0, className = '' }) {
  return (
    <div
      className={`absolute bg-surface rounded-card border border-line overflow-hidden shadow-lift ${className}`}
      style={{
        transform: `rotate(${rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
        zIndex,
      }}
      aria-hidden="true"
    >
      <div className="flex flex-wrap gap-1 absolute bottom-2 left-2 z-10">
        {chips.map((c) => (
          <GarmentChip key={c} label={c} />
        ))}
      </div>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen bg-canvas flex flex-col lg:flex-row items-center pt-16 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Subtle grid texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, var(--color-ink, #211F1C) 0px, var(--color-ink, #211F1C) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, var(--color-ink, #211F1C) 0px, var(--color-ink, #211F1C) 1px, transparent 1px, transparent 40px)',
        }}
        aria-hidden="true"
      />

      {/* ── Left column: headline + CTA ─────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-16 lg:pt-0 pb-8 lg:pb-0">
        {/* Eyebrow chip */}
        <div className="flex items-center gap-2 mb-6">
          <span className="chip">
            <Sparkles size={11} strokeWidth={1.5} className="mr-1.5 text-indigo" />
            AI-Powered Styling
          </span>
        </div>

        {/* Hero headline — Display XL */}
        <h1
          id="hero-heading"
          className="text-display-xl font-display text-ink max-w-[540px] leading-[1.05]"
        >
          Your wardrobe,{' '}
          <span
            className="relative inline-block"
            style={{
              background: 'linear-gradient(135deg, var(--color-indigo, #2B3A67) 30%, var(--color-indigo-light, #4A5D9A))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            made smarter.
          </span>
        </h1>

        {/* Subheadline — Body Large */}
        <p className="text-body-lg text-ink/65 mt-5 max-w-[460px] leading-relaxed">
          Photograph your clothes once. StyleForge builds your digital wardrobe and generates complete, occasion-ready outfits — no repeated looks for 30 days.
        </p>

        {/* Primary CTA group */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-9">
          <Link
            to="/auth"
            id="hero-signup-cta"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-body font-medium text-white bg-indigo rounded-card hover:bg-indigo/90 active:scale-[0.98] transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
          >
            Get Started — it's free
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
          <Link
            to="/auth"
            id="hero-login-cta"
            className="inline-flex items-center gap-2 px-5 py-3.5 text-body font-medium text-ink border border-ink/20 rounded-card hover:bg-ink/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
          >
            Log In
          </Link>
        </div>

        {/* Trust signal — minimal, factual */}
        <p className="text-caption text-ink/45 mt-6 flex items-center gap-1.5">
          <Tag size={12} strokeWidth={1.5} />
          AI tagging · 30-day variety guarantee · Free to start
        </p>
      </div>

      {/* ── Right column: visual transformation ─────────────────────── */}
      <div
        className="relative flex-1 flex items-center justify-center w-full lg:w-auto px-6 sm:px-10 pb-16 lg:pb-0 lg:min-h-screen"
        aria-label="StyleForge transforms your wardrobe photos into a complete outfit"
      >
        {/* The visual "thesis": two panels connected by an arrow */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 w-full max-w-xl lg:max-w-none lg:w-full lg:max-w-2xl">

          {/* ── Before: scattered wardrobe items ── */}
          <div className="relative flex-1 w-full">
            <div className="relative bg-surface rounded-modal border border-line overflow-hidden aspect-[4/5] w-full max-w-xs mx-auto shadow-lift">
              <img
                src={wardrobeItems}
                alt="Your wardrobe items — a navy shirt, indigo jeans, charcoal blazer, and white tee laid flat"
                className="w-full h-full object-cover"
              />
              {/* Chip overlays communicating AI tagging */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5" aria-hidden="true">
                <GarmentChip label="Top" />
                <GarmentChip label="Navy · Oxford" />
                <GarmentChip label="Smart Casual" />
              </div>
              <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5" aria-hidden="true">
                <GarmentChip label="Bottom" />
                <GarmentChip label="Indigo · Slim" />
              </div>
              {/* Panel label */}
              <div className="absolute top-3 right-3" aria-hidden="true">
                <span className="bg-ink/70 text-white text-micro font-mono px-2 py-1 rounded-tag">
                  Your Closet
                </span>
              </div>
            </div>
          </div>

          {/* ── Arrow / transformation indicator ── */}
          <div className="flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* Desktop: horizontal arrow */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-px bg-indigo/40" />
                <div className="w-8 h-8 rounded-full bg-indigo/10 border border-indigo/30 flex items-center justify-center">
                  <Layers size={14} strokeWidth={1.5} className="text-indigo" />
                </div>
                <div className="w-8 h-px bg-indigo/40" />
              </div>
              {/* Mobile: vertical arrow */}
              <div className="sm:hidden flex flex-col items-center gap-2">
                <div className="h-6 w-px bg-indigo/40" />
                <div className="w-8 h-8 rounded-full bg-indigo/10 border border-indigo/30 flex items-center justify-center">
                  <Layers size={14} strokeWidth={1.5} className="text-indigo" />
                </div>
                <div className="h-6 w-px bg-indigo/40" />
              </div>
            </div>
          </div>

          {/* ── After: composed outfit ── */}
          <div className="relative flex-1 w-full">
            <div className="relative bg-surface rounded-modal border border-line overflow-hidden aspect-[4/5] w-full max-w-xs mx-auto shadow-lift ring-2 ring-indigo/20">
              <img
                src={outfitComposed}
                alt="A complete outfit — navy oxford shirt, indigo jeans, and brown Derby shoes arranged as a styled look"
                className="w-full h-full object-cover"
              />
              {/* Occasion chip — selected state */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5" aria-hidden="true">
                <GarmentChip label="Smart Casual" selected />
                <GarmentChip label="Office Ready" selected />
              </div>
              {/* Outfit panel label */}
              <div className="absolute top-3 right-3" aria-hidden="true">
                <span className="bg-indigo text-white text-micro font-mono px-2 py-1 rounded-tag">
                  Your Outfit
                </span>
              </div>
              {/* Freshness badge */}
              <div className="absolute bottom-3 left-3 right-3" aria-hidden="true">
                <div className="bg-surface/95 backdrop-blur-sm border border-line rounded-tag px-3 py-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brass flex-shrink-0" />
                  <span className="text-micro font-mono text-ink/70">
                    Fresh look · Not worn in 30 days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce" aria-hidden="true">
        <div className="w-px h-8 bg-gradient-to-b from-ink/0 to-ink/25 rounded-full" />
        <span className="text-tag text-ink/30 uppercase tracking-widest font-mono">scroll</span>
      </div>
    </section>
  )
}
