import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroHeadMesh from './HeroHeadMesh';
import './MarketingSite.css';

export default function HomeHero() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const claim = (e) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    navigate(clean ? `/login?username=${encodeURIComponent(clean)}` : '/login');
  };

  return (
    <section id="home" className="mkt-hero">
      <div className="mkt-hero-grid">
        <div>
          <h1>A profile built for you.</h1>
          <p className="mkt-hero-copy">
            Nano Profiles turns your identity into a living digital presence. Put your story, work, and contact
            details in one polished profile — then share it anywhere. Edit once, and every link stays up to date.
          </p>

          <form className="mkt-claim" onSubmit={claim}>
            <label className="mkt-claim-field">
              <span className="mkt-claim-prefix">nanoprofiles.com/</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                aria-label="Choose your Nano Profiles username"
                autoComplete="username"
              />
            </label>
            <button type="submit" className="mkt-claim-btn">Get started for free</button>
          </form>
        </div>

        <div className="mkt-hero-visual" aria-hidden="true">
          <div className="mkt-hero-orbit">
            <div className="mkt-orbit-ring mkt-ring-1" />
            <div className="mkt-orbit-ring mkt-ring-2" />
            <div className="mkt-orbit-ring mkt-ring-3" />
            <div className="mkt-orbit-center">
              <HeroHeadMesh />
            </div>
            <div className="mkt-orbit-dot mkt-dot-1" />
            <div className="mkt-orbit-dot mkt-dot-2" />
            <div className="mkt-orbit-dot mkt-dot-3" />
            <div className="mkt-orbit-dot mkt-dot-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
