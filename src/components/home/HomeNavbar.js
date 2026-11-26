import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, logout, onAuthStateChanged } from '../../firebase';
import './MarketingSite.css';

const LINKS = [
  { to: '/', label: 'Home', match: (p) => p === '/' },
  {
    to: '/profiles',
    label: 'Profiles',
    match: (p) =>
      p === '/profiles' ||
      p.startsWith('/founder') ||
      p.startsWith('/company') ||
      p.startsWith('/artist') ||
      p.startsWith('/professional') ||
      p.startsWith('/restaurant'),
  },
];

export default function HomeNavbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => {
    if (user) {
      try {
        const id = user.email || user.uid;
        [
          'profile_mode',
          'profile_type_lock',
          'general_flow_mode',
          'restaurant_profile',
          'restaurant_onboarding_step',
          'onboarding_step',
          'general_step',
          'landing_otp_auth',
        ].forEach((k) => localStorage.removeItem(`nano_${id}_${k}`));
      } catch (_) {}
      logout();
    }
    setMenuOpen(false);
  };

  const initial = user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="mkt-nav">
      <div className="mkt-nav-inner">
        <Link className="mkt-nav-logo" to="/">Nano Profiles</Link>

        <nav className="mkt-nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mkt-nav-link${link.match(pathname) ? ' is-active' : ''}`}
              aria-current={link.match(pathname) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mkt-nav-actions">
          {user ? (
            <div className="mkt-nav-user" ref={menuRef}>
              <button
                type="button"
                className="mkt-nav-avatar"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {user.photoURL ? <img src={user.photoURL} alt="" /> : <span>{initial}</span>}
              </button>
              {menuOpen && (
                <div className="mkt-nav-dropdown" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                    Dashboard
                  </button>
                  <button type="button" role="menuitem" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="mkt-nav-cta">Sign up free</Link>
          )}
        </div>
      </div>
    </header>
  );
}
