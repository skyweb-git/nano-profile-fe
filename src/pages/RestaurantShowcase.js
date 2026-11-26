import React from 'react';
import ShowcaseLayout from './ShowcaseLayout';

export default function RestaurantShowcase() {
  return (
    <ShowcaseLayout
      title="Restaurant Profiles - Nano Profiles"
      description="Share your menu, story, reservations, and restaurant links in one polished profile."
      headline={<>Your menu.<br />One profile.</>}
      subtitle="Digital menus, reservations, and your restaurant story — ready whenever guests want them."
      features={[
        { icon: 'menu_book', title: 'Digital menu', body: 'Keep your menu easy to open and always current.' },
        { icon: 'restaurant', title: 'Restaurant story', body: 'Share the vibe, cuisine, and what makes you different.' },
        { icon: 'event', title: 'Reservations', body: 'Point guests to booking or contact in one tap.' },
        { icon: 'share', title: 'Easy sharing', body: 'Share one restaurant link across maps, bios, and chats.' },
      ]}
      previewTitle="Example restaurant profile"
      iframeSrc={`${window.location.origin}/link/mock-restaurant?mock=1`}
      ctaTitle="Go digital with your restaurant"
      ctaBody="Create your restaurant profile and keep menu and contact details current."
    />
  );
}
