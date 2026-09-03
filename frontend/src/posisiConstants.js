import { toInputDate } from './utils/date';

export const EMPTY_POSISI_FORM = {
  company_id: '', branch_id: '', department_id: '', position_id: '',
  employment_status_id: '', start_date: '', end_date: '', is_current: false, reason: '',
};

export function toPosisiFormData(item) {
  if (!item) return { ...EMPTY_POSISI_FORM };
  return {
    company_id: item.company_id || '',
    branch_id: item.branch_id || '',
    department_id: item.department_id || '',
    position_id: item.position_id || '',
    employment_status_id: item.employment_status_id || '',
    start_date: toInputDate(item.start_date),
    end_date: toInputDate(item.end_date),
    is_current: !!item.is_current,
    reason: item.reason || '',
  };
}
