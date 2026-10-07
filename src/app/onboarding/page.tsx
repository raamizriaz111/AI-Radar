import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Radar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Onboarding · AI Radar',
  description: 'Set up your personal AI intelligence profile, interests, and goals.',
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Radar size={22} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Welcome to AI Radar
        </h1>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Tell us what you&apos;re curious about so we can highlight the AI news, tools, and stories that matter most to you.
        </p>
      </div>

      <OnboardingWizard />
    </div>
  );
}
