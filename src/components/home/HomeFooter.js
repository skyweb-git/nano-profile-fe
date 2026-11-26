import React from 'react';
import { Link } from 'react-router-dom';
import './MarketingSite.css';

export default function HomeFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-grid">
        <div>
          <div className="mkt-footer-brand">Nano Profiles</div>
          <p>Everything you are, in one simple profile. Edit once. Share everywhere.</p>
        </div>

        <div>
          <h4>Product</h4>
          <p><Link to="/">Home</Link></p>
          <p><Link to="/profiles">Profiles</Link></p>
          <p><Link to="/login">Create free</Link></p>
        </div>

        <div>
          <h4>Company</h4>
          <p><a href="#contact">Contact</a></p>
          <p><a href="mailto:hello@nanoprofiles.com">Support</a></p>
          <p><a href="https://www.skywebdev.xyz" target="_blank" rel="noreferrer">Skyweb</a></p>
        </div>

        <div>
          <h4>Follow</h4>
          <p><a href="https://instagram.com/nanoprofiles" target="_blank" rel="noreferrer">Instagram</a></p>
          <p><a href="https://wa.me/919121428210" target="_blank" rel="noreferrer">WhatsApp</a></p>
        </div>
      </div>

      <div className="mkt-footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} Nano Profiles. A product of{' '}
          <a href="https://www.skywebdev.xyz" target="_blank" rel="noreferrer">Skyweb IT Solutions Pvt Ltd</a>.
        </p>
      </div>
    </footer>
  );
}
