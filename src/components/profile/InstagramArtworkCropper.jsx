import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg, { getCroppedFile } from '../../utils/cropImage';
import './InstagramArtworkCropper.css';

/**
 * 3 Official Instagram Aspect Ratios & Output Dimensions
 */
export const INSTAGRAM_RATIOS = [
  {
    id: '1:1',
    label: 'Square',
    subLabel: 'Feed Post',
    aspect: 1, // 1080 / 1080
    outputWidth: 1080,
    outputHeight: 1080,
    badge: '1080 × 1080 px',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
        <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      </svg>
    ),
  },
  {
    id: '1.91:1',
    label: 'Landscape',
    subLabel: 'Wide Feed',
    aspect: 1080 / 566, // ~1.9081:1
    outputWidth: 1080,
    outputHeight: 566,
    badge: '1080 × 566 px',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
        <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      </svg>
    ),
  },
  {
    id: '9:16',
    label: 'Stories & Reels',
    subLabel: 'Full Screen',
    aspect: 9 / 16, // 1080 / 1920 = 0.5625
    outputWidth: 1080,
    outputHeight: 1920,
    badge: '1080 × 1920 px',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
        <rect x="5.5" y="2.5" width="13" height="19" rx="3" />
      </svg>
    ),
  },
];

/**
 * InstagramArtworkCropper
 * 
 * Props:
 *  - image: string | File | Blob (optional initial artwork image)
 *  - initialRatioId: '1:1' | '1.91:1' | '9:16' (default: '1:1')
 *  - onApply: function({ file, blob, dataUrl, width, height, ratioId, pixelCrop })
 *  - onCancel: function()
 *  - title: string (default: 'Crop Artwork')
 *  - isModal: boolean (default: true)
 */
