/** Shared types/helpers for "request more information" on an order. */

export type InfoRequestType = 'photo' | 'file' | 'text';
export type InfoRequestStatus = 'open' | 'submitted' | 'resolved' | 'cancelled';

export interface InfoRequest {
  id: string;
  order_id: string;
  requested_by: string | null;
  request_type: InfoRequestType;
  message: string;
  status: InfoRequestStatus;
  previous_status: string | null;
  response_text: string | null;
  response_files: string[];
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export const INFO_REQUEST_TYPE_LABELS: Record<InfoRequestType, string> = {
  photo: 'Photo(s)',
  file: 'File(s)',
  text: 'Written answer',
};

export const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|heic|avif|svg)(\?|$)/i.test(url);
export const fileNameFromUrl = (url: string) => {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() || 'file');
    return last.replace(/^\d+-[a-z0-9]+-/, '');
  } catch {
    return 'file';
  }
};

/** Shown when the database table hasn't been created yet. */
export const isMissingTableError = (msg?: string | null) =>
  !!msg && /order_info_requests/.test(msg) && /(does not exist|schema cache|not find)/i.test(msg);
