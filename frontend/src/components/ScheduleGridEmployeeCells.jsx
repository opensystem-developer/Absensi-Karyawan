/** Kolom Karyawan + Jabatan (sticky) untuk grid jadwal/kehadiran. */
export function ScheduleGridEmployeeHeader() {
  return (
    <>
      <th className="schedule-grid-sticky schedule-grid-name-col">Karyawan</th>
      <th className="schedule-grid-sticky schedule-grid-position-col">Jabatan</th>
    </>
  );
}

export function ScheduleGridEmployeeCells({ row }) {
  return (
    <>
      <td className="schedule-grid-sticky schedule-grid-name-col">
        <div className="schedule-grid-employee">
          <strong>{row.name}</strong>
          {row.employeeNo && (
            <span className="schedule-grid-employee-no text-muted">{row.employeeNo}</span>
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
    </>
  );
}
