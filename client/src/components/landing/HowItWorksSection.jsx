import { Camera, Sparkles, CheckCircle } from 'lucide-react'

const steps = [
  {
    id: 'step-upload',
    number: '01',
    icon: Camera,
    title: 'Photograph your wardrobe',
    description:
      'Take photos of the clothes you already own — single shots or a batch. StyleForge automatically tags each item by type, color, pattern, and occasion.',
    chips: ['Top', 'Shirt', 'Smart Casual'],
  },
  {
    id: 'step-occasion',
    number: '02',
    icon: Sparkles,
    title: 'Pick your occasion',
    description:
      'Office meeting? Wedding? Casual weekend? Choose from 18 occasions across 6 categories, or type your own. Add a weather context in one tap.',
    chips: ['Business Casual', 'Summer'],
  },
  {
    id: 'step-outfit',
    number: '03',
    icon: CheckCircle,
    title: 'Get your outfit',
    description:
      'StyleForge returns 2–3 complete combinations pulled from your own closet — guaranteed not to repeat a look you\'ve worn in the last 30 days.',
    chips: ['2–3 Options', 'No Repeats · 30d'],
  },
]

function StepCard({ step, index }) {
  const Icon = step.icon
  const isLast = index === steps.length - 1

  return (
    <div className="relative flex flex-col" id={step.id}>
      {/* Connecting line — shown between cards on desktop, vertical on mobile */}
      {!isLast && (
        <>
          {/* Desktop: horizontal line to the right of the card — rendered via grid gap, hidden here */}
          {/* Mobile: vertical line below the step number */}
          <div
            className="lg:hidden absolute left-[27px] top-[56px] w-px bg-gradient-to-b from-line to-transparent h-full z-0"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 flex flex-row lg:flex-col gap-5 lg:gap-0">
        {/* Step number + icon — stacked on desktop, side-by-side on mobile */}
        <div className="flex-shrink-0 flex flex-col items-center lg:items-start lg:flex-row lg:gap-3 lg:mb-6">
          <div className="w-[54px] h-[54px] rounded-full bg-surface border border-line flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon size={22} strokeWidth={1.5} className="text-indigo" />
          </div>
          {/* Step number chip — garment-tag style */}
          <span
            className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mt-2 lg:mt-0 lg:self-end lg:mb-1.5"
            aria-hidden="true"
          >
            {step.number}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 pb-10 lg:pb-0">
          <h3 className="text-h2 font-display text-ink mb-3">{step.title}</h3>
          <p className="text-body text-ink/65 leading-relaxed mb-4">{step.description}</p>

          {/* Garment-tag chips illustrating each step */}
          <div className="flex flex-wrap gap-2" aria-hidden="true">
            {step.chips.map((chip) => (
              <span
                key={chip}
                className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-tag border border-line text-ink/55 bg-surface"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorksSection() {
  return (
    <section
      className="bg-canvas py-24 sm:py-32 px-6 sm:px-10 lg:px-16 xl:px-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-16 lg:mb-20 max-w-lg">
          <span className="chip mb-4 inline-flex">How it works</span>
          <h2
            id="how-it-works-heading"
            className="text-display-l font-display text-ink leading-tight"
          >
            From closet to complete look — in three steps.
          </h2>
        </div>

        {/* 3-column desktop / vertical list mobile */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-12">
          {/* Desktop: horizontal connector line across all 3 columns */}
          <div
            className="hidden lg:block absolute top-[27px] left-[27px] right-[27px] h-px bg-gradient-to-r from-line via-line to-transparent z-0"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <StepCard key={step.id} step={step} index={i} />
          ))}
        </div>

        {/* Section-level CTA */}
        <div className="mt-16 pt-16 border-t border-line">
          <p className="text-body text-ink/60 mb-1">
            Ready to see it with your wardrobe?
          </p>
          <a
            href="/auth"
            id="hiw-signup-cta"
            className="inline-flex items-center gap-2 text-body font-medium text-indigo hover:text-indigo/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded-sm"
          >
            Get started free →
          </a>
        </div>
      </div>
    </section>
  )
}
