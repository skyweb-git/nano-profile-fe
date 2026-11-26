import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import '../components/home/MarketingSite.css';

const PROFILE_TYPES = [
  {
    to: '/founder-showcase',
    title: 'The Founder',
    detail: 'Company • Milestones • Co-founders',
    body: 'Share your venture story, traction, and team in one founder profile built for investors and partners.',
    icon: 'rocket_launch',
  },
  {
    to: '/company-showcase',
    title: 'Company Profile',
    detail: 'About • Services • Contact',
    body: 'Put your brand, services, website, and contact details in one polished company page.',
    icon: 'apartment',
  },
  {
    to: '/artist-showcase',
    title: 'The Artist',
    detail: 'Gallery • Bio • Portfolio',
    body: 'Showcase your gallery, creative bio, and links so audiences can discover and follow your work.',
    icon: 'palette',
  },
  {
    to: '/professional-showcase',
    title: 'General Profile',
    detail: 'Bio • Links • Smart Contact',
    body: 'A clean link-in-bio style profile for professionals who need bio, links, and contact in one place.',
    icon: 'person',
  },
  {
    to: '/restaurant-showcase',
    title: 'The Restaurant',
    detail: 'Menu • Story • Reserve a table',
    body: 'Share your menu, restaurant story, and booking links in one guest-ready profile.',
    icon: 'restaurant',
  },
];

export default function Profiles() {
  return (
    <>
      <Helmet>
        <title>Profiles - Nano Profiles</title>
        <meta
          name="description"
          content="Explore all Nano Profiles types in one place: founder, company, artist, general, and restaurant."
        />
      </Helmet>

      <main className="landing-page-container mkt-page">
        <HomeNavbar />

        <section className="mkt-showcase-hero">
          <h1>Profiles</h1>
          <p>
            Everything Nano Profiles can be — founder, company, artist, general, and restaurant — explained in one
            place. Pick the type that fits you, then create free.
          </p>
          <div className="mkt-btn-row">
            <Link to="/login" className="mkt-btn-primary">Create free</Link>
          </div>
        </section>

        <section className="mkt-section mkt-section--cream" aria-labelledby="all-profiles-title">
          <div className="mkt-section-inner">
            <div className="mkt-section-head center">
              <h2 id="all-profiles-title">All profile types</h2>
              <p>One product. Five ways to show up. Open any type to see an example and get started.</p>
            </div>

            <div className="mkt-type-list">
              {PROFILE_TYPES.map((t) => (
                <Link key={t.to} to={t.to} className="mkt-type-item">
                  <div className="mkt-type-icon">
                    <span className="material-symbols-outlined" aria-hidden="true">{t.icon}</span>
                  </div>
                  <div className="mkt-type-copy">
                    <h3>{t.title}</h3>
                    <p>{t.detail}</p>
                    <p style={{ marginTop: 6 }}>{t.body}</p>
                  </div>
                  <span className="mkt-type-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-cta-band">
          <h2>Ready to claim yours?</h2>
          <p>Create your Nano Profiles link and keep your story, work, and contact current everywhere.</p>
          <div className="mkt-btn-row">
            <Link to="/login" className="mkt-btn-light">Get started free</Link>
          </div>
        </section>

        <HomeFooter />
      </main>
    </>
  );
}
