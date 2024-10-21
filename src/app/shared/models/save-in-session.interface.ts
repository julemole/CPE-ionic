export interface PhotoData {
  id: number;
  idFile?: string;
  idEvidence?: string;
  name: string;
  description: string;
  date: string;
  time: string;
  latitude: string;
  longitude: string;
  url: string | null;
  file: File | null;
}

export interface attachedData {
  id: number;
  idFile?: string;
  idAnnex?: string;
  name: string;
  description: string;
  file: File | null;
  url: string | null;
  urlType: string;
}
