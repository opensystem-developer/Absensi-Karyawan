import { toInputDate } from './utils/date';

export const EMPTY_KONTRAK_FORM = {
  contract_no: '', type: 'PKWT', start_date: '', end_date: '', status: 'ACTIVE', document_path: '',
};

export const KONTRAK_TYPE_OPTIONS = ['PKWT', 'PKWTT', 'Magang', 'Outsourcing'];
export const KONTRAK_STATUS_OPTIONS = ['ACTIVE', 'EXPIRED', 'TERMINATED'];

export function toKontrakFormData(item) {
  if (!item) return { ...EMPTY_KONTRAK_FORM };
  return {
    contract_no: item.contract_no || '',
    type: item.type || 'PKWT',
    start_date: toInputDate(item.start_date),
    end_date: toInputDate(item.end_date),
    status: item.status || 'ACTIVE',
    document_path: item.document_path || '',
  };
}
