'use client';

import React from 'react';

import HowItWorks from './components/HowItWorks';
import Plans from './components/Plans';
import ComparisonFAQ from './components/ComparisonFAQ';
import PropositionValeur from './components/PropositionValeur';
import HeroSection from './components/HeroSection';
import CallToAction from './components/CallToAction';

export default function HomePage() {
  return (
    <div className="bg-[#f9ffc6]/80">
      <HeroSection />
      <HowItWorks />
      <Plans />
      <ComparisonFAQ />
      <PropositionValeur />
      <CallToAction />
    </div>
  );
}
