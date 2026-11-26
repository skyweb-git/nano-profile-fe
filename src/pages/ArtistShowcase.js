import React from 'react';
import ShowcaseLayout from './ShowcaseLayout';

export default function ArtistShowcase() {
  return (
    <ShowcaseLayout
      title="Artist Profiles - Nano Profiles"
      description="Showcase your art portfolio, gallery, and creative links in one artist profile."
      headline={<>Your art.<br />One profile.</>}
      subtitle="Gallery, bio, and links — everything your audience needs to discover and follow your work."
      features={[
        { icon: 'photo_library', title: 'Art gallery', body: 'Show your portfolio in a clean visual gallery that loads fast.' },
        { icon: 'palette', title: 'Creative bio', body: 'Tell the story behind your practice in your own voice.' },
        { icon: 'link', title: 'Creator links', body: 'Connect shop, socials, and booking links from one page.' },
        { icon: 'share', title: 'Easy sharing', body: 'Share one artist link across bios and messages.' },
      ]}
      previewTitle="Example artist profile"
      iframeSrc={`${window.location.origin}/artist/mock-artist?mock=1`}
      ctaTitle="Go digital with your art"
      ctaBody="Create your artist profile and keep your gallery current everywhere."
    />
  );
}
