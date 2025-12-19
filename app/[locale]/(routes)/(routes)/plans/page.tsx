'use client';

import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import Plans from '@/components/home/PlansSansSimulation';
import CompetitorComparison from '@/components/home/PropositionValeur';
import React from 'react';

export default function HomePage() {
  return (
    <div className="bg-[#f9ffc6]/80">
      <Plans withTrial={false} />
      <Comparison />
      <FAQ />
      {/* <HowItWorks /> */}
      <CompetitorComparison />
      {/* <CallToAction /> */}
    </div>
  );
}