export default function InstagramArtworkCropper({
  image: initialImage = null,
  initialRatioId = '1:1',
  onApply,
  onSave,
  onCancel,
  title = 'Crop Artwork',
  isModal = true,
}) {
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedRatioId, setSelectedRatioId] = useState(initialRatioId);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Find active ratio config
  const activeRatio = INSTAGRAM_RATIOS.find((r) => r.id === selectedRatioId) || INSTAGRAM_RATIOS[0];

  // Initialize or handle image change
  useEffect(() => {
    if (!initialImage) {
      setCurrentImage(null);
      return;
    }

    if (typeof initialImage === 'string') {
      setCurrentImage(initialImage);
    } else if (initialImage instanceof File || initialImage instanceof Blob) {
      const url = URL.createObjectURL(initialImage);
      setCurrentImage(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [initialImage]);

  // Load new file from input or drag-drop
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setCurrentImage(blobUrl);
    // Reset transform when new artwork is loaded
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPreviewMode(false);
    setPreviewDataUrl(null);
  };

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Aspect ratio switcher:
  // Preserves user's current zoom and position, adapts smoothly without reloading image
  const handleRatioSelect = (ratioId) => {
    if (ratioId === selectedRatioId) return;
    setSelectedRatioId(ratioId);
    setPreviewMode(false);
    setPreviewDataUrl(null);
  };

  // Reset adjustments
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPreviewMode(false);
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPreviewMode(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(4, Math.round((z + 0.2) * 10) / 10));
  const handleZoomOut = () => setZoom((z) => Math.max(1, Math.round((z - 0.2) * 10) / 10));

  // Toggle Live Preview
  const handleTogglePreview = async () => {
    if (previewMode) {
      setPreviewMode(false);
      return;
    }
    if (!currentImage || !croppedAreaPixels) return;

    setIsGeneratingPreview(true);
    try {
      const url = await getCroppedImg(
        currentImage,
        croppedAreaPixels,
        rotation,
        { width: activeRatio.outputWidth, height: activeRatio.outputHeight },
        'image/jpeg',
        0.92
      );
      setPreviewDataUrl(url);
      setPreviewMode(true);
    } catch (err) {
      console.error('Preview generation failed:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Apply & Export
  const handleApply = async () => {
    if (!currentImage || !croppedAreaPixels) return;
    setIsExporting(true);
    try {
      const targetDimensions = {
        width: activeRatio.outputWidth,
        height: activeRatio.outputHeight,
      };

      const result = await getCroppedFile(
        currentImage,
        croppedAreaPixels,
        rotation,
        targetDimensions,
        `artwork-instagram-${activeRatio.id.replace(':', '-')}-${Date.now()}.jpg`,
        'image/jpeg',
        0.95
      );

      if (onApply) {
        onApply({
          file: result.file,
          blob: result.blob,
          dataUrl: result.dataUrl,
          width: targetDimensions.width,
          height: targetDimensions.height,
          ratioId: activeRatio.id,
          pixelCrop: croppedAreaPixels,
        });
      }
      if (onSave) {
        onSave(croppedAreaPixels, rotation, targetDimensions, result);
      }
    } catch (err) {
      console.error('Cropping export failed:', err);
      alert('Could not export cropped artwork. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Standalone Download button (convenient for users testing directly)
  const handleDownloadCropped = async () => {
    if (!currentImage || !croppedAreaPixels) return;
    try {
      const targetDimensions = {
        width: activeRatio.outputWidth,
        height: activeRatio.outputHeight,
      };
      const url = await getCroppedImg(
        currentImage,
        croppedAreaPixels,
        rotation,
        targetDimensions,
        'image/jpeg',
        0.95
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram-art-${activeRatio.id.replace(':', '-')}-${targetDimensions.width}x${targetDimensions.height}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const containerContent = (
    <div
      className={`ig-crop-card ${isModal ? 'ig-crop-card-modal' : 'ig-crop-card-inline'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header */}
      <header className="ig-crop-header">
        <div className="ig-crop-header-left">
          {onCancel && (
            <button
              type="button"
              className="ig-btn-cancel"
              onClick={onCancel}
              aria-label="Cancel crop"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="ig-crop-header-center">
          <div className="ig-crop-title-row">
            <span className="ig-crop-title">{title}</span>
            <span className="ig-crop-dimension-badge">{activeRatio.badge}</span>
          </div>
          <span className="ig-crop-subhead">
            {activeRatio.label} ({activeRatio.id}) • Drag & Zoom to frame
          </span>
        </div>

        <div className="ig-crop-header-right">
          {currentImage && (
            <button
              type="button"
              className="ig-btn-apply"
              onClick={handleApply}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="ig-spinner" />
                  <span>Exporting…</span>
                </>
              ) : (
                <>
                  <span>Apply</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Crop Body */}
      <div className="ig-crop-main">
        {currentImage ? (
          <div className="ig-crop-stage">
            {/* Viewport Frame */}
            <div className={`ig-crop-viewport-container ig-ratio-${activeRatio.id.replace(':', '-')}`}>
              {!previewMode ? (
                <div className="ig-crop-cropper-wrap">
                  <Cropper
                    image={currentImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={activeRatio.aspect}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    showGrid={showGrid}
                    objectFit="cover"
                    classes={{
                      containerClassName: 'ig-cropper-container',
                      mediaClassName: 'ig-cropper-media',
                      cropAreaClassName: 'ig-cropper-crop-area',
                    }}
                  />
                  {/* Subtle Instagram corner marks */}
                  <div className="ig-crop-corner-guides pointer-events-none" />
                </div>
              ) : (
                /* Live Preview Mode */
                <div className="ig-preview-display">
                  {isGeneratingPreview ? (
                    <div className="ig-preview-loading">
                      <span className="ig-spinner" />
                      <span>Generating preview…</span>
                    </div>
                  ) : previewDataUrl ? (
                    <div className="ig-preview-content">
                      <img
                        src={previewDataUrl}
                        alt="Cropped artwork preview"
                        className="ig-preview-image"
                        style={{ aspectRatio: `${activeRatio.outputWidth} / ${activeRatio.outputHeight}` }}
                      />
                      <div className="ig-preview-tag">
                        <span>{activeRatio.label} ({activeRatio.outputWidth}×{activeRatio.outputHeight} px)</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Quick action floating pills */}
            <div className="ig-crop-floating-actions">
              <button
                type="button"
                className={`ig-action-pill ${previewMode ? 'active' : ''}`}
                onClick={handleTogglePreview}
                title={previewMode ? 'Back to Crop editor' : 'Preview final export'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{previewMode ? 'Edit Crop' : 'Preview'}</span>
              </button>

              <button
                type="button"
                className="ig-action-pill"
                onClick={handleReset}
                title="Reset zoom and reposition to center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="ig-action-pill"
                onClick={handleRotate}
                title="Rotate 90° clockwise"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21.5 2v6h-6" />
                  <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
                </svg>
                <span>{rotation !== 0 ? `${rotation}°` : 'Rotate'}</span>
              </button>

              <button
                type="button"
                className={`ig-action-pill ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Toggle Rule-of-Thirds Grid"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                <span>Grid</span>
              </button>

              <button
                type="button"
                className="ig-action-pill"
                onClick={() => fileInputRef.current?.click()}
                title="Replace artwork image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Change Image</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty / Upload State */
          <div
            className={`ig-crop-dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="ig-dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-12 h-12">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="ig-dropzone-title">Upload Artwork to Crop</h3>
            <p className="ig-dropzone-sub">
              Drag and drop high-resolution artwork here, or <span className="ig-text-link">browse files</span>
            </p>
            <div className="ig-dropzone-badges">
              <span>Square 1080×1080</span>
              <span>Landscape 1080×566</span>
              <span>Stories 1080×1920</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileChange(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* Zoom Controls Bar */}
      {currentImage && !previewMode && (
        <div className="ig-crop-zoom-bar">
          <button
            type="button"
            className="ig-zoom-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <div className="ig-zoom-slider-wrap">
            <input
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="ig-zoom-slider"
              aria-label="Zoom artwork"
            />
          </div>

          <button
            type="button"
            className="ig-zoom-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <span className="ig-zoom-indicator">{Math.round(zoom * 100)}%</span>
        </div>
      )}

      {/* Aspect Ratio Selector Bar */}
      <footer className="ig-crop-footer">
        <div className="ig-ratio-selector-label">
          <span>Aspect Ratio</span>
        </div>

        <div className="ig-ratio-button-group">
          {INSTAGRAM_RATIOS.map((item) => {
            const isSelected = item.id === selectedRatioId;
            return (
              <button
                key={item.id}
                type="button"
                className={`ig-ratio-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleRatioSelect(item.id)}
                aria-pressed={isSelected}
              >
                <div className="ig-ratio-btn-icon">{item.icon}</div>
                <div className="ig-ratio-btn-text">
                  <span className="ig-ratio-btn-ratio">{item.id}</span>
                  <span className="ig-ratio-btn-name">{item.label}</span>
                </div>
                {isSelected && <span className="ig-ratio-btn-pill">{item.outputWidth}×{item.outputHeight}</span>}
              </button>
            );
          })}
        </div>

        {/* Mobile / Direct actions bar */}
        <div className="ig-mobile-actions-bar">
          {onCancel && (
            <button type="button" className="ig-btn-cancel-mobile" onClick={onCancel}>
              Cancel
            </button>
          )}

          {currentImage && (
            <>
              <button
                type="button"
                className="ig-btn-download-direct"
                onClick={handleDownloadCropped}
                title="Download image at exact dimensions"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Save to Device</span>
              </button>

              <button
                type="button"
                className="ig-btn-apply-mobile"
                onClick={handleApply}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting…' : 'Apply Crop'}
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );

  if (!isModal) {
    return <div className="ig-crop-wrapper-inline">{containerContent}</div>;
  }

  return (
    <div
      className="ig-crop-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Instagram Artwork Cropper"
    >
      {containerContent}
    </div>
  );
}
