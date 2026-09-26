import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, logout, getIdToken } from '../firebase';
import { landingArtistAPI, generalProfileAPI } from '../services/api';
import ImageCropperModal from '../components/profile/ImageCropperModal';
import ProfileFounderOnboardingWizard from '../components/profile/ProfileFounderOnboardingWizard';
import ProfileGeneralDashboard from './ProfileGeneralDashboard';

import {
  ALL_PLATFORMS,
  defaultForm,
  PROFILE_LOCK_KEY,
  PROFILE_MODE_KEY,
  extractUploadUrl,
  MAX_PLATFORM_LINKS,
  useImageCropper,
  getStoredValue,
  setStoredValue,
  removeStoredValue
} from './ProfileHelpers';
import { buildWhatsAppUrlFromFullINPhone } from '../utils/indianPhone';

const mapFounderProfileToArtistFormat = (data) => {
  if (!data) return null;
  return {
    ...data,
    profileType: 'founder',
    companyName: data.companyName || 'Nexus Tech Labs',
    companyWebsite: data.companyWebsite || 'https://nexustechlabs.com',
    foundingYear: data.foundingYear || '2023',
    fundingStage: '',
    teamSize: '',
    pitchDeckPdf: '',
    ctaLabel: '',
    ctaUrl: '',
    milestones: (data.milestones && data.milestones.length > 0) ? data.milestones : [
      { label: '$1.2M Seed Raised' },
      { label: '50K+ Active Users' },
      { label: 'Top 5 Product Hunt' }
    ],
    coFounders: (data.coFounders && data.coFounders.length > 0) ? data.coFounders : [
      { name: 'Priya Sharma', role: 'Co-Founder & CTO', linkedin: 'https://linkedin.com' },
      { name: 'Aarav Patel', role: 'Head of Product', linkedin: 'https://linkedin.com' }
    ],
    showCompany: data.showCompany !== false,
    showPitchDeck: false,
    showCoFounders: data.showCoFounders !== false,
    showMilestones: data.showMilestones !== false,
    showCta: false,
    artistId: data.username || '',
    backgroundPhoto: data.banner || '',
    experience: data.title || '',
    profileTheme: data.theme || 'custom-theme',
    isSetup: true
  };
};

