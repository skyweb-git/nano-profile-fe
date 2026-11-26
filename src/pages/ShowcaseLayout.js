import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeFooter from '../components/home/HomeFooter';
import ShowcaseProfileIframe from '../components/ShowcaseProfileIframe';
import '../components/home/MarketingSite.css';

export default function ShowcaseLayout({
  title,
  description,
  headline,
  subtitle,
  features = [],
  previewTitle,
  iframeSrc,
  ctaTitle,
  ctaBody,
}) {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>

      <main className="showcase-page mkt-page">
        <HomeNavbar />

        <section className="mkt-showcase-hero">
          <h1>{headline}</h1>
          <p>{subtitle}</p>
          <div className="mkt-btn-row">
            <Link to="/login" className="mkt-btn-primary">Create free</Link>
            <a href="#preview" className="mkt-btn-outline">See example ↓</a>
          </div>
        </section>

        {features.length > 0 && (
          <section className="mkt-section mkt-section--cream">
            <div className="mkt-section-inner">
              <div className="mkt-feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {features.map((f) => (
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
        )}

        <section id="preview" className="mkt-showcase-preview">
          <h2>{previewTitle}</h2>
          <div className="showcase-profile-card-pc">
            <ShowcaseProfileIframe title={previewTitle} src={iframeSrc} />
          </div>
        </section>

        <section className="mkt-cta-band">
          <h2>{ctaTitle}</h2>
          <p>{ctaBody}</p>
          <div className="mkt-btn-row">
            <Link to="/login" className="mkt-btn-light">Get started free</Link>
          </div>
        </section>

        <HomeFooter />
      </main>
    </>
  );
}
