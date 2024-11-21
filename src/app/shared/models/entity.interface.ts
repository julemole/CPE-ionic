export interface SyncLog {
  id?: number;
  sync_date: string;
  details?: string;
}

export interface UserSettings {
  app_theme?: string;
  size_text?: string;
}

export interface User {
  uuid: string;         // NOT NULL
  id?: number;           // NOT NULL
  username?: string;     // NOT NULL
  password?: string;    // NULL
  mail?: string;         // NOT NULL
  full_name?: string;   // NULL
  document_type?: string;   // NULL
  document_number?: string; // NULL
  telephone?: string;   // NULL
  department?: string;  // NULL
  role?: string;        // NULL
  status?: number;       // NOT NULL
}

export interface StateParametric {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
}

export interface Parametric {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  status: number;       // NOT NULL
}

export interface Teacher {
  uuid: string;
  name: string;
  document_type?: string;
  document_number?: string;
  mail?: string;
  phone?: string;
  state_uuid?: string;
  status: number;
}

export interface Annex {
  uuid: string;         // NOT NULL
  server_uuid?: string;   // NULL
  name: string;         // NOT NULL
  description?: string; // NULL
  date_created?: string; // NULL
  file?: string;         // NULL
  is_synced: number;    // NOT NULL
  sync_action?: string;   // NULL
  status: number;       // NOT NULL
}

export interface Evidence {
  uuid: string;         // NOT NULL
  server_uuid?: string;   // NULL
  name: string;         // NOT NULL
  description?: string; // NULL
  date_created?: string; // NULL
  time_created?: string; // NULL
  latitude?: string;    // NULL
  longitude?: string;   // NULL
  has_metadata?: number;  // NULL
  file?: string;         // NULL
  is_synced: number;    // NOT NULL
  sync_action?: string;   // NULL
  status: number;       // NOT NULL
}

export interface Region {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  date_created?: string; // NULL
  department_uuid: string; // NOT NULL
  status: number;       // NOT NULL
}

export interface Sede {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  code_dane?: string;    // NULL
  based?: string;       // NULL
  address?: string;     // NULL
  date_created?: string; // NULL
  department_uuid?: string; // NULL
  location_uuid?: string;  // NULL
  municipality_uuid?: string; // NULL
  state_uuid?: string;     // NULL
  status: number;       // NOT NULL
}

export interface SedesGroup {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  date_created?: string; // NULL
  municipality_uuid?: string; // NULL
  status: number;       // NOT NULL
}

export interface SedesGroupSede {
  sedes_group_uuid: string;  // NOT NULL
  sede_uuid: string;         // NOT NULL
}

export interface Zone {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  date_created?: string; // NULL
  department_uuid?: string; // NULL
  state_uuid?: string;     // NULL
  users?: string[];
  status: number;       // NOT NULL
}

export interface ZoneUsers {
  zone_uuid: string;    // NOT NULL
  user_uuid: string;    // NOT NULL
}

export interface ZoneSedesGroup {
  zone_uuid: string;    // NOT NULL
  sedes_group_uuid: string;  // NOT NULL
}

export interface Register {
  uuid: string;         // NOT NULL
  name: string;         // NOT NULL
  date_created?: string; // NULL
  signature_file?: string; // NULL
  approach_uuid?: string;  // NULL
  activity_uuid?: string;  // NULL
  subactivity_uuid?: string; // NULL
  teacher_uuid?: string;      // NULL
  sede_uuid?: string;      // NULL
  user_uuid?: string;      // NULL
  annexList?: any[];    // NULL
  evidenceList?: any[];  // NULL
  is_synced: number;    // NOT NULL
  sync_action?: string;   // NULL
  status: number;       // NOT NULL
}

export interface RegisterAnnex {
  register_uuid: string;  // NOT NULL
  annex_uuid: string;     // NOT NULL
  is_synced: number;    // NOT NULL
}

export interface RegisterEvidence {
  register_uuid: string;  // NOT NULL
  evidence_uuid: string;  // NOT NULL
  is_synced: number;    // NOT NULL
}
