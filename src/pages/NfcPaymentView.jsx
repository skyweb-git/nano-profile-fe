import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, SmartphoneNfc, QrCode, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { API_URL } from '../services/api';

function buildLocalUpiLinks({ payeeUpiId, amount }) {
  const upid = String(payeeUpiId || '').trim();
  const cleanAmount = Number(amount || 0);
  const baseQuery = `pa=${upid}&am=${cleanAmount}&cu=INR`;

  return {
    upiIntentUrl: `upi://pay?${baseQuery}`,
    gpayUrl: `tez://upi/pay?${baseQuery}`,
    phonepeUrl: `phonepe://pay?${baseQuery}`,
    paytmUrl: `paytmmp://pay?${baseQuery}`,
    bhimUrl: `upi://pay?${baseQuery}`,
    qrPayload: `upi://pay?${baseQuery}`
  };
}

export default function NfcPaymentView({ customData, onBackToProfile }) {
  const { tagCode: paramTagCode } = useParams();
  const tagCode = customData?.tagCode || paramTagCode;
  const [loading, setLoading] = useState(!customData);
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => {
    if (!customData) return null;
    return {
      ...customData,
      links: customData.links || buildLocalUpiLinks(customData)
    };
  });
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (customData) {
      setData({
        ...customData,
        links: customData.links || buildLocalUpiLinks(customData)
      });
      setLoading(false);
      return;
    }

    if (!tagCode) {
      setError('Missing tag code');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchTag = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/pay/${encodeURIComponent(tagCode)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Unable to retrieve payment tag details');
        }
        if (isMounted) {
          setData(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load payment information');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTag();
    return () => {
      isMounted = false;
    };
  }, [tagCode, customData]);

  const handleCopyUpi = () => {
    if (!data?.payeeUpiId) return;
    navigator.clipboard.writeText(data.payeeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePayNow = (url) => {
    const targetUrl = url || data?.links?.upiIntentUrl;
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Connecting to NFC Payment...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>
            <AlertCircle size={44} color="#ef4444" />
          </div>
          <h2 style={styles.errorTitle}>Payment Tag Inactive</h2>
          <p style={styles.errorDescription}>{error || 'This NFC payment tag is currently unavailable.'}</p>
          <div style={styles.tagBadge}>Tag: {tagCode?.toUpperCase()}</div>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(data.links?.qrPayload || '')}`;

  return (
    <div style={styles.container}>
      {/* Background glow effects */}
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <main style={styles.card}>
        {/* Header Tag / Verified Badge */}
        <div style={styles.headerRow}>
          <div style={styles.verifiedBadge}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Verified Payee</span>
          </div>
          <div style={styles.tagPill}>
            <SmartphoneNfc size={14} color="#6366f1" />
            <span>{data.tagCode}</span>
          </div>
        </div>

        {/* Payee Info */}
        <div style={styles.payeeSection}>
          <h1 style={styles.payeeName}>{data.payeeName}</h1>
          {data.title ? <p style={styles.tagTitle}>{data.title}</p> : null}

          <div style={styles.upiRow} onClick={handleCopyUpi} title="Click to copy UPI ID">
            <span style={styles.upiLabel}>UPI:</span>
            <span style={styles.upiId}>{data.payeeUpiId}</span>
            <button style={styles.copyBtn} aria-label="Copy UPI ID">
              {copiedUpi ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#94a3b8" />}
            </button>
          </div>
          {copiedUpi && <span style={styles.copiedToast}>UPI ID copied to clipboard!</span>}
        </div>

        {/* Amount Display */}
        <div style={styles.amountCard}>
          <span style={styles.amountLabel}>Total Payable Amount</span>
          <div style={styles.amountValueRow}>
            <span style={styles.currencySymbol}>₹</span>
            <span style={styles.amountNumber}>{Number(data.amount).toLocaleString('en-IN')}</span>
          </div>
          {data.note ? <p style={styles.paymentNote}>"{data.note}"</p> : null}
        </div>

        {/* Main CTA: Pay with UPI */}
        <button
          style={styles.primaryPayBtn}
          onClick={() => handlePayNow(data.links?.upiIntentUrl)}
        >
          <span>Pay ₹{Number(data.amount).toLocaleString('en-IN')} with UPI</span>
          <ExternalLink size={18} />
        </button>

        {/* App Selector Pills */}
        <div style={styles.appsSection}>
          <p style={styles.appsSubtitle}>Or choose your preferred payment app:</p>
          <div style={styles.appsGrid}>
            <button
              style={{ ...styles.appBtn, borderColor: '#5f259f' }}
              onClick={() => handlePayNow(data.links?.phonepeUrl)}
            >
              <span style={{ color: '#8b5cf6', fontWeight: 600 }}>PhonePe</span>
            </button>
            <button
              style={{ ...styles.appBtn, borderColor: '#4285F4' }}
              onClick={() => handlePayNow(data.links?.gpayUrl)}
            >
              <span style={{ color: '#60a5fa', fontWeight: 600 }}>Google Pay</span>
            </button>
            <button
              style={{ ...styles.appBtn, borderColor: '#00BAF2' }}
              onClick={() => handlePayNow(data.links?.paytmUrl)}
            >
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Paytm</span>
            </button>
            <button
              style={{ ...styles.appBtn, borderColor: '#22c55e' }}
              onClick={() => handlePayNow(data.links?.bhimUrl)}
            >
              <span style={{ color: '#4ade80', fontWeight: 600 }}>BHIM / Any</span>
            </button>
          </div>
        </div>

        {/* QR Code toggle */}
        <div style={styles.qrToggleSection}>
          <button
            style={styles.qrToggleBtn}
            onClick={() => setShowQr(!showQr)}
          >
            <QrCode size={16} />
            <span>{showQr ? 'Hide UPI QR Code' : 'Show UPI QR Code for Desktop/Scan'}</span>
          </button>

          {showQr && (
            <div style={styles.qrContainer}>
              <div style={styles.qrWrapper}>
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${data.payeeName}`}
                  style={styles.qrImage}
                />
              </div>
              <p style={styles.qrCaption}>Scan with Google Pay, PhonePe, Paytm, or BHIM</p>
            </div>
          )}
        </div>

        {/* Trust & Security Footer */}
        <div style={styles.footerNote}>
          <ShieldCheck size={14} color="#64748b" />
          <span>NPCI Instant Bank Transfer • Zero Fee Tap-to-Pay</span>
        </div>

        {typeof onBackToProfile === 'function' && (
          <button
            type="button"
            onClick={onBackToProfile}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '1rem',
              textDecoration: 'underline'
            }}
          >
            View Digital Profile instead →
          </button>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#090d16',
    color: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: '1.25rem',
    position: 'relative',
    overflow: 'hidden'
  },
  bgGlowTop: {
    position: 'absolute',
    top: '-15%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '450px',
    height: '450px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(99, 102, 241, 0) 70%)',
    pointerEvents: 'none'
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: '-15%',
    right: '10%',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0) 70%)',
    pointerEvents: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '2rem 1.5rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 10
  },
  headerRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem'
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#34d399'
  },
  tagPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#a5b4fc',
    letterSpacing: '0.5px'
  },
  payeeSection: {
    width: '100%',
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  payeeName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: '#ffffff',
    letterSpacing: '-0.3px'
  },
  tagTitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: '0 0 8px 0'
  },
  upiRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '4px 10px',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s'
  },
  upiLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b'
  },
  upiId: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#cbd5e1'
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  copiedToast: {
    display: 'block',
    fontSize: '11px',
    color: '#10b981',
    marginTop: '4px'
  },
  amountCard: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '16px',
    padding: '1.25rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
  },
  amountLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#94a3b8',
    fontWeight: 600,
    display: 'block',
    marginBottom: '6px'
  },
  amountValueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  currencySymbol: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#818cf8'
  },
  amountNumber: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-1px'
  },
  paymentNote: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
    margin: '8px 0 0 0'
  },
  primaryPayBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    marginBottom: '1.5rem'
  },
  appsSection: {
    width: '100%',
    marginBottom: '1.25rem'
  },
  appsSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  appsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  appBtn: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s, transform 0.1s'
  },
  qrToggleSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.25rem'
  },
  qrToggleBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#94a3b8',
    padding: '8px 14px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  qrContainer: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  qrWrapper: {
    background: '#ffffff',
    padding: '12px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
  },
  qrImage: {
    display: 'block',
    width: '180px',
    height: '180px'
  },
  qrCaption: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '8px',
    textAlign: 'center'
  },
  footerNote: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '0.5rem'
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '1rem',
    fontSize: '14px',
    color: '#94a3b8'
  },
  errorIcon: {
    marginBottom: '0.75rem'
  },
  errorTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 6px 0'
  },
  errorDescription: {
    fontSize: '13px',
    color: '#94a3b8',
    textAlign: 'center',
    margin: '0 0 1rem 0'
  },
  tagBadge: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#f87171',
    marginBottom: '1.25rem'
  },
  retryBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '8px 18px',
    fontSize: '13px',
    cursor: 'pointer'
  }
};
