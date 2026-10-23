"use client";

import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Services from "@/components/landing/Services";
import PlatformPreview from "@/components/landing/PlatformPreview";
import Pricing from "@/components/landing/Pricing";
import Journey from "@/components/landing/Journey";
import Categories from "@/components/landing/Categories";
import ShippingCompare from "@/components/landing/ShippingCompare";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Journey />
      <Services />
      <Categories />
      <PlatformPreview />
      <ShippingCompare />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
