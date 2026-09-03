import { useMemo } from 'react';
import { formatTimeRange } from '../shiftConstants';
import { buildMonthDates, monthBounds, shiftMonth } from '../utils/scheduleMonth';
import { useDisplayColors } from '../context/DisplayColorContext';
import {
  buildScheduleCellMap,
  getScheduleCellDisplay,
  legendColorForShift,
  legendColorForStatusCode,
} from '../utils/scheduleCellDisplay';

export { scheduleCellLabel, buildScheduleCellMap } from '../utils/scheduleCellDisplay';

export function buildShiftLegend(configShifts = [], schedules = []) {
  const byCode = new Map();

  for (const shift of configShifts) {
    if (shift?.code) {
      byCode.set(shift.code, {
        code: shift.code,
        name: shift.name,
        start: shift.start_time,
        end: shift.end_time,
        kind: 'shift',
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
      kind: 'shift',
    });
  }

  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

const STATUS_LEGEND = [
  { code: 'OFF', label: 'Libur', kind: 'status' },
  { code: 'CT', label: 'Cuti', kind: 'status' },
  { code: 'LN', label: 'Libur Nasional', kind: 'status' },
];

function cellTitle(item) {
  if (!item) return '';
  const parts = [];
  if (item.status && item.status !== 'WORK') {
    const statusLabels = { OFF: 'Libur', LEAVE: 'Cuti', HOLIDAY: 'Libur Nasional' };
    parts.push(statusLabels[item.status] || item.status);
  }
  if (item.shift_name) parts.push(item.shift_name);
  if (item.shift_code && item.status === 'WORK') parts.push(`(${item.shift_code})`);
  const time = formatTimeRange(item.start_time || item.shift_start, item.end_time || item.shift_end);
  if (time !== '-' && item.status === 'WORK') parts.push(time);
  return parts.join(' · ');
}

function legendSwatchStyle(config, entry, shiftsByCode) {
  const colors = entry.kind === 'status'
    ? legendColorForStatusCode(config, entry.code)
    : legendColorForShift(config, entry, shiftsByCode);
  if (!colors) return {};
  return {
    backgroundColor: colors.bg,
    color: colors.fg,
    borderColor: colors.border || colors.bg,
  };
}

export default function WorkScheduleGrid({
  month,
  onMonthChange,
  rows,
  schedules,
  loading = false,
  writable = false,
  onCellClick,
  toolbarExtra = null,
  emptyMessage,
  fitMonth = false,
}) {
  const { config, shiftsByCode } = useDisplayColors();
  const bounds = useMemo(() => monthBounds(month), [month]);
  const dates = useMemo(() => buildMonthDates(month), [month]);
  const cellMap = useMemo(() => buildScheduleCellMap(schedules), [schedules]);
  const legend = useMemo(
    () => buildShiftLegend(config?.shifts || [], schedules),
    [config?.shifts, schedules],
  );

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
                className={`schedule-grid-date-col${d.isSunday ? ' schedule-grid-sunday' : ''}`}
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
                  {(row.positionShort || row.subtitle) && (
                    <span className="schedule-grid-meta text-muted">
                      {row.positionShort && (
                        <span className="schedule-grid-position" title={row.positionName || row.positionShort}>
                          {row.positionShort}
                        </span>
                      )}
                      {row.employeeNo && <span className="schedule-grid-employee-no">{row.employeeNo}</span>}
                      {!row.positionShort && !row.employeeNo && row.subtitle && (
                        <span>{row.subtitle}</span>
                      )}
                    </span>
                  )}
                </div>
              </td>
              {dates.map((d) => {
                const item = cellMap.get(`${row.id}::${d.date}`);
                const display = getScheduleCellDisplay(item, config, shiftsByCode);
                const clickable = writable && onCellClick;
                return (
                  <td
                    key={d.date}
                    className={[
                      display.className,
                      d.isSunday ? 'schedule-grid-sunday' : '',
                      clickable ? 'schedule-grid-clickable' : '',
                    ].filter(Boolean).join(' ')}
                    style={display.style}
                    title={cellTitle(item)}
                    onClick={clickable ? () => onCellClick(row, item, d.date) : undefined}
                  >
                    {display.label || <span className="schedule-grid-empty">-</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const legendBlock = (
    <div className="schedule-legend">
      <h4 className="schedule-legend-title">Legenda Shift</h4>
      <div className="schedule-legend-items">
        {legend.map((shift) => (
          <div key={shift.code} className="schedule-legend-item">
            <span className="schedule-legend-code" style={legendSwatchStyle(config, shift, shiftsByCode)}>{shift.code}</span>
            <span className="schedule-legend-detail">
              {shift.name}
              <span className="text-muted"> · {formatTimeRange(shift.start, shift.end)}</span>
            </span>
          </div>
        ))}
        {STATUS_LEGEND.map((entry) => (
          <div key={entry.code} className="schedule-legend-item">
            <span className="schedule-legend-code" style={legendSwatchStyle(config, entry, shiftsByCode)}>{entry.code}</span>
            <span className="schedule-legend-detail">{entry.label}</span>
          </div>
        ))}
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
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Bulan sebelumnya">&larr;</button>
              <span className="month-nav-label">{bounds.label}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Bulan berikutnya">&rarr;</button>
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Bulan sebelumnya">&larr;</button>
            <span className="month-nav-label">{bounds.label}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Bulan berikutnya">&rarr;</button>
          </div>
        </div>
      </div>
      {gridContent}
      {legendBlock}
    </>
  );
}
