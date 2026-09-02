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
    start_date: item.start_date?.slice(0, 10) || '',
    end_date: item.end_date?.slice(0, 10) || '',
    status: item.status || 'ACTIVE',
    document_path: item.document_path || '',
  };
}