export default function ProfileFounderController(props) {
  const { user, handleLogout, isMobileViewport, frontendBase, setProfileMode, setProfileLock, setChoiceSource } = props;
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);

  const [onboardingPlatforms, setOnboardingPlatforms] = useState([]);
  const [isOnboardingSelectorOpen, setIsOnboardingSelectorOpen] = useState(false);
  const [visiblePlatforms, setVisiblePlatforms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [myArtists, setMyArtists] = useState([]);
  const [linkCopiedArtist, setLinkCopiedArtist] = useState(false);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [error, setError] = useState('');

  // States for Image Cropper using the custom hook
  const { cropper, setCropper, getFileAfterCropOrPassThrough, handlePickAndCrop, handlePickAndCropBatch } = useImageCropper(setError);
  const [inlineEditing, setInlineEditing] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState('');
  const [artistListReady, setArtistListReady] = useState(false);

  const [artQrModal, setArtQrModal] = useState(null);

  // Dashboard customization state
  const [activeTab, setActiveTab] = useState('profiles');
  const [activeEditor, setActiveEditor] = useState('default');
  const [dashTheme] = useState(() => localStorage.getItem('dash_theme') || 'aura');
  const [dashFont] = useState(() => localStorage.getItem('dash_font') || 'outfit');
  const [openSubPanel, setOpenSubPanel] = useState({});
  const [layoutActiveTab, setLayoutActiveTab] = useState({});
  const [designSubTab, setDesignSubTab] = useState(null);
  
  // Link Your Art tab state
  const [newArtTheme, setNewArtTheme] = useState('painting');
  const [artSaving, setArtSaving] = useState(false);
  const [artImagePreview, setArtImagePreview] = useState([]);
  const [showArtGallery, setShowArtGallery] = useState(false);
  const [artGallerySelectedItem, setArtGallerySelectedItem] = useState(null);

  const [onboardingStep, setOnboardingStep] = useState(() => {
    return parseInt(getStoredValue(user, 'founder_step') || getStoredValue(user, 'onboarding_step')) || 0;
  });

  const updateOnboardingStep = useCallback((step) => {
    setOnboardingStep(step);
    setStoredValue(user, 'founder_step', step.toString());
    setStoredValue(user, 'onboarding_step', step.toString());
  }, [user]);

  const getFirebaseUser = useCallback(
    () => (user ? { uid: user.uid, email: user.email || null } : null),
    [user]
  );

  const loadMyProfiles = useCallback(async () => {
    if (!user) return;
    setArtistsLoading(true);
    try {
      const res = await generalProfileAPI.getMine(() => getIdToken(), getFirebaseUser, 'founder');
      const data = res.data || res;
      if (data && data.username) {
        // Auto-initialize if it is an empty profile created via admin panel
        const isEmptyProfile = !data.name && !data.title && !data.bio && (!data.links || data.links.length === 0);
        const needsFounderInit = !data.companyName || data.profileType !== 'founder';
        if (isEmptyProfile || !data.isSetup || needsFounderInit) {
          const base = window.location.origin;
          const initializePayload = {
            profileType: 'founder',
            companyName: data.companyName || 'Nexus Tech Labs',
            companyWebsite: data.companyWebsite || 'https://nexustechlabs.com',
            foundingYear: data.foundingYear || '2023',
            fundingStage: '',
            teamSize: '',
            pitchDeckPdf: '',
            ctaLabel: '',
            ctaUrl: '',
            milestones: (data.milestones && data.milestones.length > 0) ? data.milestones : [
              { label: '$1.2M Seed Raised' },
              { label: '50K+ Active Users' },
              { label: 'Top 5 Product Hunt' }
            ],
            coFounders: (data.coFounders && data.coFounders.length > 0) ? data.coFounders : [
              { name: 'Priya Sharma', role: 'Co-Founder & CTO', linkedin: 'https://linkedin.com' },
              { name: 'Aarav Patel', role: 'Head of Product', linkedin: 'https://linkedin.com' }
            ],
            showCompany: data.showCompany !== false,
            showPitchDeck: false,
            showCoFounders: data.showCoFounders !== false,
            showMilestones: data.showMilestones !== false,
            showCta: false,
            name: data.name || 'RAHUL|SHARMA',
            title: data.title || 'Co-Founder & CEO',
            specialization: data.specialization || 'FinTech, AI, SaaS, Venture Capital',
            city: data.city || 'Bengaluru',
            state: data.state || 'Karnataka',
            bio: data.bio || 'Founder building the next generation of intelligent financial infrastructure. Passionate about AI, scalable systems, and building ventures that create long-term impact.',
            email: user?.email || data.email || '',
            photo: data.photo || `${base}/indian_general_avatar.png`,
            banner: data.banner || `${base}/mock_art_folk.png`,
            theme: 'custom-theme',
            font: data.font || 'outfit',
            bioFont: data.bioFont || 'outfit',
            isSetup: true,
            showPhoto: data.showPhoto !== false,
            showName: data.showName !== false,
            showLocation: data.showLocation !== false,
            showSpecialization: data.showSpecialization !== false,
            showAbout: data.showAbout !== false,
            showConnect: data.showConnect !== false,
            showWhatIDo: data.showWhatIDo !== false,
            showArtPortfolio: data.showArtPortfolio !== false,
            showGallery: data.showGallery !== false,
            links: (data.links && data.links.length > 0) ? data.links : [
              { title: 'LinkedIn', platform: 'linkedin', url: 'https://linkedin.com/in/rahulsharma-mock', order: 0 },
              { title: 'Twitter / X', platform: 'twitter', url: 'https://x.com/rahulsharma_mock', order: 1 },
              { title: 'Website', platform: 'website', url: 'https://nexustechlabs.com', order: 2 }
            ],
            artLinks: (data.artLinks && data.artLinks.length > 0) ? data.artLinks : [
              {
                id: Date.now() - 1000,
                title: 'Core Platform & AI Engine',
                description: 'Proprietary financial modeling and automated settlement infrastructure serving high-growth startups.',
                theme: 'digital',
                images: [],
                itemType: 'service'
              },
              {
                id: Date.now(),
                title: 'Venture Advisory & Mentorship',
                description: 'Advising early-stage founders on product-market fit, go-to-market strategies, and seed fundraising.',
                theme: 'illustration',
                images: [],
                itemType: 'service'
              }
            ]
          };
          try {
            const updateRes = await generalProfileAPI.update(initializePayload, () => getIdToken(), getFirebaseUser);
            const updatedData = updateRes.data || updateRes;
            setMyArtists([mapFounderProfileToArtistFormat(updatedData)]);
          } catch (updateErr) {
            console.error('Failed to auto-populate founder profile:', updateErr);
            setMyArtists([mapFounderProfileToArtistFormat(data)]);
          }
        } else {
          setMyArtists([mapFounderProfileToArtistFormat(data)]);
        }
        updateOnboardingStep(0);
      } else {
        setMyArtists([]);
        updateOnboardingStep(0);
      }
    } catch (err) {
      console.warn('Founder profile load:', err.message);
      setMyArtists([]);
      updateOnboardingStep(0);
    } finally {
      setArtistsLoading(false);
      setArtistListReady(true);
    }
  }, [user, getFirebaseUser, updateOnboardingStep]);

  useEffect(() => {
    if (user) {
      loadMyProfiles();
    }
  }, [user, loadMyProfiles]);

  const [previewKey, setPreviewKey] = useState(0);
  const [artistChanged, setArtistChanged] = useState(false);
  const [mobileHeroEditField, setMobileHeroEditField] = useState(null);
  const [mobileLinkEditPlatform, setMobileLinkEditPlatform] = useState(null);
  const [mobileLinkEditId, setMobileLinkEditId] = useState(null);
  const [mobileLinkEditLabel, setMobileLinkEditLabel] = useState('');
  const [mobileLinkEditValue, setMobileLinkEditValue] = useState('');
  const [mobileLinkEditMode, setMobileLinkEditMode] = useState('value');
  const [mobileHeroDraft, setMobileHeroDraft] = useState('');
  const [isUploading, setIsUploading] = useState(null);

  const [savingLink, setSavingLink] = useState(null);
  const [pendingLinks, setPendingLinks] = useState({});
  const [editingHeroField, setEditingHeroField] = useState(null);
  const [heroUpdates, setHeroUpdates] = useState({});
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [tempPlatforms, setTempPlatforms] = useState([]);
  const [syncFonts, setSyncFonts] = useState(true);
  const [loadedArtistId, setLoadedArtistId] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    document.documentElement.classList.toggle('dash-platform-selector-open', !!isSelectorOpen);
    return () => {
      document.body.classList.remove('dash-platform-selector-open');
      document.documentElement.classList.remove('dash-platform-selector-open');
    };
  }, [isSelectorOpen]);

  useEffect(() => {
    if (!myArtists || myArtists.length === 0) return;
    const artist = myArtists[0];
    if (artist && artist.artistId !== loadedArtistId) {
      const isNonEmpty = (v) => {
        if (v === undefined || v === null) return false;
        if (typeof v === 'string') return v.trim() !== '';
        return true;
      };
      const active = ALL_PLATFORMS
        .filter((p) =>
          isNonEmpty(artist[p.id]) ||
          (Array.isArray(artist.links) && artist.links.some(l => (l.platform || '').toLowerCase() === p.id.toLowerCase()))
        )
        .map((p) => p.id);
      setVisiblePlatforms(active);
      setLoadedArtistId(artist.artistId);
    }
  }, [myArtists, loadedArtistId]);

  useEffect(() => {
    if (isMobileViewport) {
      if (editingHeroField === 'name' || editingHeroField === 'specialization') setEditingHeroField(null);
    } else {
      setMobileHeroEditField(null);
    }
  }, [isMobileViewport, editingHeroField]);

  useEffect(() => {
    if (activeTab === 'design' && isMobileViewport && designSubTab == null) {
      setDesignSubTab('theme');
    }
  }, [activeTab, isMobileViewport, designSubTab]);

  useLayoutEffect(() => {
    if (onboardingStep !== 0) return;
    if (!artistListReady) return;

    const first = myArtists[0];
    if (first?.isSetup === true) return;

    updateOnboardingStep(0);
    setFormData(prev => ({
      ...prev,
      name: first?.name || user?.displayName || user?.email?.split('@')[0] || '',
      email: first?.email || user?.email || ''
    }));
  }, [myArtists, onboardingStep, artistListReady, user, updateOnboardingStep]);

  useEffect(() => {
    if (onboardingStep < 1 || onboardingStep > 3) return;
    const email = user?.email || '';
    const displayName = user?.displayName || '';
    if (!email && !displayName) return;
    setFormData((prev) => {
      const next = { ...prev };
      if (email && !String(prev.email || '').trim()) next.email = email;
      if (displayName && !String(prev.name || '').trim()) next.name = displayName;
      return next;
    });
  }, [user?.email, user?.displayName, onboardingStep]);

  const handleUpdateLink = async (platform, value, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(linkId || platform);
    try {
      let finalValue = value;
      if (platform === 'whatsapp' && value && !value.includes('http')) {
        let cleanNumber = value.replace(/\D/g, '');
        if (cleanNumber.length === 10) {
          cleanNumber = '91' + cleanNumber;
        } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
          cleanNumber = '91' + cleanNumber.substring(1);
        }
        finalValue = `https://wa.me/${cleanNumber}`;
      }

      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      const isFirstInstance = linkId
        ? existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase()) === existingLinks.findIndex(l => String(l._id) === String(linkId))
        : true;

      const payload = { profileType: 'founder' };
      if (isFirstInstance) {
        payload[platform] = finalValue;
      }

      let updatedLinks = [];
      if (finalValue === null || (typeof finalValue === 'string' && finalValue.trim() === '')) {
        if (linkId) {
          updatedLinks = existingLinks.filter(l => String(l._id) !== String(linkId));
        } else {
          updatedLinks = existingLinks.filter(l => (l.platform || '').toLowerCase() !== platform.toLowerCase());
        }
        const hasRemaining = updatedLinks.some(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
        if (!hasRemaining) {
          setVisiblePlatforms(prev => prev.filter(p => p !== platform));
        }
      } else {
        let idx = -1;
        if (linkId) {
          idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
        } else {
          idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
        }

        const platformObj = ALL_PLATFORMS.find(p => p.id === platform);
        const existingTitle = idx > -1 ? existingLinks[idx].title : null;
        const existingImage = idx > -1 ? existingLinks[idx].image : null;
        const newLink = {
          ...(idx > -1 ? existingLinks[idx] : {}),
          platform,
          url: finalValue,
          title: existingTitle || (platformObj ? platformObj.label : platform.charAt(0).toUpperCase() + platform.slice(1)),
          image: existingImage,
          order: idx > -1 ? (existingLinks[idx].order || 0) : existingLinks.length
        };

        if (idx > -1) {
          existingLinks[idx] = newLink;
          updatedLinks = existingLinks;
        } else {
          updatedLinks = [...existingLinks, newLink];
        }
      }
      payload.links = updatedLinks;

      const res = await generalProfileAPI.update(
        payload,
        () => getIdToken(),
        getFirebaseUser
      );

      if (res && res.success === false) {
        throw new Error(res.message || 'The server rejected this update.');
      }

      setMyArtists(prev => prev.map((a, j) => j === 0 ? mapFounderProfileToArtistFormat(res.data) : a));
      setPendingLinks(prev => {
        const next = { ...prev };
        delete next[linkId || platform];
        return next;
      });
    } catch (err) {
      console.error('Failed to update link:', err);
      window.alert('Failed to save link. Please try again.');
    } finally {
      setSavingLink(null);
    }
  };

  const handleUpdateHeroField = async (field, value, extraPayload = {}) => {
    const artist = myArtists[0];
    if (!artist) return;
    setSavingLink(field);
    try {
      const payload = { profileType: 'founder', [field]: value, ...extraPayload };
      const res = await generalProfileAPI.update(payload, () => getIdToken(), getFirebaseUser);
      if (res && res.success === false) {
        throw new Error(res.message || 'The server rejected this update.');
      }
      setMyArtists(prev => prev.map((a, j) => j === 0 ? mapFounderProfileToArtistFormat(res.data) : a));
      setArtistChanged(true);
      setPreviewKey(k => k + 1);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      window.alert(`Failed to save ${field}. Please try again.`);
    } finally {
      setSavingLink(null);
    }
  };

  const handleAddTag = async () => {
    const artist = myArtists[0];
    if (!artist || !newTagText.trim()) return;
    const currentTags = artist.specialization ? artist.specialization.split(',').map(t => t.trim()).filter(Boolean) : [];
    if (!currentTags.includes(newTagText.trim())) {
      const updated = [...currentTags, newTagText.trim()].join(', ');
      await handleUpdateHeroField('specialization', updated);
    }
    setNewTagText('');
    setIsAddingTag(false);
  };

  const handleDeleteTag = async (tagToDelete) => {
    const artist = myArtists[0];
    if (!artist) return;
    const currentTags = artist.specialization ? artist.specialization.split(',').map(t => t.trim()).filter(Boolean) : [];
    const updated = currentTags.filter(t => t !== tagToDelete).join(', ');
    await handleUpdateHeroField('specialization', updated);
  };

  const openHeroEditor = (field) => {
    setEditingHeroField(field);
    const artist = myArtists[0];
    if (!artist) return;
    if (field === 'name') setMobileHeroDraft(artist.name || '');
    if (field === 'specialization') setMobileHeroDraft(artist.specialization || '');
  };

  const saveMobileHeroField = async () => {
    if (!mobileHeroEditField) return;
    await handleUpdateHeroField(mobileHeroEditField, mobileHeroDraft);
    setMobileHeroEditField(null);
  };

  const handleUpdateLinkLabel = async (platform, newTitle, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
    let idx = -1;
    if (linkId) {
      idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
    } else {
      idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
    }
    if (idx === -1) return;
    existingLinks[idx] = { ...existingLinks[idx], title: newTitle };
    await handleUpdateHeroField('links', existingLinks);
  };

  const openLinkPopup = (platform, linkId, label, value, mode = 'value') => {
    setMobileLinkEditPlatform(platform);
    setMobileLinkEditId(linkId);
    setMobileLinkEditLabel(label);
    setMobileLinkEditValue(value || '');
    setMobileLinkEditMode(mode);
  };

  const saveMobileLinkField = async () => {
    if (!mobileLinkEditPlatform) return;
    if (mobileLinkEditMode === 'title') {
      await handleUpdateLinkLabel(mobileLinkEditPlatform, mobileLinkEditValue, mobileLinkEditId);
    } else {
      await handleUpdateLink(mobileLinkEditPlatform, mobileLinkEditValue, mobileLinkEditId);
    }
    setMobileLinkEditPlatform(null);
  };

  const handleUpdateLinkImage = async (platform, file, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    try {
      const up = await generalProfileAPI.uploadPhoto(file, () => getIdToken());
      const imageUrl = extractUploadUrl(up);
      if (!imageUrl) throw new Error('Could not get uploaded image URL');
      const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
      let idx = -1;
      if (linkId) {
        idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
      } else {
        idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
      }
      if (idx === -1) return;
      existingLinks[idx] = { ...existingLinks[idx], image: imageUrl };
      await handleUpdateHeroField('links', existingLinks);
    } catch (err) {
      console.error('Failed to upload link image:', err);
      window.alert('Failed to upload image. Please try again.');
    }
  };

  const handleRemoveLinkImage = async (platform, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
    let idx = -1;
    if (linkId) {
      idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
    } else {
      idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
    }
    if (idx === -1) return;
    existingLinks[idx] = { ...existingLinks[idx], image: '' };
    await handleUpdateHeroField('links', existingLinks);
  };

  const handleUpdateLinkLayout = async (platform, layoutType, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
    let idx = -1;
    if (linkId) {
      idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
    } else {
      idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
    }
    if (idx === -1) return;
    existingLinks[idx] = { ...existingLinks[idx], layoutType };
    await handleUpdateHeroField('links', existingLinks);
  };

  const handleUpdateLinkPrioritize = async (platform, prioritizeType, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
    let idx = -1;
    if (linkId) {
      idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
    } else {
      idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
    }
    if (idx === -1) return;
    existingLinks[idx] = { ...existingLinks[idx], prioritizeType };
    await handleUpdateHeroField('links', existingLinks);
  };

  const handleUpdateLinkAnimation = async (platform, animationType, linkId = null) => {
    const artist = myArtists[0];
    if (!artist) return;
    const existingLinks = Array.isArray(artist.links) ? [...artist.links] : [];
    let idx = -1;
    if (linkId) {
      idx = existingLinks.findIndex(l => String(l._id) === String(linkId));
    } else {
      idx = existingLinks.findIndex(l => (l.platform || '').toLowerCase() === platform.toLowerCase());
    }
    if (idx === -1) return;
    existingLinks[idx] = { ...existingLinks[idx], animationType };
    await handleUpdateHeroField('links', existingLinks);
  };

  const handleReorderLinks = async (reorderedLinks) => {
    await handleUpdateHeroField('links', reorderedLinks);
  };

  const handleUploadField = async (field, file) => {
    setIsUploading(field);
    try {
      const up = await generalProfileAPI.uploadPhoto(file, () => getIdToken());
      const imageUrl = extractUploadUrl(up);
      if (!imageUrl) throw new Error('Could not get uploaded image URL');
      const targetField = field === 'backgroundPhoto' ? 'banner' : field;
      await handleUpdateHeroField(targetField, imageUrl);
    } catch (err) {
      console.error(`Failed to upload ${field}:`, err);
      window.alert(`Failed to upload ${field}. Please try again.`);
    } finally {
      setIsUploading(null);
    }
  };

  const handlePlatformDone = () => {
    tempPlatforms.forEach(p => {
      if (!visiblePlatforms.includes(p)) {
        setVisiblePlatforms(prev => [...prev, p]);
      }
    });
    setIsSelectorOpen(false);
  };

  const togglePlatformInSelector = (platformId) => {
    setTempPlatforms(prev =>
      prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]
    );
  };

  const handleOnboardingComplete = async () => {
    try {
      setSaving(true);
      setError('');

      let uploadedPhoto = '';
      if (photoFile) {
        const up = await generalProfileAPI.uploadPhoto(photoFile, () => getIdToken());
        uploadedPhoto = extractUploadUrl(up) || '';
      }

      const rawName = String(formData.name || '').trim();
      const parts = rawName.split(/\s+/).filter(Boolean);
      const name = parts.length > 1 ? `${parts[0]}|${parts.slice(1).join(' ')}` : rawName;

      const base = window.location.origin;
      const initialPhoto = uploadedPhoto || `${base}/indian_general_avatar.png`;

      const linksArray = onboardingPlatforms.map((pid, idx) => {
        let url = formData[pid] || '';
        if (pid === 'whatsapp' && formData._wa_phone) {
          url = buildWhatsAppUrlFromFullINPhone(formData._wa_phone, formData._wa_msg || '');
        }
        const platformObj = ALL_PLATFORMS.find(p => p.id === pid);
        return {
          title: platformObj ? platformObj.label : pid,
          url,
          platform: pid,
          order: idx
        };
      }).filter(l => Boolean(l.url));

      const payload = {
        name,
        username: (formData.artistId || '').toLowerCase().trim(),
        specialization: formData.specialization || '',
        title: formData.experience || 'Co-Founder & CEO',
        companyName: formData.companyName || '',
        companyWebsite: formData.companyWebsite || '',
        foundingYear: formData.foundingYear || '2023',
        fundingStage: '',
        teamSize: '',
        pitchDeckPdf: '',
        ctaLabel: '',
        ctaUrl: '',
        milestones: formData.milestones || [
          { label: '$1.2M Seed Raised' },
          { label: '50K+ Active Users' },
          { label: 'Top 5 Product Hunt' }
        ],
        coFounders: formData.coFounders || [
          { name: 'Priya Sharma', role: 'Co-Founder & CTO', linkedin: 'https://linkedin.com' },
          { name: 'Aarav Patel', role: 'Head of Product', linkedin: 'https://linkedin.com' }
        ],
        showCompany: true,
        showPitchDeck: false,
        showCoFounders: true,
        showMilestones: true,
        showCta: false,
        bio: formData.bio || '',
        email: formData.email || user?.email || '',
        phone: formData.phone || '',
        photo: initialPhoto,
        theme: 'custom-theme', // Artist profile signature colors!
        font: 'outfit',
        bioFont: 'outfit',
        profileType: 'founder',
        isSetup: true,
        showPhoto: true,
        showName: true,
        showLocation: true,
        showSpecialization: true,
        showAbout: true,
        showConnect: true,
        showWhatIDo: true,
        showArtPortfolio: true,
        showGallery: true,
        links: linksArray,
        artLinks: [
          {
            id: Date.now() - 1000,
            title: 'Core Platform & AI Engine',
            description: 'Proprietary financial modeling and automated settlement infrastructure serving high-growth startups.',
            theme: 'digital',
            images: [],
            itemType: 'service'
          },
          {
            id: Date.now(),
            title: 'Venture Advisory & Mentorship',
            description: 'Advising early-stage founders on product-market fit, go-to-market strategies, and seed fundraising.',
            theme: 'illustration',
            images: [],
            itemType: 'service'
          }
        ]
      };

      const getIdTokenFn = () => getIdToken();
      const getFirebaseUserFn = getFirebaseUser;
      let res;
      try {
        const existing = await generalProfileAPI.getMine(getIdTokenFn, getFirebaseUserFn, 'founder');
        if (existing && existing.data) {
          res = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        } else {
          res = await generalProfileAPI.create(payload, getIdTokenFn, getFirebaseUserFn);
        }
      } catch (innerErr) {
        if ((innerErr.message || '').toLowerCase().includes('already have a')) {
          res = await generalProfileAPI.update(payload, getIdTokenFn, getFirebaseUserFn);
        } else {
          throw innerErr;
        }
      }

      await loadMyProfiles();
      updateOnboardingStep(0);
    } catch (err) {
      console.error('Founder onboarding error:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfileWithUsername = async (username) => {
    try {
      setSaving(true);
      setError('');

      const base = window.location.origin;
      const payload = {
        username: username.toLowerCase().trim(),
        name: 'RAHUL|SHARMA',
        title: 'Co-Founder & CEO',
        specialization: 'FinTech, AI, SaaS, Venture Capital',
        companyName: 'Nexus Tech Labs',
        companyWebsite: 'https://nexustechlabs.com',
        foundingYear: '2023',
        fundingStage: '',
        teamSize: '',
        pitchDeckPdf: '',
        ctaLabel: '',
        ctaUrl: '',
        milestones: [
          { label: '$1.2M Seed Raised' },
          { label: '50K+ Active Users' },
          { label: 'Top 5 Product Hunt' }
        ],
        coFounders: [
          { name: 'Priya Sharma', role: 'Co-Founder & CTO', linkedin: 'https://linkedin.com' },
          { name: 'Aarav Patel', role: 'Head of Product', linkedin: 'https://linkedin.com' }
        ],
        showCompany: true,
        showPitchDeck: false,
        showCoFounders: true,
        showMilestones: true,
        showCta: false,
        city: 'Bengaluru',
        state: 'Karnataka',
        bio: 'Founder building the next generation of intelligent financial infrastructure. Passionate about AI, scalable systems, and building ventures that create long-term impact.',
        email: user?.email || '',
        photo: `${base}/indian_general_avatar.png`,
        banner: `${base}/mock_art_folk.png`,
        theme: 'custom-theme',
        font: 'outfit',
        bioFont: 'outfit',
        profileType: 'founder',
        isSetup: true,
        showPhoto: true,
        showName: true,
        showLocation: true,
        showSpecialization: true,
        showAbout: true,
        showConnect: true,
        showWhatIDo: true,
        showArtPortfolio: true,
        showGallery: true,
        links: [
          { title: 'LinkedIn', platform: 'linkedin', url: 'https://linkedin.com/in/rahulsharma-mock', order: 0 },
          { title: 'Twitter / X', platform: 'twitter', url: 'https://x.com/rahulsharma_mock', order: 1 },
          { title: 'Website', platform: 'website', url: 'https://example.com', order: 2 }
        ],
        artLinks: [
          {
            id: Date.now() - 1000,
            title: 'Core Platform & AI Engine',
            description: 'Proprietary financial modeling and automated settlement infrastructure serving high-growth startups.',
            theme: 'digital',
            images: [],
            itemType: 'service'
          },
          {
            id: Date.now(),
            title: 'Venture Advisory & Mentorship',
            description: 'Advising early-stage founders on product-market fit, go-to-market strategies, and seed fundraising.',
            theme: 'illustration',
            images: [],
            itemType: 'service'
          }
        ]
      };

      const res = await generalProfileAPI.create(payload, () => getIdToken(), getFirebaseUser);
      if (res && res.success === false) {
        throw new Error(res.message || 'Failed to create profile.');
      }
      await loadMyProfiles();
    } catch (err) {
      console.error('Failed to auto-create founder profile:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.displayName || user?.email || 'Founder Profile';
  const displayEmail = user?.email || '';
  const avatarLetter = user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?';

  const artist = myArtists[0];

  const dashboardProps = {
    user,
    displayName,
    displayEmail,
    avatarLetter,
    handleLogout,
    cropper,
    isMobileViewport,
    error,
    loading: artistsLoading,
    artistsLoading,
    artist,
    myArtists,
    showUsernamePopup: artistListReady && myArtists.length === 0,
    handleCreateProfileWithUsername,
    setProfileMode,
    setProfileLock,
    setChoiceSource,
    activeTab,
    setActiveTab,
    activeEditor,
    setActiveEditor,
    dashTheme,
    dashFont,
    previewKey,
    frontendBase,
    isSelectorOpen,
    tempPlatforms,
    togglePlatformInSelector,
    handlePlatformDone,
    linkCopiedArtist,
    setLinkCopiedArtist,
    saving,
    artistChanged,
    setArtistChanged,
    inlineEditing,
    setInlineEditing,
    inlineEditValue,
    setInlineEditValue,
    artQrModal,
    setArtQrModal,
    handleUpdateLink,
    handleUpdateHeroField,
    handleAddTag,
    handleDeleteTag,
    openHeroEditor,
    saveMobileHeroField,
    handleUpdateLinkLabel,
    openLinkPopup,
    saveMobileLinkField,
    handleUpdateLinkImage,
    handleRemoveLinkImage,
    handleUpdateLinkLayout,
    handleUpdateLinkPrioritize,
    handleUpdateLinkAnimation,
    handleReorderLinks,
    handleUploadField,
    handlePickAndCrop,
    handlePickAndCropBatch,
    isUploading,
    mobileHeroEditField,
    setMobileHeroEditField,
    mobileHeroDraft,
    setMobileHeroDraft,
    mobileLinkEditPlatform,
    mobileLinkEditId,
    mobileLinkEditLabel,
    mobileLinkEditValue,
    mobileLinkEditMode,
    setMobileLinkEditValue,
    savingLink,
    designSubTab,
    setDesignSubTab,
    setIsSelectorOpen,
    setError,
    loadMyProfiles,
    setPreviewKey,
    openSubPanel,
    setOpenSubPanel,
    layoutActiveTab,
    setLayoutActiveTab,
    setTempPlatforms,
    setSaving,
    setMyArtists,
    getIdToken,
    getFirebaseUser,
    editingHeroField,
    setEditingHeroField,
    heroUpdates,
    setHeroUpdates,
    isAddingTag,
    setIsAddingTag,
    newTagText,
    setNewTagText,
    syncFonts,
    setSyncFonts,
    dashboardTitle: 'Founder Profile'
  };

  if (onboardingStep > 0) {
    return (
      <>
        <ProfileFounderOnboardingWizard
          onboardingStep={onboardingStep}
          handleOnboardingBack={() => updateOnboardingStep(onboardingStep - 1)}
          handleOnboardingNext={() => updateOnboardingStep(onboardingStep + 1)}
          handleOnboardingComplete={handleOnboardingComplete}
          formData={formData}
          setFormData={setFormData}
          isOnboardingSelectorOpen={isOnboardingSelectorOpen}
          setIsOnboardingSelectorOpen={setIsOnboardingSelectorOpen}
          onboardingPlatforms={onboardingPlatforms}
          setOnboardingPlatforms={setOnboardingPlatforms}
          ALL_PLATFORMS={ALL_PLATFORMS}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          bgFile={bgFile}
          setBgFile={setBgFile}
          error={error}
          saving={saving}
          handleLogout={handleLogout}
          handlePickAndCrop={handlePickAndCrop}
          handlePickAndCropBatch={handlePickAndCropBatch}
        />
        {cropper.open && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000000 }}>
            <ImageCropperModal
              image={cropper.image}
              aspect={cropper.aspect}
              onSave={cropper.onComplete}
              onCancel={cropper.onCancel}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <ProfileGeneralDashboard {...dashboardProps} dashboardTitle="Founder Profile" />
  );
}
