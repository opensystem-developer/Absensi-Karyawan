import { useState, useRef, useEffect } from 'react';

export default function MultiSelectFilter({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Pilih...',
  valueKey = 'code',
  labelKey = 'name',
  formatOption,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = new Set(value);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function toggle(code) {
    const next = selected.has(code)
      ? value.filter((v) => v !== code)
      : [...value, code];
    onChange(next);
  }

  const summary = value.length === 0
    ? placeholder
    : value.length === 1
      ? (formatOption ? formatOption(options.find((o) => o[valueKey] === value[0])) : value[0])
      : `${value.length} dipilih`;

  return (
    <div className="multi-select-filter" ref={wrapRef}>
      <button
        type="button"
        className="multi-select-trigger filter-select"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
      >
        <span className="multi-select-summary">{summary}</span>
        <span className="multi-select-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="multi-select-dropdown">
          {options.length === 0 ? (
            <p className="text-muted multi-select-empty">Tidak ada opsi</p>
          ) : (
            options.map((opt) => {
              const code = opt[valueKey];
              const text = formatOption ? formatOption(opt) : `${code} — ${opt[labelKey] || code}`;
              return (
                <label key={code} className="multi-select-option">
                  <input
                    type="checkbox"
                    checked={selected.has(code)}
                    onChange={() => toggle(code)}
                  />
                  <span>{text}</span>
                </label>
              );
            })
          )}
          {value.length > 0 && (
            <button type="button" className="multi-select-clear" onClick={() => onChange([])}>
              Hapus semua
            </button>
          )}
        </div>
      )}
    </div>
  );
}
