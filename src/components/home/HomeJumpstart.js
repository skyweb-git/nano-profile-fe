import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingSite.css';

export default function HomeJumpstart() {
  return (
    <section className="mkt-cta-band" aria-labelledby="jump-title">
      <h2 id="jump-title">Jumpstart your corner of the internet today</h2>
      <p>
        Claim your Nano Profiles link and put everything you are — story, work, and contact — in one place people
        can actually use.
      </p>
      <div className="mkt-btn-row">
        <Link to="/login" className="mkt-btn-light">Create free</Link>
        <a href="#contact" className="mkt-btn-secondary">Talk to us</a>
      </div>
    </section>
  );
}
