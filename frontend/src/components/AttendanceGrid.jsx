import { useMemo } from 'react';
import { formatTimeRange } from '../shiftConstants';
import { buildMonthDates, monthBounds, shiftMonth } from '../utils/scheduleMonth';
import { useDisplayColors } from '../context/DisplayColorContext';
import {
  buildAttendanceCellMap,
  getAttendanceCellDisplay,
  attendanceCellTitle,
  legendColorForAttendance,
  ATTENDANCE_LEGEND,
} from '../utils/attendanceCellDisplay';
import { formatDateTime } from '../constants';

function MonthToolbar({ month, onMonthChange, toolbarExtra }) {
  const bounds = monthBounds(month);
  return (
    <div className="schedule-table-toolbar">
      <div className="schedule-toolbar-left">
        {toolbarExtra}
        <div className="month-nav">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, -1))}>&larr;</button>
          <span className="month-nav-label">{bounds.label}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMonthChange(shiftMonth(month, 1))}>&rarr;</button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceGrid({
  month,
  onMonthChange,
  rows,
  attendances,
  loading = false,
  toolbarExtra = null,
  emptyMessage,
  fitMonth = false,
}) {
  const { config } = useDisplayColors();
  const bounds = useMemo(() => monthBounds(month), [month]);
  const dates = useMemo(() => buildMonthDates(month), [month]);
  const cellMap = useMemo(() => buildAttendanceCellMap(attendances), [attendances]);

  const gridContent = loading ? (
    <div className="loading">Memuat kehadiran...</div>
  ) : rows.length === 0 ? (
    <div className="empty-state">
      <p>{emptyMessage || `Belum ada data kehadiran untuk ${bounds.label}.`}</p>
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
                  {row.subtitle && <span className="text-muted">{row.subtitle}</span>}
                </div>
              </td>
              {dates.map((d) => {
                const item = cellMap.get(`${row.id}::${d.date}`);
                const display = getAttendanceCellDisplay(item, config);
                return (
                  <td
                    key={d.date}
                    className={[display.className, d.isSunday ? 'schedule-grid-sunday' : ''].filter(Boolean).join(' ')}
                    style={display.style}
                    title={attendanceCellTitle(item, formatDateTime)}
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
      <h4 className="schedule-legend-title">Legenda Kehadiran</h4>
      <div className="schedule-legend-items">
        {ATTENDANCE_LEGEND.map((entry) => {
          const colors = legendColorForAttendance(config, entry.status);
          const swatchStyle = colors ? {
            backgroundColor: colors.bg,
            color: colors.fg,
            borderColor: colors.border || colors.bg,
          } : {};
          return (
            <div key={entry.status} className="schedule-legend-item">
              <span className="schedule-legend-code" style={swatchStyle}>{entry.cellCode}</span>
              <span className="schedule-legend-detail">{entry.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (fitMonth) {
    return (
      <div className="schedule-grid-layout">
        <MonthToolbar month={month} onMonthChange={onMonthChange} toolbarExtra={toolbarExtra} />
        {gridContent}
        {legendBlock}
      </div>
    );
  }

  return (
    <>
      <MonthToolbar month={month} onMonthChange={onMonthChange} toolbarExtra={toolbarExtra} />
      {gridContent}
      {legendBlock}
    </>
  );
}
