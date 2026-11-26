import React, { useLayoutEffect, useRef } from 'react';
import { sanitizeBioHtml } from '../../utils/sanitizeBioHtml';

/**
 * ContentEditable bio editor that preserves paste formatting
 * (bold, italics, bullets/numbered lists, line breaks).
 */
export default function RichTextBioEditor({
  value = '',
  onChange,
  placeholder = 'Paste or type your bio…',
  minHeight = 140,
}) {
  const ref = useRef(null);
  const lastEmitted = useRef('');
  const focusedRef = useRef(false);

  // Sync external value → editor when it changes from outside (not while typing)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || focusedRef.current) return;
    const next = String(value || '');
    if (next === lastEmitted.current) return;
    if (sanitizeBioHtml(el.innerHTML) === sanitizeBioHtml(next)) return;
    el.innerHTML = next ? sanitizeBioHtml(next) : '';
  }, [value]);

  const emitChange = () => {
    const el = ref.current;
    if (!el || !onChange) return;
    const html = sanitizeBioHtml(el.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  };

  const run = (command, arg = null) => {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch (_) { /* ignore */ }
    emitChange();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData?.getData('text/html') || '';
    const text = e.clipboardData?.getData('text/plain') || '';
    const cleaned = html
      ? sanitizeBioHtml(html)
      : sanitizeBioHtml(text.replace(/\r\n/g, '\n'));
    try {
      document.execCommand('insertHTML', false, cleaned || text);
    } catch (_) {
      // Fallback for older browsers
      const el = ref.current;
      if (el) {
        el.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const temp = document.createElement('div');
          temp.innerHTML = cleaned || text;
          const frag = document.createDocumentFragment();
          let node;
          while ((node = temp.firstChild)) frag.appendChild(node);
          range.insertNode(frag);
        }
      }
    }
    emitChange();
  };

  const btnStyle = (active) => ({
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: active ? '1px solid #0f172a' : '1px solid #cbd5e1',
    background: active ? '#0f172a' : '#ffffff',
    color: active ? '#ffffff' : '#334155',
    fontSize: '0.8rem',
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1.2
  });

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <button type="button" style={btnStyle(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => run('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" style={btnStyle(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => run('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" style={btnStyle(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => run('underline')} title="Underline">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <button type="button" style={btnStyle(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" style={btnStyle(false)} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertOrderedList')} title="Numbered list">
          1. List
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onFocus={() => { focusedRef.current = true; }}
        onInput={emitChange}
        onBlur={() => { focusedRef.current = false; emitChange(); }}
        onPaste={handlePaste}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight,
          padding: '0.8rem 1rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f172a',
          fontSize: '0.95rem',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.55,
          overflowY: 'auto'
        }}
        className="rich-bio-editor"
      />
      <style>{`
        .rich-bio-editor:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .rich-bio-editor ul {
          list-style: disc;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .rich-bio-editor ol {
          list-style: decimal;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .rich-bio-editor p { margin: 0 0 0.55em; }
        .rich-bio-editor p:last-child { margin-bottom: 0; }
        .rich-bio-editor strong, .rich-bio-editor b { font-weight: 700; }
      `}</style>
      <p style={{ margin: '0.45rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
        Paste keeps bold, italics, and bullet points.
      </p>
    </div>
  );
}
