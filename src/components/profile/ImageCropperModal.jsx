import React, { useState, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import InstagramArtworkCropper from './InstagramArtworkCropper';
import './ImageCropperModal.css';

export { InstagramArtworkCropper };

/**
 * 3 Official Instagram Crop Options & Output Dimensions
 */
export const INSTAGRAM_RATIOS = [
  {
    id: '1:1',
    label: 'Square',
    aspect: 1, // 1080 / 1080
    outputWidth: 1080,
    outputHeight: 1080,
    badge: '1080 × 1080',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
        <rect x="4" y="4" width="16" height="16" rx="3.5" />
      </svg>
    ),
  },
  {
    id: '1.91:1',
    label: 'Landscape',
    aspect: 1080 / 566, // ~1.9081:1
    outputWidth: 1080,
    outputHeight: 566,
    badge: '1080 × 566',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
        <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      </svg>
    ),
  },
  {
    id: '9:16',
    label: 'Stories & Reels',
    aspect: 9 / 16, // 1080 / 1920 = 0.5625
    outputWidth: 1080,
    outputHeight: 1920,
    badge: '1080 × 1920',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
        <rect x="5.5" y="2.5" width="13" height="19" rx="3" />
      </svg>
    ),
  },
];

export default function ImageCropperModal({
  image,
  aspect = 1,
  onSave,
  onCancel,
  title = 'Adjust Photo',
  subtitle = 'Move the frame • Zoom • Rotate',
}) {
  // Determine initial aspect ratio based on aspect prop
  const initialRatio = useMemo(() => {
    if (!aspect || Math.abs(aspect - 1) < 0.05) return '1:1';
    if (aspect > 1.3) return '1.91:1';
    if (aspect < 0.85) return '9:16';
    return '1:1';
  }, [aspect]);

  const [selectedRatioId, setSelectedRatioId] = useState(initialRatio);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Active ratio object
  const activeRatio = INSTAGRAM_RATIOS.find((r) => r.id === selectedRatioId) || INSTAGRAM_RATIOS[0];

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Ratio switch preserves user's current zoom and position
  const handleRatioSelect = (ratioId) => {
    if (ratioId === selectedRatioId) return;
    setSelectedRatioId(ratioId);
  };

  // Reset adjustments
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  // Rotate handlers
  const rotateLeft  = () => setRotation((r) => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation((r) => (r + 90) % 360);

  // Zoom helpers
  const handleZoomOut = () => setZoom((z) => Math.max(1, Math.round((z - 0.2) * 10) / 10));
  const handleZoomIn  = () => setZoom((z) => Math.min(3, Math.round((z + 0.2) * 10) / 10));

  // Save handler passes target dimensions (1080x1080, 1080x566, 1080x1920)
  const handleSave = async () => {
    if (!croppedAreaPixels || isSaving) return;
    setIsSaving(true);
    try {
      const targetDimensions = {
        width: activeRatio.outputWidth,
        height: activeRatio.outputHeight,
        ratioId: activeRatio.id,
      };
      await onSave(croppedAreaPixels, rotation, targetDimensions);
    } catch (err) {
      console.error('Error saving cropped image:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="crop-modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 select-none touch-none"
      onClick={onCancel}
    >
      <div
        className="crop-modal-card bg-white text-slate-800 rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg flex flex-col overflow-visible animate-in fade-in zoom-in-95 duration-200 max-h-[94dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="crop-modal-header p-5 text-center border-b border-slate-100 flex-shrink-0">
          <div className="crop-modal-header-top">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{title}</h3>
            <span className="crop-dimension-pill">{activeRatio.badge} px</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {/* Cropper Viewport */}
        <div className="crop-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={activeRatio.aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
            objectFit="cover"
          />
        </div>

        {/* Aspect Ratio Options Bar (Instagram Ratios: 1:1, 1.91:1, 9:16) */}
        <div className="crop-ratio-bar">
          <div className="crop-ratio-tabs">
            {INSTAGRAM_RATIOS.map((item) => {
              const isSelected = item.id === selectedRatioId;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`crop-ratio-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => handleRatioSelect(item.id)}
                  aria-pressed={isSelected}
                  title={`${item.label} (${item.badge} px)`}
                >
                  <span className="crop-ratio-icon">{item.icon}</span>
                  <div className="crop-ratio-meta">
                    <span className="crop-ratio-text">{item.id}</span>
                    <span className="crop-ratio-name">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="crop-controls px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="crop-control-mini-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <span className="crop-zoom-label text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
            Zoom
          </span>

          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.02}
            aria-label="Zoom"
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="crop-zoom-slider cursor-pointer flex-1"
          />

          <button
            type="button"
            className="crop-control-mini-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <span className="crop-zoom-percent">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Rotate & Reset Row */}
        <div className="crop-rotate-row">
          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateLeft}
            aria-label="Rotate left 90°"
            title="Rotate left 90°"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M2.5 2v6h6" />
              <path d="M2.66 15.57a10 10 0 1 0 .57-8.38" />
            </svg>
          </button>

          {/* Quick Reset to original center & 1x */}
          <button
            type="button"
            className="crop-reset-btn"
            onClick={handleReset}
            title="Reset position and zoom"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset</span>
          </button>

          <span className="crop-rotation-badge">{rotation}°</span>

          <button
            type="button"
            className="crop-rotate-btn"
            onClick={rotateRight}
            aria-label="Rotate right 90°"
            title="Rotate right 90°"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                 strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
            </svg>
          </button>
        </div>

        {/* Footer actions */}
        <div className="crop-modal-footer p-5 flex gap-3 shrink-0 bg-slate-50/70 border-t border-slate-100 rounded-b-3xl">
          <button
            type="button"
            className="crop-btn-cancel flex-1 py-3 px-5 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-base hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="crop-btn-save flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="crop-mini-spinner" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save & Crop</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
