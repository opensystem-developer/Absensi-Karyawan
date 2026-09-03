import { useMemo } from 'react';
import { formatTimeRange } from '../shiftConstants';
import { buildMonthDates, monthBounds, shiftMonth } from '../utils/scheduleMonth';

const STATUS_CELL = {
  OFF: 'OFF',
  LEAVE: 'CT',
  HOLIDAY: 'LN',
};

export function scheduleCellLabel(item) {
  if (!item) return '';
  if (item.shift_code) return item.shift_code;
  return STATUS_CELL[item.status] || item.status || '';
}

export function buildScheduleCellMap(schedules) {
  const map = new Map();
  for (const item of schedules) {
    map.set(`${item.employee_id}::${item.work_date}`, item);
  }
  return map;
}

export function buildShiftLegend(shifts, schedules = []) {
  const byCode = new Map();

  for (const shift of shifts) {
    if (shift?.code) {
      byCode.set(shift.code, {
        code: shift.code,
        name: shift.name,
        start: shift.start_time,
        end: shift.end_time,
      });
    }
  }

  for (const item of schedules) {
    if (!item?.shift_code || byCode.has(item.shift_code)) continue;
    byCode.set(item.shift_code, {
      code: item.shift_code,
      name: item.shift_name,
      start: item.shift_start || item.start_time,
      end: item.shift_end || item.end_time,
    });
  }

  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function cellTitle(item) {
  if (!item) return '';
  const parts = [];
  if (item.shift_name) parts.push(item.shift_name);
  if (item.shift_code) parts.push(`(${item.shift_code})`);
  const time = formatTimeRange(item.start_time || item.shift_start, item.end_time || item.shift_end);
  if (time !== '-') parts.push(time);
  if (item.status && item.status !== 'WORK') parts.push(`Status: ${item.status}`);
  return parts.join(' · ');
}

export default function WorkScheduleGrid({
  month,
  onMonthChange,
  rows,
  schedules,
  shifts = [],
  loading = false,
  writable = false,
  onCellClick,
  toolbarExtra = null,
  emptyMessage,
  fitMonth = false,
}) {
  const bounds = useMemo(() => monthBounds(month), [month]);
  const dates = useMemo(() => buildMonthDates(month), [month]);
  const cellMap = useMemo(() => buildScheduleCellMap(schedules), [schedules]);
  const legend = useMemo(() => buildShiftLegend(shifts, schedules), [shifts, schedules]);

  const gridContent = loading ? (
    <div className="loading">Memuat jadwal...</div>
  ) : rows.length === 0 ? (
    <div className="empty-state">
      <p>{emptyMessage || `Belum ada jadwal untuk ${bounds.label}.`}</p>
    </div>
  ) : (
    <div
      className={`schedule-grid-wrap${fitMonth ? ' schedule-grid-wrap--fit-month' : ''}`}
      style={fitMonth ? { '--month-days': dates.length } : undefined}
    >
      <table className={`schedule-grid${fitMonth ? ' schedule-grid--fit-month' : ''}`}>
        <thead>
          <tr>
            <th className="schedule-grid-sticky schedule-grid-name-col">Karyawan</th>
            {dates.map((d) => (
              <th
                key={d.date}
                className={`schedule-grid-date-col${d.isWeekend ? ' schedule-grid-weekend' : ''}`}
                title={d.date}
              >
                <span className="schedule-grid-day">{d.day}</span>
                <span className="schedule-grid-dow">{d.dowLabel}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="schedule-grid-sticky schedule-grid-name-col">
                <div className="schedule-grid-employee">
                  <strong>{row.name}</strong>
                  {row.subtitle && <span className="text-muted">{row.subtitle}</span>}
                </div>
              </td>
              {dates.map((d) => {
                const item = cellMap.get(`${row.id}::${d.date}`);
                const label = scheduleCellLabel(item);
                const clickable = writable && onCellClick;
                return (
                  <td
                    key={d.date}
                    className={[
                      'schedule-grid-cell',
                      d.isWeekend ? 'schedule-grid-weekend' : '',
                      item ? 'schedule-grid-filled' : '',
                      clickable ? 'schedule-grid-clickable' : '',
                    ].filter(Boolean).join(' ')}
                    title={cellTitle(item)}
                    onClick={clickable ? () => onCellClick(row, item, d.date) : undefined}
                  >
                    {label || <span className="schedule-grid-empty">-</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const legendBlock = legend.length > 0 && (
    <div className="schedule-legend">
      <h4 className="schedule-legend-title">Legenda Shift</h4>
      <div className="schedule-legend-items">
        {legend.map((shift) => (
          <div key={shift.code} className="schedule-legend-item">
            <span className="schedule-legend-code">{shift.code}</span>
            <span className="schedule-legend-detail">
              {shift.name}
              <span className="text-muted"> · {formatTimeRange(shift.start, shift.end)}</span>
            </span>
          </div>
        ))}
        <div className="schedule-legend-item">
          <span className="schedule-legend-code">OFF</span>
          <span className="schedule-legend-detail">Libur</span>
        </div>
        <div className="schedule-legend-item">
          <span className="schedule-legend-code">CT</span>
          <span className="schedule-legend-detail">Cuti</span>
        </div>
        <div className="schedule-legend-item">
          <span className="schedule-legend-code">LN</span>
          <span className="schedule-legend-detail">Libur Nasional</span>
        </div>
      </div>
    </div>
  );

  if (fitMonth) {
    return (
      <div className="schedule-grid-layout">
        <div className="schedule-table-toolbar">
          <div className="schedule-toolbar-left">
            {toolbarExtra}
            <div className="month-nav">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onMonthChange(shiftMonth(month, -1))}
                aria-label="Bulan sebelumnya"
              >
                &larr;
              </button>
              <span className="month-nav-label">{bounds.label}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onMonthChange(shiftMonth(month, 1))}
                aria-label="Bulan berikutnya"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>
        {gridContent}
        {legendBlock}
      </div>
    );
  }

  return (
    <>
      <div className="schedule-table-toolbar">
        <div className="schedule-toolbar-left">
          {toolbarExtra}
          <div className="month-nav">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              aria-label="Bulan sebelumnya"
            >
              &larr;
            </button>
            <span className="month-nav-label">{bounds.label}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onMonthChange(shiftMonth(month, 1))}
              aria-label="Bulan berikutnya"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {gridContent}
      {legendBlock}
    </>
  );
}
