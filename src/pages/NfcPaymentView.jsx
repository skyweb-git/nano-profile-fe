import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../services/api';

function buildLocalUpiLinks({ payeeUpiId, payeeName, amount }) {
  const upid = String(payeeUpiId || '').trim();
  const cleanAmount = Number(amount || 0);
  const name = encodeURIComponent(String(payeeName || 'Merchant').trim());
  const baseQuery = `pa=${upid}&pn=${name}&am=${cleanAmount}&cu=INR`;

  return {
    upiIntentUrl: `upi://pay?${baseQuery}`
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
      setError('MISSING TAG CODE');
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
          throw new Error(json.message || 'TAG NOT FOUND');
        }
        if (isMounted) {
          setData(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'FAILED TO LOAD PAYMENT');
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

  const handlePayNow = (url) => {
    const targetUrl = url || data?.links?.upiIntentUrl;
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  const formattedAmount = Number(data?.amount || 0).toLocaleString('en-IN');

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.pixelSpinner} />
          <p style={styles.loadingText}>CONNECTING...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>[ ! ]</div>
          <h2 style={styles.errorTitle}>TAG INACTIVE</h2>
          <p style={styles.errorDescription}>{error || 'UNAVAILABLE'}</p>
          <div style={styles.tagBadge}>TAG: {tagCode?.toUpperCase()}</div>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <main style={styles.card}>
        {/* Header Tag Pill */}
        {data.tagCode && (
          <div style={styles.headerRow}>
            <div style={styles.tagPill}>
              <span>[{data.tagCode}]</span>
            </div>
          </div>
        )}

        {/* Payee Info */}
        <div style={styles.payeeSection}>
          <h1 style={styles.payeeName}>{data.payeeName}</h1>
          {data.title ? <p style={styles.tagTitle}>{data.title}</p> : null}
        </div>

        {/* Amount Box */}
        <div style={styles.amountCard}>
          <span style={styles.amountLabel}>TOTAL PAYABLE AMOUNT</span>
          <div style={styles.amountValueRow}>
            <span style={styles.currencySymbol}>₹</span>
            <span style={styles.amountNumber}>{formattedAmount}</span>
          </div>
          {data.note ? <p style={styles.paymentNote}>"{data.note}"</p> : null}
        </div>

        {/* Main CTA: Pay with Nano */}
        <button
          style={styles.primaryPayBtn}
          onClick={() => handlePayNow(data.links?.upiIntentUrl)}
        >
          <span>PAY ₹{formattedAmount} WITH NANO</span>
          <span style={{ fontSize: '14px', marginLeft: '6px' }}>►</span>
        </button>

        {typeof onBackToProfile === 'function' && (
          <button
            type="button"
            onClick={onBackToProfile}
            style={styles.backBtn}
          >
            ← VIEW PROFILE
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
    background: '#000000',
    color: '#ffffff',
    fontFamily: '"Press Start 2P", monospace',
    padding: '1.25rem',
    position: 'relative',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    background: '#000000',
    border: '2px solid #ffffff',
    borderRadius: '0px',
    padding: '2rem 1.5rem',
    boxShadow: '6px 6px 0px #ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box'
  },
  headerRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.25rem'
  },
  tagPill: {
    display: 'inline-block',
    border: '1px solid #ffffff',
    borderRadius: '0px',
    padding: '4px 10px',
    fontSize: '10px',
    color: '#ffffff',
    letterSpacing: '1px',
    background: '#000000'
  },
  payeeSection: {
    width: '100%',
    textAlign: 'center',
    marginBottom: '1.5rem'
  },
  payeeName: {
    fontSize: 'clamp(13px, 3.5vw, 16px)',
    lineHeight: '1.5',
    margin: '0 0 8px 0',
    color: '#ffffff',
    letterSpacing: '0px'
  },
  tagTitle: {
    fontSize: '9px',
    lineHeight: '1.6',
    color: '#a3a3a3',
    margin: '0',
    textTransform: 'uppercase'
  },
  amountCard: {
    width: '100%',
    background: '#000000',
    border: '2px solid #ffffff',
    borderRadius: '0px',
    padding: '1.25rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    boxShadow: '4px 4px 0px #ffffff',
    boxSizing: 'border-box'
  },
  amountLabel: {
    fontSize: '8px',
    letterSpacing: '1px',
    color: '#a3a3a3',
    display: 'block',
    marginBottom: '10px'
  },
  amountValueRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  currencySymbol: {
    fontSize: 'clamp(18px, 4.5vw, 22px)',
    color: '#ffffff'
  },
  amountNumber: {
    fontSize: 'clamp(20px, 5.5vw, 26px)',
    color: '#ffffff',
    letterSpacing: '0px'
  },
  paymentNote: {
    fontSize: '8px',
    lineHeight: '1.5',
    color: '#a3a3a3',
    margin: '10px 0 0 0',
    textTransform: 'uppercase'
  },
  primaryPayBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    color: '#000000',
    border: '2px solid #ffffff',
    borderRadius: '0px',
    padding: '14px 16px',
    fontSize: 'clamp(10px, 2.8vw, 12px)',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    boxShadow: '4px 4px 0px #ffffff',
    transition: 'transform 0.1s, box-shadow 0.1s',
    boxSizing: 'border-box',
    lineHeight: '1.4'
  },
  pixelSpinner: {
    width: '32px',
    height: '32px',
    border: '4px solid #ffffff',
    borderTopColor: '#000000',
    borderRadius: '0px',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    marginTop: '1rem',
    fontSize: '10px',
    color: '#ffffff'
  },
  errorIcon: {
    fontSize: '20px',
    color: '#ffffff',
    marginBottom: '0.75rem'
  },
  errorTitle: {
    fontSize: '12px',
    color: '#ffffff',
    margin: '0 0 8px 0'
  },
  errorDescription: {
    fontSize: '9px',
    color: '#a3a3a3',
    textAlign: 'center',
    margin: '0 0 1rem 0'
  },
  tagBadge: {
    border: '1px solid #ffffff',
    padding: '4px 8px',
    fontSize: '9px',
    color: '#ffffff',
    marginBottom: '1.25rem'
  },
  retryBtn: {
    background: '#ffffff',
    border: '2px solid #ffffff',
    color: '#000000',
    padding: '8px 16px',
    fontSize: '9px',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#a3a3a3',
    fontSize: '9px',
    fontFamily: '"Press Start 2P", monospace',
    cursor: 'pointer',
    marginTop: '1rem',
    textDecoration: 'underline'
  }
};
