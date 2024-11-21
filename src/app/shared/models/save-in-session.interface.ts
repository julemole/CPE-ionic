export interface PhotoData {
  id: number;
  local_uuid?: string;
  idFile?: string;
  idOriginalFile?: string;
  idEvidence?: string;
  name: string;
  description: string;
  date: string;
  time: string;
  latitude: string;
  longitude: string;
  url: string | null;
  file: File | null;
  originalFile?: File | null;
}

export interface attachedData {
  id: number;
  local_uuid?: string;
  idFile?: string;
  idOriginalFile?: string;
  idAnnex?: string;
  name: string;
  description: string;
  file: File | null;
  fileType?: string;
  url: string | null;
  urlType: string;
}
