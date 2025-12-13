'use client';

import CallToAction from '@/components/home/CallToAction';
import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import HowItWorks from '@/components/home/HowItWorks';
import Plans from '@/components/home/PlansSansSimulation';
import CompetitorComparison from '@/components/home/PropositionValeur';
import React from 'react';

export default function HomePage() {
  return (
    <div className="bg-[#f9ffc6]/80">
      <Plans />
      <Comparison />
      <FAQ />
      <HowItWorks />
      <CompetitorComparison />
      <CallToAction />
    </div>
  );
}
