import React from 'react';
import ShowcaseLayout from './ShowcaseLayout';

export default function ProfessionalShowcase() {
  return (
    <ShowcaseLayout
      title="General Profiles - Nano Profiles"
      description="Share your bio, social links, portfolio, and contact details in one general profile."
      headline={<>Your profile.<br />One link.</>}
      subtitle="Bio, links, socials, and contact — everything clients and collaborators need in one place."
      features={[
        { icon: 'person', title: 'Digital bio', body: 'Introduce yourself and your work with a polished short story.' },
        { icon: 'hub', title: 'Social connections', body: 'Connect LinkedIn, Instagram, X, and personal sites together.' },
        { icon: 'call', title: 'Quick contact', body: 'Make it easy to email, call, or message you directly.' },
        { icon: 'share', title: 'Easy sharing', body: 'Share one professional link across platforms.' },
      ]}
      previewTitle="Example general profile"
      iframeSrc={`${window.location.origin}/link/mock-professional?mock=1`}
      ctaTitle="Go digital with your identity"
      ctaBody="Create your general profile and keep every shared link up to date."
    />
  );
}
