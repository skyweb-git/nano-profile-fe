/**
 * ProfileFounderOnboarding.js
 * Onboarding flow for Founder profile – 3 steps:
 * 1. Identity (name, username, tagline, banner)
 * 2. Startup Info (company, year, website)
 * 3. Social Links
 */
import React from 'react';
import { getLinkIcon } from '../components/LinkIcons';
import { ALL_PLATFORMS, extractUploadUrl } from './ProfileHelpers';
import { generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { fixImageUrl } from '../utils/imageHelper';

export default function ProfileFounderOnboarding(props) {
  const {
    user, displayEmail, handleLogout,
    cropper,
    founderForm, setFounderForm,
    founderOnboardingStep, updateFounderOnboardingStep,
    founderSaving,
    usernameCheck, setUsernameCheck,
    availabilitySuggestions, setAvailabilitySuggestions,
    usernameCheckTimer,
    saveFounderProfile, setupLoader,
    founderBannerInputRef,
    fLinkSelectorOpen, setFLinkSelectorOpen,
    fTempPlatforms, setFTempPlatforms,
    handlePickAndCrop, handleFounderBannerUpload,
    getFileAfterCropOrPassThrough,
  } = props;

  const fStep = founderOnboardingStep;

  return (
    <div className="profile-page profile-login-wrap onboarding-screen">
      <div className="profile-login-card profile-choice-card general-onboarding-card">
        {fStep > 1 && (
          <button type="button" className="profile-back-btn" onClick={() => updateFounderOnboardingStep(fStep - 1)}>← Back</button>
        )}
        <div className="general-onboarding-progress">
          <div className="general-onboarding-progress-bar" style={{ width: `${(fStep / 3) * 100}%` }} />
        </div>

        {/* ──────────────── STEP 1 – Identity ──────────────── */}
        {fStep === 1 && (
          <div className="onboarding-step fade-in">
            <h2>Step 1 – Identity</h2>
            <p className="onboarding-subtitle">Your name, username &amp; banner</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>Full Name</label>
                <input
                  type="text"
                  className="onboarding-input"
                  value={founderForm.name}
                  onChange={e => setFounderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Mehta"
                  autoFocus
                />
              </div>

              <div className="onboarding-field">
                <label>Username (for your link)</label>
                <div className="artist-id-input-wrapper" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="onboarding-input-id"
                    style={{
                      paddingLeft: '1.25rem',
                      paddingRight: '2.5rem',
                      borderColor: usernameCheck.status === 'available' ? '#10b981' : usernameCheck.status === 'taken' || usernameCheck.status === 'invalid' ? '#ef4444' : undefined
                    }}
                    autoComplete="off"
                    value={founderForm.username || ''}
                    onChange={e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                      setFounderForm(prev => ({ ...prev, username: val }));
                      clearTimeout(usernameCheckTimer.current);
                      if (!val || val.length < 3) {
                        setUsernameCheck(val ? { status: 'invalid', msg: 'At least 3 characters' } : { status: 'idle', msg: '' });
                        setAvailabilitySuggestions([]);
                        return;
                      }
                      setUsernameCheck({ status: 'checking', msg: '' });
                      usernameCheckTimer.current = setTimeout(async () => {
                        try {
                          const res = await generalProfileAPI.checkAvailability({ username: val });
                          if (res.conflicts?.username) {
                            setUsernameCheck({ status: 'taken', msg: res.conflicts.username });
                            if (res.suggestions) setAvailabilitySuggestions(res.suggestions);
                          } else {
                            setUsernameCheck({ status: 'available', msg: 'Available!' });
                            setAvailabilitySuggestions([]);
                          }
                        } catch {
                          setUsernameCheck({ status: 'idle', msg: '' });
                        }
                      }, 500);
                    }}
                    placeholder="founder_username"
                    required
                  />
                  {usernameCheck.status === 'checking' && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: '#94a3b8' }}>...</span>}
                  {usernameCheck.status === 'available' && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#10b981' }}>✓</span>}
                  {(usernameCheck.status === 'taken' || usernameCheck.status === 'invalid') && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: '#ef4444' }}>✕</span>}
                </div>
                {usernameCheck.status === 'taken' && (
                  <>
                    <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>
                    {availabilitySuggestions.length > 0 && (
                      <div className="onboarding-suggestions" style={{ paddingLeft: '0.5rem' }}>
                        <span>Try:</span>
                        {availabilitySuggestions.map(s => (
                          <button key={s} type="button" className="onboarding-suggestion-btn" onClick={() => { setFounderForm(p => ({ ...p, username: s })); setUsernameCheck({ status: 'available', msg: 'Available!' }); setAvailabilitySuggestions([]); }}>{s}</button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {usernameCheck.status === 'invalid' && <small style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>}
                {usernameCheck.status === 'available' && <small style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block', paddingLeft: '0.5rem' }}>{usernameCheck.msg}</small>}
                <small className="onboarding-tip">Your link: <b>{process.env.REACT_APP_DOMAIN || 'nanoprofile.com'}/link/{founderForm.username || 'username'}</b></small>
              </div>

              <div className="onboarding-field">
                <label>Tagline</label>
                <input
                  type="text"
                  className="onboarding-input"
                  value={founderForm.tagline || ''}
                  onChange={e => setFounderForm(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Building the future of EdTech"
                />
              </div>

              <div className="onboarding-field">
                <label>Bio / About You</label>
                <textarea
                  className="onboarding-textarea"
                  rows={3}
                  value={founderForm.bio}
                  onChange={e => setFounderForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief description about yourself and your venture..."
                />
              </div>

              <div className="onboarding-field" style={{ marginTop: '1.5rem' }}>
                <label>Banner Image</label>
                <button
                  type="button"
                  className="upload-trigger-btn"
                  onClick={() => { if (founderBannerInputRef.current) { founderBannerInputRef.current.value = ''; founderBannerInputRef.current.click(); } }}
                >
                  <div className="upload-preview-banner" style={{ height: '140px' }}>
                    {founderForm.banner ? <img src={fixImageUrl(founderForm.banner)} alt="Preview" /> : <span>+ Tap to upload banner</span>}
                  </div>
                </button>
                <input
                  ref={founderBannerInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => handlePickAndCrop(e, 16 / 9, handleFounderBannerUpload)}
                  accept="image/*"
                />
              </div>
            </div>

            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="onboarding-btn-primary"
                onClick={() => {
                  setFounderForm(prev => ({ ...prev, email: prev.email || displayEmail }));
                  updateFounderOnboardingStep(2);
                }}
                disabled={!founderForm.name.trim() || !founderForm.username || usernameCheck.status !== 'available'}
              >
                Next Step →
              </button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 2 – Startup Info ──────────────── */}
        {fStep === 2 && (
          <div className="onboarding-step fade-in">
            <h2>Step 2 – Startup Info</h2>
            <p className="onboarding-subtitle">Tell investors about your company</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <label>Company / Startup Name</label>
                <input
                  type="text"
                  className="onboarding-input"
                  value={founderForm.companyName || ''}
                  onChange={e => setFounderForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. AcmeTech"
                  autoFocus
                />
              </div>

              <div className="onboarding-field">
                <label>Company Website</label>
                <input
                  type="url"
                  className="onboarding-input"
                  value={founderForm.companyWebsite || ''}
                  onChange={e => setFounderForm(prev => ({ ...prev, companyWebsite: e.target.value }))}
                  placeholder="https://yourcompany.com"
                />
              </div>

              <div className="onboarding-field">
                <label>Founding Year</label>
                <input
                  type="text"
                  className="onboarding-input"
                  value={founderForm.foundingYear || ''}
                  onChange={e => setFounderForm(prev => ({ ...prev, foundingYear: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="e.g. 2021"
                  maxLength={4}
                />
              </div>



              <div className="onboarding-field">
                <label>Industry / Sector Tags</label>
                <input
                  type="text"
                  className="onboarding-input"
                  value={founderForm.specialization || ''}
                  onChange={e => setFounderForm(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g. EdTech, SaaS, FinTech"
            </div>

            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-primary" onClick={() => updateFounderOnboardingStep(3)}>Next Step →</button>
            </div>
          </div>
        )}

        {/* ──────────────── STEP 3 – Links ──────────────── */}
        {fStep === 3 && (
          <div className="onboarding-step fade-in">
            <h2>Step 3 – Links</h2>
            <p className="onboarding-subtitle">Add LinkedIn, GitHub, AngelList, and more (optional)</p>
            <div className="onboarding-fields">
              <div className="onboarding-field">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ color: '#1a1b2e', margin: 0 }}>Links</label>
                  <button
                    type="button"
                    onClick={() => { setFTempPlatforms(Object.keys(founderForm.links || {})); setFLinkSelectorOpen(true); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: '999px', border: '1px solid rgba(0,0,0,0.2)', background: '#fff', color: '#1a1b2e', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> Add Platforms
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {ALL_PLATFORMS.filter(p => p.id in (founderForm.links || {})).map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', padding: '0.35rem 0.5rem 0.35rem 0.65rem', background: 'rgba(0,0,0,0.02)', minHeight: '40px' }}>
                      <span style={{ fontWeight: 600, color: '#1a1b2e', fontSize: '0.8rem', flexShrink: 0, maxWidth: '92px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.label}>{p.label}</span>
                      <input
                        className="onboarding-input"
                        placeholder="URL / handle"
                        value={(founderForm.links || {})[p.id] || ''}
                        onChange={e => {
                          const v = e.target.value;
                          setFounderForm(prev => ({ ...prev, links: { ...(prev.links || {}), [p.id]: v } }));
                        }}
                        style={{ flex: 1, minWidth: 0, margin: 0, padding: '0.35rem 0.65rem', fontSize: '0.85rem', borderRadius: '999px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setFounderForm(prev => { const next = { ...(prev.links || {}) }; delete next[p.id]; return { ...prev, links: next }; })}
                        style={{ flexShrink: 0, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.05rem', lineHeight: 1, padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        aria-label={`Remove ${p.label}`}
                      >×</button>
                    </div>
                  ))}
                </div>
                {Object.keys(founderForm.links || {}).length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0' }}>Tap "Add Platforms" to add LinkedIn, GitHub, Twitter, and more.</p>
                )}
              </div>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="onboarding-btn-complete" onClick={saveFounderProfile} disabled={founderSaving}>
                {founderSaving ? <><span>Setting up...</span>{setupLoader}</> : 'Launch Founder Profile ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Platform selector modal */}
        {fLinkSelectorOpen && (
          <div className="dash-selector-overlay" style={{ zIndex: 100001 }}>
            <div className="dash-selector-modal">
              <div className="dash-selector-header">
                <h3>Add Platforms</h3>
                <p>Select platforms for your founder profile</p>
              </div>
              <div className="dash-selector-grid">
                {ALL_PLATFORMS.map(p => {
                  const isActive = fTempPlatforms.includes(p.id);
                  return (
                    <button key={p.id} type="button" className={`dash-selector-item ${isActive ? 'is-active' : ''}`} onClick={() => setFTempPlatforms(prev => isActive ? prev.filter(x => x !== p.id) : [...prev, p.id])}>
                      <div className="dash-selector-icon">{getLinkIcon({ platform: p.id })}</div>
                      <span className="dash-selector-label">{p.label}</span>
                      {isActive && <div className="dash-selector-check">✓</div>}
                    </button>
                  );
                })}
              </div>
              <div className="dash-selector-actions">
                <button type="button" className="dash-selector-btn-cancel" onClick={() => setFLinkSelectorOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="dash-selector-btn-done"
                  onClick={() => {
                    setFounderForm(prev => {
                      const currentLinks = prev.links || {};
                      const newLinks = { ...currentLinks };
                      fTempPlatforms.forEach(id => { if (!(id in newLinks)) newLinks[id] = ''; });
                      Object.keys(newLinks).forEach(id => { if (!fTempPlatforms.includes(id)) delete newLinks[id]; });
                      return { ...prev, links: newLinks };
                    });
                    setFLinkSelectorOpen(false);
                  }}
                >Done</button>
              </div>
            </div>
          </div>
        )}

        <button type="button" onClick={handleLogout} className="profile-logout-btn-link" style={{ marginTop: 16 }}>Sign out</button>
      </div>
      {cropper.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
          <ImageCropperModal image={cropper.image} aspect={cropper.aspect} onSave={cropper.onComplete} onCancel={cropper.onCancel} />
        </div>
      )}
    </div>
  );
}
