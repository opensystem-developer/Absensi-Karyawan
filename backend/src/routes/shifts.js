import { createMasterRouter } from '../utils/masterRouter.js';
import { enrichShiftRow } from '../utils/shiftHelpers.js';
import { deriveCellColors } from '../utils/colorUtils.js';

const toRes = (r) => enrichShiftRow(r);

export default createMasterRouter({
  tableName: 'shifts',
  entityName: 'Shift',
  fields: [
    'code', 'name', 'start_time', 'end_time', 'break_start', 'break_end',
    'late_tolerance_minutes', 'early_out_tolerance_minutes', 'status',
    'color_bg', 'color_fg', 'color_border',
  ],
  required: ['code', 'name', 'start_time', 'end_time'],
  boolFields: ['status'],
  orderBy: 'name ASC',
  transformResponse: toRes,
  transformInput: (d) => {
    if (d.status === undefined) d.status = 1;
    d.late_tolerance_minutes = parseInt(d.late_tolerance_minutes, 10) || 0;
    d.early_out_tolerance_minutes = parseInt(d.early_out_tolerance_minutes, 10) || 0;
    if (d.color_bg) {
      const colors = deriveCellColors(d.color_bg);
      d.color_bg = colors.bg;
      d.color_fg = colors.fg;
      d.color_border = colors.border;
    }
    return d;
  },
});
