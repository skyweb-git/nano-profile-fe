import React from 'react';
import ShowcaseLayout from './ShowcaseLayout';

export default function FounderShowcase() {
  return (
    <ShowcaseLayout
      title="Founder Profiles - Nano Profiles"
      description="Share your venture story, milestones, co-founders, and contact in one founder profile."
      headline={<>Your venture.<br />One profile.</>}
      subtitle="Company story, milestones, co-founders, and contact — everything investors and partners need in one place."
      features={[
        { icon: 'apartment', title: 'Company story', body: 'Introduce your venture, founding year, and what you are building.' },
        { icon: 'insights', title: 'Milestones', body: 'Highlight traction like funding, users, and product wins fast.' },
        { icon: 'group', title: 'Co-founders', body: 'Show the team behind the company with clear roles.' },
        { icon: 'share', title: 'Easy sharing', body: 'Share one founder link across decks, bios, and messages.' },
      ]}
      previewTitle="Example founder profile"
      iframeSrc={`${window.location.origin}/founder/mock-founder?mock=1`}
      ctaTitle="Go digital with your venture"
      ctaBody="Create your founder profile and keep every shared link current."
    />
  );
}
