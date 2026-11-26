import React from 'react';
import ShowcaseLayout from './ShowcaseLayout';

export default function CompanyShowcase() {
  return (
    <ShowcaseLayout
      title="Company Profiles - Nano Profiles"
      description="Share your company story, services, website, and contact in one polished company profile."
      headline={<>Your company.<br />One profile.</>}
      subtitle="About, services, website, and contact — everything clients and partners need from your brand."
      features={[
        { icon: 'business', title: 'Brand story', body: 'Introduce your company mission and what you deliver.' },
        { icon: 'handshake', title: 'Services', body: 'Make it obvious what you offer in a few clean lines.' },
        { icon: 'link', title: 'Website & links', body: 'Connect site, socials, and key pages from one identity.' },
        { icon: 'call', title: 'Quick contact', body: 'Let people reach your business without digging around.' },
      ]}
      previewTitle="Example company profile"
      iframeSrc={`${window.location.origin}/company/mock-company?mock=1`}
      ctaTitle="Go digital with your company"
      ctaBody="Create your company profile and share one always-current brand link."
    />
  );
}
