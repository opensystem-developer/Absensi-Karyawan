import { useState, useEffect, useRef } from 'react';
import { toDisplayDate, toIsoDate, toInputDate, maskDateInput, isValidDisplayDate } from '../utils/date';

/**
 * Input tanggal format dd/mm/yyyy + tombol kalender.
 * value/onChange menggunakan ISO (YYYY-MM-DD) agar kompatibel dengan API.
 */
export default function DateInput({ value, onChange, required, placeholder = 'dd/mm/yyyy', className }) {
  const [text, setText] = useState(() => toDisplayDate(value));
  const nativeRef = useRef(null);

  useEffect(() => {
    setText(toDisplayDate(value));
  }, [value]);

  const isoValue = toInputDate(value) || '';

  function emit(iso) {
    onChange({ target: { value: iso || '' } });
  }

  function handleTextChange(e) {
    const masked = maskDateInput(e.target.value);
    setText(masked);
    if (masked.length === 10 && isValidDisplayDate(masked)) {
      emit(toIsoDate(masked));
    } else if (!masked) {
      emit('');
    }
  }

  function handleBlur() {
    if (!text) {
      emit('');
      return;
    }
    if (isValidDisplayDate(text)) {
      const iso = toIsoDate(text);
      emit(iso);
      setText(toDisplayDate(iso));
    }
  }

  function handleNativeChange(e) {
    const iso = e.target.value;
    setText(toDisplayDate(iso));
    emit(iso);
  }

  function openPicker() {
    const el = nativeRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') el.showPicker();
      else el.click();
    } catch {
      el.click();
    }
  }

  return (
    <div className={`date-input-wrap ${className || ''}`}>
      <input
        type="text"
        className="date-input-text"
        placeholder={placeholder}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        required={required}
        maxLength={10}
        inputMode="numeric"
      />
      <button
        type="button"
        className="date-picker-btn"
        onClick={openPicker}
        title="Pilih tanggal"
        aria-label="Pilih tanggal"
        tabIndex={-1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      <input
        ref={nativeRef}
        type="date"
        className="date-input-native"
        value={isoValue}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
