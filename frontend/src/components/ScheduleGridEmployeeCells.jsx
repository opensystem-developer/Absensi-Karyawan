/** Kolom Karyawan + Jabatan + Libur (sticky) untuk grid jadwal/kehadiran. */
export function ScheduleGridEmployeeHeader({ showOffDays = false }) {
  return (
    <>
      <th className="schedule-grid-sticky schedule-grid-name-col">Karyawan</th>
      <th className="schedule-grid-sticky schedule-grid-position-col">Jabatan</th>
      {showOffDays && (
        <th className="schedule-grid-sticky schedule-grid-off-col" title="Jumlah hari libur (OFF) bulan ini">Libur</th>
      )}
    </>
  );
}

export function ScheduleGridEmployeeCells({ row, showOffDays = false }) {
  return (
    <>
      <td className="schedule-grid-sticky schedule-grid-name-col">
        <div className="schedule-grid-employee">
          <strong>{row.name}</strong>
          {row.employeeNo && (
            <span className="schedule-grid-employee-no text-muted">{row.employeeNo}</span>
          )}
          {row.branchCode && (
            <span className="schedule-grid-branch text-muted">{row.branchCode}</span>
          )}
        </div>
      </td>
      <td
        className="schedule-grid-sticky schedule-grid-position-col"
        title={row.positionName || row.positionShort || ''}
      >
        {row.positionShort ? (
          <span className="schedule-grid-position-code">{row.positionShort}</span>
        ) : (
          <span className="schedule-grid-empty">-</span>
        )}
      </td>
      {showOffDays && (
        <td className="schedule-grid-sticky schedule-grid-off-col" title="Hari libur (OFF) di bulan ini">
          <span className="schedule-grid-off-count">{row.offDaysCount ?? 0}</span>
        </td>
      )}
    </>
  );
}
