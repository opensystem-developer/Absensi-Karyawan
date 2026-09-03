import { useState, useRef, useEffect } from 'react';
import {
  AUTOMATIC_COLOR,
  STANDARD_COLORS,
  buildThemeColorGrid,
  colorsMatch,
  normalizeHex,
} from '../utils/excelColorPalette';

function Swatch({ color, selected, onClick, title }) {
  return (
    <button
      type="button"
      className={`excel-color-swatch${selected ? ' excel-color-swatch-selected' : ''}`}
      style={{ backgroundColor: color }}
      title={title || color}
      onClick={() => onClick(color)}
    />
  );
}

export default function ExcelColorPicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const themeGrid = buildThemeColorGrid();
  const current = normalizeHex(value) || '#4F81BD';

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(color) {
    const hex = normalizeHex(color);
    if (!hex) return;
    onChange(hex);
    setOpen(false);
  }

  return (
    <div className="excel-color-picker" ref={wrapRef}>
      <button
        type="button"
        className="excel-color-trigger"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title="Pilih warna"
      >
        <span className="excel-color-trigger-bar" style={{ backgroundColor: current }} />
      </button>

      {open && (
        <div className="excel-color-dropdown">
          <div className="excel-color-section">
            <button type="button" className="excel-color-automatic" onClick={() => pick(AUTOMATIC_COLOR)}>
              <span className="excel-color-automatic-swatch" style={{ backgroundColor: AUTOMATIC_COLOR }} />
              <span>Automatic</span>
            </button>
          </div>

          <div className="excel-color-section">
            <div className="excel-color-section-title">Theme Colors</div>
            <div className="excel-color-theme-grid">
              {themeGrid.map((column, colIdx) => (
                <div key={colIdx} className="excel-color-theme-col">
                  {column.map((color) => (
                    <Swatch
                      key={color}
                      color={color}
                      selected={colorsMatch(color, current)}
                      onClick={pick}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="excel-color-section">
            <div className="excel-color-section-title">Standard Colors</div>
            <div className="excel-color-standard-row">
              {STANDARD_COLORS.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  selected={colorsMatch(color, current)}
                  onClick={pick}
                />
              ))}
            </div>
          </div>

          <div className="excel-color-footer">
            <label className="excel-color-more">
              <span className="excel-color-more-icon" aria-hidden="true">🎨</span>
              <span>More Colors...</span>
              <input
                type="color"
                className="excel-color-more-input"
                value={current}
                onChange={(e) => pick(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
