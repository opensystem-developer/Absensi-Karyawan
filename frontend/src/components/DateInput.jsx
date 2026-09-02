import { useState, useEffect } from 'react';
import { toDisplayDate, toIsoDate, maskDateInput, isValidDisplayDate } from '../utils/date';

/**
 * Input tanggal format dd/mm/yyyy.
 * value/onChange menggunakan ISO (YYYY-MM-DD) agar kompatibel dengan API.
 */
export default function DateInput({ value, onChange, required, placeholder = 'dd/mm/yyyy', className }) {
  const [text, setText] = useState(() => toDisplayDate(value));

  useEffect(() => {
    setText(toDisplayDate(value));
  }, [value]);

  function handleChange(e) {
    const masked = maskDateInput(e.target.value);
    setText(masked);
    if (masked.length === 10 && isValidDisplayDate(masked)) {
      onChange({ target: { value: toIsoDate(masked) } });
    } else if (!masked) {
      onChange({ target: { value: '' } });
    }
  }

  function handleBlur() {
    if (!text) {
      onChange({ target: { value: '' } });
      return;
    }
    if (isValidDisplayDate(text)) {
      const iso = toIsoDate(text);
      onChange({ target: { value: iso } });
      setText(toDisplayDate(iso));
    }
  }

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      maxLength={10}
      inputMode="numeric"
    />
  );
}
