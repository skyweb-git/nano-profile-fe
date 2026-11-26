import React from 'react';
import { API_URL } from '../../services/api';
import './MarketingSite.css';

export default function HomeContact() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    try {
      const base = API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
      const response = await fetch(`${base}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Thank you, ${name}! Your message has been sent successfully.`);
        e.target.reset();
      } else {
        alert(`Error: ${data.error || 'Failed to send message. Please try again.'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please check your connection and try again.');
    }
  };

  return (
    <section id="contact" className="mkt-section mkt-section--white" aria-labelledby="contact-title">
      <div className="mkt-section-inner">
        <div className="mkt-section-head">
          <h2 id="contact-title">Questions? Let’s talk.</h2>
          <p>Reach the Nano Profiles team for product questions, partnerships, or support.</p>
        </div>

        <div className="mkt-contact-grid">
          <div className="mkt-contact-links">
            <a className="mkt-contact-link" href="mailto:hello@nanoprofiles.com">
              <span>Email</span>
              <strong>hello@nanoprofiles.com</strong>
            </a>
            <a className="mkt-contact-link" href="tel:+919121428210">
              <span>Phone</span>
              <strong>+91 91214 28210</strong>
            </a>
            <a className="mkt-contact-link" href="https://instagram.com/nanoprofiles" target="_blank" rel="noreferrer">
              <span>Instagram</span>
              <strong>@nanoprofiles</strong>
            </a>
            <a className="mkt-contact-link" href="https://wa.me/919121428210" target="_blank" rel="noreferrer">
              <span>WhatsApp</span>
              <strong>Message us</strong>
            </a>
          </div>

          <div className="mkt-contact-form">
            <h3>Send a message</h3>
            <form onSubmit={handleSubmit}>
              <input name="name" type="text" placeholder="Your name" required />
              <input name="email" type="email" placeholder="Your email" required />
              <textarea name="message" placeholder="How can we help?" required />
              <button type="submit">Send message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
