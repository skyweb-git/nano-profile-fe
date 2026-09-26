/**
 * ProfileFounderDashboard.js
 * Founder profile dashboard – split-screen (desktop) / tabbed (mobile).
 * Sections: Hero, Company, Pitch Deck, Milestones, Co-founders, Links, Design.
 */
import React, { useState, useRef } from 'react';
import { getLinkIcon } from '../components/LinkIcons';
import { ALL_PLATFORMS } from './ProfileHelpers';
import { generalProfileAPI } from '../services/api';
import { getIdToken } from '../firebase';
import { fixImageUrl } from '../utils/imageHelper';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import { extractUploadUrl } from './ProfileHelpers';

export default function ProfileFounderDashboard(props) {
  const {
    user, displayName, displayEmail, avatarLetter, handleLogout,
    cropper, isMobileViewport,
    founderProfile, setFounderProfile,
    founderSaving, setFounderSaving,
    founderChanged, setFounderChanged,
    founderActiveTab, setFounderActiveTab,
    founderBannerUploading, setFounderBannerUploading,
    previewKey, setPreviewKey,
    frontendBase,
    linkCopiedFounder, setLinkCopiedFounder,
    persistFounder, saveFounderChanges,
    handlePickAndCrop,
    founderBannerInputRef,
    fLinkSelectorOpen, setFLinkSelectorOpen,
    fTempPlatforms, setFTempPlatforms,
    setProfileMode, setProfileLock, setChoiceSource,
    pdfNumPages, setPdfNumPages, onPdfLoadSuccess,
    founderMenuInputRef,
  } = props;

  // ── local editing state ──
  const [heroEditing, setHeroEditing] = useState(null); // 'name' | 'tagline' | 'bio' | 'companyName' | 'ctaLabel' | 'ctaUrl'
  const [heroDraft, setHeroDraft] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [companyImgUploading, setCompanyImgUploading] = useState(false);
  const pdfInputRef = useRef(null);

  const profile = founderProfile;
  if (!profile) return null;

  const startEdit = (field) => { setHeroEditing(field); setHeroDraft(profile[field] || ''); };
  const saveEdit = async () => {
    if (!heroEditing) return;
    const updated = { ...profile, [heroEditing]: heroDraft };
    setFounderProfile(updated);
    persistFounder(updated);
    setFounderChanged(true);
    setHeroEditing(null);
  };
  const cancelEdit = () => { setHeroEditing(null); setHeroDraft(''); };

  const updateField = (field, value) => {
    const updated = { ...profile, [field]: value };
    setFounderProfile(updated);
    persistFounder(updated);
    setFounderChanged(true);
  };

  // milestone helpers
  const addMilestone = () => {
    const m = [...(profile.milestones || []), { label: '' }];
    updateField('milestones', m);
  };
  const updateMilestone = (idx, val) => {
    const m = [...(profile.milestones || [])];
    m[idx] = { label: val };
    updateField('milestones', m);
  };
  const removeMilestone = (idx) => {
    const m = (profile.milestones || []).filter((_, i) => i !== idx);
    updateField('milestones', m);
  };

  // co-founder helpers
  const [newCfUsername, setNewCfUsername] = useState('');
  const [isAddingCf, setIsAddingCf] = useState(false);
  const [cfFetchMsg, setCfFetchMsg] = useState('');

  const handleAddCoFounderByUsername = async () => {
    let raw = newCfUsername.trim();
    if (!raw) return;
    const linkMatch = raw.match(/\/link\/([a-zA-Z0-9_.-]+)/i);
    let clean = linkMatch && linkMatch[1] ? linkMatch[1] : raw.replace(/^@+/, '').trim();
    if (!clean) return;

    setIsAddingCf(true);
    setCfFetchMsg(`Fetching profile @${clean}...`);
    let name = `@${clean}`;
    let role = 'Team Member';
    let photo = '';

    try {
      const res = await generalProfileAPI.getByUsername(clean);
      if (res && res.data) {
        name = (res.data.name || clean).replace(/\|/g, ' ').trim();
        role = res.data.title || res.data.experience || (res.data.profileType === 'founder' ? 'Founder' : 'Team Member');
        photo = res.data.photo || '';
      }
    } catch (e) {
      console.warn('Profile fetch warning:', e);
    } finally {
      setIsAddingCf(false);
      setCfFetchMsg('');
    }

    const c = [...(profile.coFounders || []), { name, role, photo, username: clean, nanoUsername: clean }];
    updateField('coFounders', c);
    setNewCfUsername('');
  };

  const removeCoFounder = (idx) => {
    const c = (profile.coFounders || []).filter((_, i) => i !== idx);
    updateField('coFounders', c);
  };

  // pitch deck upload
  const handlePdfUploadLocal = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') { alert('Please upload a valid PDF.'); return; }
    setPdfUploading(true);
    try {
      const up = await generalProfileAPI.uploadMenuPdf(file, () => getIdToken(), () => ({ uid: user.uid, email: user.email }));
      const url = (up && (up.url || up.secure_url)) || extractUploadUrl(up);
      if (url) {
        updateField('pitchDeckPdf', url);
      }
    } catch (err) {
      console.error('Pitch deck upload failed', err);
      alert('Upload failed. Please try again.');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleCompanyImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompanyImgUploading(true);
    try {
      const up = await generalProfileAPI.uploadPhoto(file, () => getIdToken());
      const imageUrl = extractUploadUrl(up);
      if (imageUrl) {
        updateField('companyImage', imageUrl);
      }
    } catch (err) {
      console.error('Failed to upload company image:', err);
      alert('Failed to upload company image. Please try again.');
    } finally {
      setCompanyImgUploading(false);
    }
  };

  const InlineField = ({ label, field, placeholder, multiline, type }) => {
    const isEditing = heroEditing === field;
    return (
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{label}</span>
          {!isEditing && <button type="button" onClick={() => startEdit(field)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Edit</button>}
        </div>
        {isEditing ? (
          <div>
            {multiline ? (
              <textarea rows={3} value={heroDraft} onChange={e => setHeroDraft(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #6366f1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} autoFocus />
            ) : (
              <input type={type || 'text'} value={heroDraft} onChange={e => setHeroDraft(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #6366f1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} autoFocus />
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={saveEdit} style={{ padding: '0.45rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={cancelEdit} style={{ padding: '0.45rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div onClick={() => startEdit(field)} style={{ padding: '0.85rem 1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: profile[field] ? '#0f172a' : '#64748b', fontSize: '0.95rem', cursor: 'text', minHeight: '2.5rem', whiteSpace: 'pre-line' }}>
            {profile[field] || <span style={{ opacity: 0.5 }}>Click to add {label.toLowerCase()}…</span>}
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: "'Outfit', sans-serif", background: '#f8fafc' }}>
      {/* ── Sidebar ── */}
      <aside style={{ width: '220px', minWidth: '220px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0, overflow: 'hidden' }}>
            {user?.photoURL ? <img src={user.photoURL} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayEmail}</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
          <div style={{ padding: '0 0.75rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Founder</span>
          </div>
          {[
            { id: 'info', icon: '🏢', label: 'Profile & Company' },
            { id: 'team', icon: '👥', label: 'Co-founders' },
            { id: 'links', icon: '🔗', label: 'Links' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFounderActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 1rem', background: founderActiveTab === tab.id ? '#f0f4ff' : 'transparent', border: 'none', borderRadius: '8px', margin: '2px 8px', width: 'calc(100% - 16px)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: founderActiveTab === tab.id ? 700 : 500, color: founderActiveTab === tab.id ? '#6366f1' : '#334155', textAlign: 'left', transition: 'all 0.15s' }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.6rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Sign out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header className="dash-main-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', padding: '1.25rem 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
            <h1 className="dash-main-title" style={{ margin: 0, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.5rem' }}>
              {founderActiveTab === 'deck' ? 'Pitch Deck' : founderActiveTab === 'team' ? 'Co-founders' : founderActiveTab === 'links' ? 'Social Links' : 'Founder Dashboard'}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Copy link */}
              <button
                type="button"
                onClick={() => {
                  const url = profile?.username ? `${frontendBase}/link/${profile.username}` : frontendBase;
                  navigator.clipboard.writeText(url);
                  setLinkCopiedFounder(true);
                  setTimeout(() => setLinkCopiedFounder(false), 2000);
                }}
                className="dash-icon-pill"
                style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {linkCopiedFounder ? <>✓ <span>Copied</span></> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> <span>Copy Link</span></>}
              </button>

              {/* Go to profile */}
              <a
                href={profile.username ? `${frontendBase}/link/${profile.username}` : '#'}
                target={profile.username ? '_blank' : undefined}
                rel="noreferrer"
                className="dash-icon-pill"
                style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
                <span>Go to Profile</span>
              </a>

              {/* Save */}
              <button
                onClick={() => saveFounderChanges(profile)}
                disabled={founderSaving}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, background: founderChanged ? '#0070f3' : '#ffffff', color: founderChanged ? '#ffffff' : '#000000', border: founderChanged ? '1px solid #0070f3' : '1px solid #e2e8f0', cursor: founderSaving ? 'wait' : 'pointer', opacity: founderSaving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: founderChanged ? '0 4px 12px 0 rgba(0,118,243,0.3)' : 'none', whiteSpace: 'nowrap' }}
              >
                {founderSaving ? '...' : 'Save Changes'}
              </button>
            </div>
          </div>
          <p className="dash-main-subtitle" style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
            {founderActiveTab === 'deck' ? 'Upload your pitch deck PDF for investors' : founderActiveTab === 'team' ? 'Add your co-founders and team' : founderActiveTab === 'links' ? 'Manage your social platform links' : 'Manage your founder profile and startup info'}
          </p>
        </header>

        <div className="dash-content">
          {/* ── Profile & Company Tab ── */}
          {founderActiveTab === 'info' && (
            <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden', minHeight: '0' }}>
              <div className="dash-single-profile" style={{ padding: '1.5rem 0', overflowY: 'auto' }}>
                <div style={{ padding: isMobileViewport ? '0' : '0 2.5rem' }}>

                  {/* Hero / Banner */}
                  <div className="dash-profile-hero dash-profile-hero--restaurant" style={{ display: 'flex', flexDirection: isMobileViewport ? 'column' : 'row', gap: '2rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem', alignItems: 'stretch', position: 'relative' }}>
                    {/* Banner */}
                    <div style={{ flex: '1.2', width: '100%', aspectRatio: '16/9', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      {profile.banner ? (
                        <img src={fixImageUrl(profile.banner) || profile.banner} alt="Founder Banner" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)', zIndex: 1 }} />
                      )}
                    </div>

                    <input ref={founderBannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePickAndCrop(e, 16/9, (file) => {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const updated = { ...profile, banner: ev.target.result };
                        setFounderProfile(updated);
                        persistFounder(updated);
                        setFounderChanged(true);
                      };
                      reader.readAsDataURL(file);
                    })} />

                    {/* Name / Username / Banner change */}
                    <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.85rem', alignItems: 'flex-start' }}>
                      <h2 style={{ cursor: 'pointer', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }} onClick={() => startEdit('name')}>
                        <span style={{ borderBottom: '1px dashed #6366f1' }}>{profile.name || 'Add your name'}</span>
                      </h2>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>@{profile.username}</p>
                      <button
                        type="button"
                        className="dash-icon-pill upload-trigger-btn"
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => { if (founderBannerInputRef.current) { founderBannerInputRef.current.value = ''; founderBannerInputRef.current.click(); } }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Change Banner
                      </button>
                    </div>
                  </div>

                  {/* Tagline inline name editor */}
                  {heroEditing === 'name' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                      <input value={heroDraft} onChange={e => setHeroDraft(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #6366f1', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} autoFocus />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={saveEdit} style={{ padding: '0.45rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Save</button>
                        <button type="button" onClick={cancelEdit} style={{ padding: '0.45rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* About */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <InlineField label="Tagline" field="tagline" placeholder="Building the future of..." />
                    <InlineField label="Bio / About" field="bio" placeholder="Tell your story..." multiline />
                  </div>

                  {/* Company Info */}
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.25rem 0' }}>Startup Info</h3>

                    {/* Company Image / Banner */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Company Image / Banner</label>
                      {profile.companyImage && (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
                          <img src={profile.companyImage} alt="Company Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => updateField('companyImage', '')}
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}
                            title="Remove Image"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: companyImgUploading ? 'not-allowed' : 'pointer'
                      }}>
                        {companyImgUploading ? 'Uploading...' : (profile.companyImage ? 'Change Image' : '+ Upload Company Image')}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          disabled={companyImgUploading}
                          onChange={handleCompanyImageUpload}
                        />
                      </label>
                    </div>

                    <InlineField label="Company Name" field="companyName" placeholder="AcmeTech" />
                    <InlineField label="Company Website" field="companyWebsite" placeholder="https://yourcompany.com" type="url" />

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Founding Year</label>
                      <input
                        type="text"
                        value={profile.foundingYear || ''}
                        onChange={e => updateField('foundingYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="2021"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    <InlineField label="Company Description" field="companyDescription" placeholder="Write a proper description of your company, mission, what you build, products..." multiline />

                    {/* Industry tags */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.3rem' }}>Industry / Sector Tags</label>
                      <input
                        type="text"
                        value={profile.specialization || ''}
                        onChange={e => updateField('specialization', e.target.value)}
                        placeholder="EdTech, SaaS, FinTech"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Separate with commas</span>
                    </div>
                  </div>



                  {/* Milestones */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Key Milestones</h3>
                      <button type="button" onClick={addMilestone} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>+ Add</button>
                    </div>
                    {(profile.milestones || []).length === 0 ? (
                      <div style={{ padding: '1.5rem', border: '2px dashed #e2e8f0', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        No milestones yet. Add achievements like "$1M ARR", "Y Combinator W24", "500K Users".
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(profile.milestones || []).map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '999px', padding: '0.35rem 0.75rem' }}>
                            <input
                              value={m.label || ''}
                              onChange={e => updateMilestone(idx, e.target.value)}
                              placeholder="e.g. $1M ARR"
                              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.88rem', fontWeight: 600, color: '#0369a1', minWidth: '80px', maxWidth: '180px' }}
                            />
                            <button type="button" onClick={() => removeMilestone(idx)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ── Co-founders Tab ── */}
          {founderActiveTab === 'team' && (
            <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden', minHeight: '0' }}>
              <div className="dash-single-profile" style={{ padding: '2.5rem 0', overflowY: 'auto' }}>
                <div style={{ padding: isMobileViewport ? '0' : '0 2.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Leadership & Team</h2>
                    <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem' }}>
                      Add team members by entering their Nano username. We'll automatically fetch their name, role, and avatar.
                    </p>
                    <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '520px', alignItems: 'center', margin: 0 }}>
                      <div style={{ display: 'flex', flex: 1, minWidth: 0, height: '44px', alignItems: 'center', margin: 0, boxSizing: 'border-box' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 0.9rem',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRight: 'none',
                          borderRadius: '8px 0 0 8px',
                          color: '#64748b',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          userSelect: 'none',
                          boxSizing: 'border-box',
                          height: '44px',
                          margin: 0
                        }}>
                          @
                        </span>
                        <input
                          value={newCfUsername}
                          onChange={e => setNewCfUsername(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCoFounderByUsername();
                            }
                          }}
                          placeholder="Enter Nano username (e.g. priya)"
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: '44px',
                            boxSizing: 'border-box',
                            padding: '0 0.9rem',
                            borderRadius: '0 8px 8px 0',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            outline: 'none',
                            background: '#ffffff',
                            margin: 0
                          }}
                          disabled={isAddingCf}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCoFounderByUsername}
                        disabled={isAddingCf || !newCfUsername.trim()}
                        style={{
                          height: '44px',
                          maxHeight: '44px',
                          margin: 0,
                          marginTop: 0,
                          marginBottom: 0,
                          padding: '0 1.25rem',
                          background: isAddingCf || !newCfUsername.trim() ? '#94a3b8' : '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isAddingCf || !newCfUsername.trim() ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                          alignSelf: 'center'
                        }}
                      >
                        {isAddingCf ? 'Fetching...' : 'Add Member'}
                      </button>
                    </div>
                    {cfFetchMsg && (
                      <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '6px' }}>{cfFetchMsg}</div>
                    )}
                  </div>

                  {(profile.coFounders || []).length === 0 ? (
                    <div style={{ padding: '3rem 2rem', border: '2px dashed #e2e8f0', borderRadius: '16px', textAlign: 'center', color: '#64748b' }}>
                      No team members added yet. Enter their Nano username above.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '600px' }}>
                      {(profile.coFounders || []).map((cf, idx) => {
                        const uname = (cf.nanoUsername || cf.username || '').replace(/^@+/, '');
                        return (
                          <div key={idx} style={{ padding: '0.9rem 1.2rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', flexShrink: 0 }}>
                                {cf.photo ? <img src={cf.photo} alt={cf.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (cf.name || uname || 'T').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{cf.name || `@${uname}`}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cf.role || 'Team Member'}</div>
                                {uname && <div style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>@{uname}</div>}
                              </div>
                            </div>
                            <button type="button" onClick={() => removeCoFounder(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Links Tab ── */}
          {founderActiveTab === 'links' && (
            <div className="dash-profile-layout" style={{ flex: 1, overflow: 'hidden', minHeight: '0' }}>
              <div className="dash-single-profile" style={{ padding: '2.5rem 0', overflowY: 'auto' }}>
                <div style={{ padding: isMobileViewport ? '0' : '0 2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Social Links</h3>
                    <button type="button" className="dash-add-platform-btn" onClick={() => { setFTempPlatforms(Object.keys(profile.links || {})); setFLinkSelectorOpen(true); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Platforms
                    </button>
                  </div>
                  <div className="dash-links-section">
                    {ALL_PLATFORMS.filter(p => p.id in (profile.links || {})).map(p => (
                      <div className="dash-link-card dash-link-card--inline" key={p.id}>
                        <div className="dash-link-card-main">
                          <div className="dash-link-icon-circle">{getLinkIcon({ platform: p.id })}</div>
                          <div className="dash-link-content dash-link-content--inline">
                            <span className="dash-link-title" title={p.label}>{p.label}</span>
                            <div className="dash-link-url">
                              <input
                                className="dash-link-inline-input"
                                placeholder="Enter URL / handle"
                                value={(profile.links || {})[p.id] || ''}
                                onChange={e => {
                                  const updated = { ...profile, links: { ...(profile.links || {}), [p.id]: e.target.value } };
                                  setFounderProfile(updated);
                                  persistFounder(updated);
                                  setFounderChanged(true);
                                }}
                              />
                            </div>
                          </div>
                          <div className="dash-link-controls">
                            <button
                              className="dash-link-remove-icon-btn"
                              onClick={() => {
                                const newLinks = { ...(profile.links || {}) };
                                delete newLinks[p.id];
                                const updated = { ...profile, links: newLinks };
                                setFounderProfile(updated);
                                persistFounder(updated);
                                setFounderChanged(true);
                              }}
                              title="Remove this platform"
                            >✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(profile.links || {}).length === 0 && (
                      <div style={{ padding: '2rem', border: '2px dashed #e2e8f0', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                        No links added. Click "Add Platforms" to add LinkedIn, GitHub, Twitter/X, and more.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
                    const currentLinks = profile.links || {};
                    const newLinks = { ...currentLinks };
                    fTempPlatforms.forEach(id => { if (!(id in newLinks)) newLinks[id] = ''; });
                    Object.keys(newLinks).forEach(id => { if (!fTempPlatforms.includes(id)) delete newLinks[id]; });
                    const updated = { ...profile, links: newLinks };
                    setFounderProfile(updated);
                    persistFounder(updated);
                    setFounderChanged(true);
                    setFLinkSelectorOpen(false);
                  }}
                >Done</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {cropper?.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
          <ImageCropperModal image={cropper.image} aspect={cropper.aspect} onSave={cropper.onComplete} onCancel={cropper.onCancel} />
        </div>
      )}
    </div>
  );
}
