import React from 'react';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeHero from '../components/home/HomeHero';
import HomeAbout from '../components/home/HomeAbout';
import HomeJumpstart from '../components/home/HomeJumpstart';
import HomeContact from '../components/home/HomeContact';
import HomeFooter from '../components/home/HomeFooter';
import '../components/home/MarketingSite.css';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Nano Profiles — A profile built for you</title>
        <meta
          name="description"
          content="Nano Profiles turns your identity into a living digital presence. Share your story, work, and contact in one polished profile for founders, companies, artists, professionals, and restaurants."
        />
        <meta property="og:title" content="Nano Profiles — A profile built for you" />
        <meta
          property="og:description"
          content="Put your story, work, and contact details in one polished profile — then share it anywhere."
        />
        <meta property="og:url" content={`https://${process.env.REACT_APP_DOMAIN || 'nanoprofiles.com'}/`} />
        <meta name="twitter:title" content="Nano Profiles — A profile built for you" />
        <meta
          name="twitter:description"
          content="Put your story, work, and contact details in one polished profile — then share it anywhere."
        />
      </Helmet>

      <main className="landing-page-container mkt-page">
        <HomeNavbar />
        <HomeHero />
        <HomeAbout />
        <HomeJumpstart />
        <HomeContact />
        <HomeFooter />
      </main>
    </>
  );
}
