import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Radar,
  Shield,
  Newspaper,
  TrendingUp,
  Zap,
  GraduationCap,
  Briefcase,
  Bot,
  Wrench,
  ArrowRight,
  CheckCircle,
  Globe,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome · AI Radar',
  description: 'Stay up to date on everything happening in AI — explained in plain English, updated daily.',
};

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Radar size={18} />
            </div>
            <span className="text-base font-semibold tracking-wide">AI Radar</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Zap size={12} />
            <span>Updated daily with real news</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Keep up with AI — without needing a tech degree
          </h1>

          <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
            AI is changing the world fast. AI Radar monitors what&apos;s happening every day — new tools,
            new breakthroughs, new companies — and explains it all in plain English so anyone can understand.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Create Free Account <ArrowRight size={14} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              See What&apos;s Happening Today
            </Link>
          </div>
        </div>
      </section>

      {/* What is AI Radar? */}
      <section className="border-t border-border bg-card/30 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-xl font-bold sm:text-2xl">What is AI Radar?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
              Think of it as your daily newspaper — but only about artificial intelligence,
              and written so that anyone can understand it.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Globe size={18} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Real News Every Day</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We automatically gather AI news from trusted sources like research labs, universities, and tech companies.
                Nothing is invented or made up — every story links back to the original.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap size={18} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">Explained Simply</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Technical AI news is often written for experts. We use AI to rewrite it in plain English —
                so you understand what it means without needing a computer science background.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Clock size={18} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">5 Minutes a Day</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Read the daily briefing in 5 minutes and know everything important that happened in AI.
                No doom-scrolling, no missing the big story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What AI Radar Covers */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-xl font-bold sm:text-2xl">What We Cover</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Eight sections, all explained in plain language you don&apos;t need to be a tech expert to understand.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Newspaper,
                title: 'Latest AI News',
                desc: 'What happened today in AI — company launches, big announcements, and important stories from around the world.',
              },
              {
                icon: Wrench,
                title: 'New AI Tools',
                desc: 'Useful tools powered by AI that you can actually try — for writing, images, music, coding, and more.',
              },
              {
                icon: Bot,
                title: 'AI That Writes Code',
                desc: "AI assistants that help programmers write software faster. You'll hear about these a lot if you work in tech.",
              },
              {
                icon: TrendingUp,
                title: "What's Growing",
                desc: "Topics that keep coming up everywhere at once — a sign that something important is happening in that area.",
              },
              {
                icon: GraduationCap,
                title: 'Career & Learning',
                desc: 'Which skills are in demand, what to learn next, and how AI is changing jobs across different industries.',
              },
              {
                icon: Briefcase,
                title: 'Business Ideas',
                desc: 'Opportunities created by new AI technology — what problems people are solving and what businesses are being built.',
              },
              {
                icon: Shield,
                title: 'Safety & Rules',
                desc: 'How governments and companies are making rules about AI — what is and isn\'t allowed, and why it matters.',
              },
              {
                icon: Zap,
                title: 'Daily Briefing',
                desc: 'A 5-minute summary of the most important things that happened in AI today, written in plain English.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon size={14} />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Honesty Section */}
      <section className="border-t border-border bg-card/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Shield size={20} />
          </div>
          <h2 className="text-xl font-bold sm:text-2xl">We Never Make Things Up</h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every story on AI Radar links back to its original source. When AI writes a summary, we clearly label it
            as AI-generated so you always know what&apos;s from the source and what&apos;s our interpretation.
            Your data is private and is never sold.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" /> Every story links to the original source
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" /> AI summaries are clearly labeled as such
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-400" /> Your data is private and never sold
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-4 py-16 sm:px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-xl font-bold sm:text-2xl mb-3">Ready to stay informed?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Join AI Radar for free. No credit card needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create Free Account <ArrowRight size={14} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Browse Without Signing Up
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AI Radar · Keeping everyone informed about AI</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
