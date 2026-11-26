import React from 'react';
import './MarketingSite.css';

const FEATURES = [
  {
    title: 'Create in minutes',
    body: 'Choose a profile type, add your story and links, and publish a polished page without rebuilding a website.',
    icon: 'bolt',
  },
  {
    title: 'Share it anywhere',
    body: 'Drop your Nano Profiles link in bios, messages, emails, and decks so people always land in the right place.',
    icon: 'share',
  },
  {
    title: 'Stay current',
    body: 'Update once and every place you’ve shared your link reflects the latest bio, work, and contact details.',
    icon: 'sync',
  },
];

export default function HomeAbout() {
  return (
    <section className="mkt-section mkt-section--cream" aria-labelledby="about-title">
      <div className="mkt-section-inner">
        <div className="mkt-section-head">
          <h2 id="about-title">Create and customize your profile in minutes</h2>
          <p>
            Connect your story, work, and contact details in one place. Built for founders, companies, artists,
            professionals, and restaurants who want a cleaner way to show up online.
          </p>
        </div>

        <div className="mkt-feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="mkt-feature-card">
              <div className="icon">
                <span className="material-symbols-outlined" aria-hidden="true">{f.icon}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
