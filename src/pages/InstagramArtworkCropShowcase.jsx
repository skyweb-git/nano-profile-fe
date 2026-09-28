import React, { useState } from 'react';
import InstagramArtworkCropper, { INSTAGRAM_RATIOS } from '../components/profile/InstagramArtworkCropper';
import './InstagramArtworkCropShowcase.css';

// Sample high-resolution artworks for quick testing
const PRESET_ARTWORKS = [
  {
    id: 'abstract',
    title: 'Neon Prism Abstract',
    artist: 'Digital Studio',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1600&auto=format&fit=crop&q=85',
  },
  {
    id: 'cyberpunk',
    title: 'Cyberpunk Metropolis',
    artist: 'Vivid Render',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85',
  },
  {
    id: 'landscape',
    title: 'Alpine Mist Sunset',
    artist: 'Nature Series',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=85',
  },
  {
    id: 'mural',
    title: 'Street Art Canvas',
    artist: 'Urban Collective',
    url: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=1600&auto=format&fit=crop&q=85',
  },
];

export default function InstagramArtworkCropShowcase() {
  const [selectedArtworkUrl, setSelectedArtworkUrl] = useState(PRESET_ARTWORKS[0].url);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [lastExport, setLastExport] = useState(null);
  const [viewTab, setViewTab] = useState('editor'); // 'editor' | 'preview-mockup'

  const handleApplyCrop = (cropResult) => {
    setLastExport(cropResult);
    setIsEditorOpen(false);
  };

  const handleDownload = (dataUrl, fileName) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName || 'instagram-cropped-artwork.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="ig-showcase-page">
      {/* Top Banner / Hero */}
      <header className="ig-showcase-hero">
        <div className="ig-showcase-container">
          <div className="ig-showcase-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>Instagram-Style Artwork Crop</span>
          </div>

          <h1 className="ig-showcase-title">
            Artwork Upload & <span>Instagram Cropping</span> Feature
          </h1>
          <p className="ig-showcase-desc">
            Load original artwork non-destructively, switch between 1:1 Square, 1.91:1 Landscape, and 9:16 Stories/Reels,
            and export at exact pixel dimensions (1080×1080, 1080×566, 1080×1920) with high-fidelity canvas rendering.
          </p>

          {/* Quick Ratios Bar */}
          <div className="ig-showcase-ratios-summary">
            {INSTAGRAM_RATIOS.map((r) => (
              <div key={r.id} className="ig-ratio-summary-card">
                <div className="ig-ratio-summary-icon">{r.icon}</div>
                <div className="ig-ratio-summary-info">
                  <span className="ig-ratio-summary-name">{r.label} ({r.id})</span>
                  <span className="ig-ratio-summary-dim">{r.outputWidth} × {r.outputHeight} px</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="ig-showcase-container ig-showcase-body">
        {/* Sample Artworks Selector */}
        <section className="ig-showcase-section">
          <div className="ig-section-header">
            <div>
              <h2 className="ig-section-title">1. Choose Artwork or Upload Yours</h2>
              <p className="ig-section-sub">Pick one of our high-res presets or drag & drop your own artwork file below.</p>
            </div>
            <button
              type="button"
              className="ig-btn-open-editor"
              onClick={() => setIsEditorOpen(true)}
            >
              Open Crop Editor
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="ig-preset-grid">
            {PRESET_ARTWORKS.map((preset) => {
              const isSelected = selectedArtworkUrl === preset.url;
              return (
                <div
                  key={preset.id}
                  className={`ig-preset-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedArtworkUrl(preset.url);
                    setLastExport(null);
                  }}
                >
                  <div className="ig-preset-thumb-wrap">
                    <img src={preset.url} alt={preset.title} className="ig-preset-thumb" crossOrigin="anonymous" />
                    {isSelected && (
                      <div className="ig-preset-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="ig-preset-meta">
                    <span className="ig-preset-name">{preset.title}</span>
                    <span className="ig-preset-artist">{preset.artist}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Interactive Cropper Section */}
        <section className="ig-showcase-section">
          <div className="ig-section-header">
            <div>
              <h2 className="ig-section-title">2. Interactive Crop Studio</h2>
              <p className="ig-section-sub">
                Drag to pan, slider to zoom, switch between the 3 ratios with position preservation, and preview result.
              </p>
            </div>
          </div>

          <div className="ig-showcase-editor-wrap">
            <InstagramArtworkCropper
              key={selectedArtworkUrl}
              image={selectedArtworkUrl}
              isModal={false}
              title="Artwork Crop Studio"
              onApply={handleApplyCrop}
            />
          </div>
        </section>

        {/* Last Export Result Section */}
        {lastExport && (
          <section className="ig-showcase-section ig-export-result-section">
            <div className="ig-section-header">
              <div>
                <h2 className="ig-section-title">3. Exported Output Verification</h2>
                <p className="ig-section-sub">
                  Generated at exact dimensions: <strong>{lastExport.width} × {lastExport.height} px</strong> ({lastExport.ratioId}).
                </p>
              </div>
              <div className="ig-export-actions">
                <button
                  type="button"
                  className="ig-btn-download"
                  onClick={() => handleDownload(lastExport.dataUrl, `instagram-${lastExport.ratioId.replace(':', '-')}-${lastExport.width}x${lastExport.height}.jpg`)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download Output Image ({lastExport.width}×{lastExport.height})</span>
                </button>
              </div>
            </div>

            <div className="ig-export-content-grid">
              <div className="ig-export-preview-column">
                <div className="ig-export-mockup-frame">
                  {lastExport.ratioId === '9:16' ? (
                    /* Instagram Reel / Story Mockup */
                    <div className="ig-mockup-story">
                      <div className="ig-mockup-story-header">
                        <div className="ig-mockup-avatar" />
                        <span className="ig-mockup-username">artist.creative</span>
                        <span className="ig-mockup-time">2h</span>
                      </div>
                      <img src={lastExport.dataUrl} alt="Exported artwork" className="ig-mockup-img-story" />
                      <div className="ig-mockup-story-actions">
                        <div className="ig-mockup-icon">❤️</div>
                        <div className="ig-mockup-icon">💬</div>
                        <div className="ig-mockup-icon">✈️</div>
                      </div>
                    </div>
                  ) : (
                    /* Instagram Post Feed Mockup */
                    <div className="ig-mockup-post">
                      <div className="ig-mockup-post-header">
                        <div className="ig-mockup-avatar" />
                        <div>
                          <span className="ig-mockup-username">artist.creative</span>
                          <span className="ig-mockup-location">Digital Gallery</span>
                        </div>
                      </div>
                      <img src={lastExport.dataUrl} alt="Exported artwork" className="ig-mockup-img-post" />
                      <div className="ig-mockup-post-footer">
                        <div className="ig-mockup-icons-row">
                          <span>❤️</span>
                          <span>💬</span>
                          <span>✈️</span>
                        </div>
                        <p className="ig-mockup-caption">
                          <strong>artist.creative</strong> New original artwork cropped to perfection ({lastExport.ratioId}) ✨ #art #artwork
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="ig-export-details-column">
                <div className="ig-export-specs-card">
                  <h3 className="ig-specs-title">Export Specifications</h3>
                  <div className="ig-specs-list">
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">Selected Ratio</span>
                      <span className="ig-spec-val highlight">{lastExport.ratioId}</span>
                    </div>
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">Width</span>
                      <span className="ig-spec-val">{lastExport.width} px</span>
                    </div>
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">Height</span>
                      <span className="ig-spec-val">{lastExport.height} px</span>
                    </div>
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">Total Resolution</span>
                      <span className="ig-spec-val">{((lastExport.width * lastExport.height) / 1000000).toFixed(2)} Megapixels</span>
                    </div>
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">File Format</span>
                      <span className="ig-spec-val">image/jpeg (0.95 quality)</span>
                    </div>
                    <div className="ig-spec-row">
                      <span className="ig-spec-label">Approx Size</span>
                      <span className="ig-spec-val">
                        {lastExport.blob ? `${(lastExport.blob.size / 1024).toFixed(1)} KB` : 'Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="ig-specs-note">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-indigo-400">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      The artwork was cropped directly from the non-destructively loaded original image and scaled using high-quality bicubic smoothing.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Developer Integration Code */}
        <section className="ig-showcase-section">
          <div className="ig-section-header">
            <div>
              <h2 className="ig-section-title">Developer Integration</h2>
              <p className="ig-section-sub">Drop the component anywhere in your app with just a few lines of React.</p>
            </div>
          </div>

          <div className="ig-code-block">
            <pre>
              {`import InstagramArtworkCropper from './components/profile/InstagramArtworkCropper';

// Inside your component:
<InstagramArtworkCropper
  image={artworkFileOrUrl}
  initialRatioId="1:1" // '1:1' | '1.91:1' | '9:16'
  onApply={({ file, blob, dataUrl, width, height, ratioId }) => {
    console.log('Cropped dimensions:', width, height);
    // 1:1 -> 1080 x 1080
    // 1.91:1 -> 1080 x 566
    // 9:16 -> 1080 x 1920
    uploadArtwork(file);
  }}
  onCancel={() => setShowCropper(false)}
/>`}
            </pre>
          </div>
        </section>
      </main>

      {/* Modal View when Triggered */}
      {isEditorOpen && (
        <InstagramArtworkCropper
          image={selectedArtworkUrl}
          isModal={true}
          title="Instagram Artwork Crop"
          onApply={handleApplyCrop}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
}
