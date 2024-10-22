import { Injectable, signal, WritableSignal } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { User, Role, UserRole, StateParametric, Annex, Evidence, Region, Sede, SedesGroup, SedesGroupSede, Zone, ZoneUsers,
  ZoneSedesGroup, Register, RegisterAnnex, RegisterEvidence,
SyncLog,
Parametric
 } from '../models/entity.interface';

const DB_USERS = 'myuser';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private readonly sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private sync_log: WritableSignal<SyncLog[]> = signal<SyncLog[]>([]);
  private user: WritableSignal<User[]> = signal<User[]>([]);
  private roles: WritableSignal<Role[]> = signal<Role[]>([]);
  private userRoles: WritableSignal<UserRole[]> = signal<UserRole[]>([]);
  private stateParametrics: WritableSignal<StateParametric[]> = signal<StateParametric[]>([]);
  private departments: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private all_departments: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private approaches: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private activities: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private subactivities: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private locations: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private municipalities: WritableSignal<Parametric[]> = signal<Parametric[]>([]);
  private annexes: WritableSignal<Annex[]> = signal<Annex[]>([]);
  private evidences: WritableSignal<Evidence[]> = signal<Evidence[]>([]);
  private regions: WritableSignal<Region[]> = signal<Region[]>([]);
  private sedes: WritableSignal<Sede[]> = signal<Sede[]>([]);
  private sedesGroups: WritableSignal<SedesGroup[]> = signal<SedesGroup[]>([]);
  private sedesGroupSedes: WritableSignal<SedesGroupSede[]> = signal<SedesGroupSede[]>([]);
  private zones: WritableSignal<Zone[]> = signal<Zone[]>([]);
  private zoneUsers: WritableSignal<ZoneUsers[]> = signal<ZoneUsers[]>([]);
  private zoneSedesGroups: WritableSignal<ZoneSedesGroup[]> = signal<ZoneSedesGroup[]>([]);
  private registers: WritableSignal<Register[]> = signal<Register[]>([]);
  private registerAnnexes: WritableSignal<RegisterAnnex[]> = signal<RegisterAnnex[]>([]);
  private registerEvidences: WritableSignal<RegisterEvidence[]> = signal<RegisterEvidence[]>([]);

  async initilizPlugin() {
    this.db = await this.sqlite.createConnection(
      DB_USERS,
      false,
      'no-encryption',
      1,
      false
    );

    await this.db.open();

    await this.createTables();
    return true;
  }

  async loadAllData() {
    await this.loadSyncLogs();
    await this.loadRoles();
    await this.loadUserRoles();
    await this.loadStateParametrics();
    await this.loadDepartments();
    await this.loadApproaches();
    await this.loadActivities();
    await this.loadSubactivities();
    // await this.loadLocations();
    // await this.loadMunicipalities();
    // await this.loadAnnexes();
    // await this.loadEvidences();
    // await this.loadRegions();
    // await this.loadSedes();
    // await this.loadSedesGroups();
    // await this.loadSedesGroupSedes();
    // await this.loadZoneUsers();
    // await this.loadZoneSedesGroups();
    // await this.loadRegisters();
    // await this.loadRegisterAnnexes();
    // await this.loadRegisterEvidences();
  }

  async createTables() {
    const sync_log = `CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_date TEXT NOT NULL,
      details TEXT
    );`;

    const users = `CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY NOT NULL,
      id INTEGER NOT NULL,
      username TEXT NOT NULL,
      password TEXT,
      mail TEXT NOT NULL,
      full_name TEXT,
      document_type TEXT,
      document_number TEXT,
      telephone TEXT,
      department TEXT,
      status INTEGER NOT NULL
    );`;

    const roles = `CREATE TABLE IF NOT EXISTS roles (
      name TEXT PRIMARY KEY NOT NULL
    );`;

    const user_roles = `CREATE TABLE IF NOT EXISTS user_roles (
      user_uuid TEXT NOT NULL,
      role_name TEXT NOT NULL,
      PRIMARY KEY (user_uuid, role_name),
      FOREIGN KEY (user_uuid) REFERENCES users(uuid),
      FOREIGN KEY (role_name) REFERENCES roles(name)
    );`;

    /****************************** TAXONOMIES  *******************************************/

    const stateParametric = `CREATE TABLE IF NOT EXISTS state_parametric (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );`;

    const department = `CREATE TABLE IF NOT EXISTS department (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const all_departments = `CREATE TABLE IF NOT EXISTS all_departments (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const approach = `CREATE TABLE IF NOT EXISTS approach (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const activity = `CREATE TABLE IF NOT EXISTS activity (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const subactivity = `CREATE TABLE IF NOT EXISTS subactivity (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const location = `CREATE TABLE IF NOT EXISTS location (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    const municipality = `CREATE TABLE IF NOT EXISTS municipality (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      status INTEGER NOT NULL
    );`;

    /****************************** NODES  *******************************************/

    const annex = `CREATE TABLE IF NOT EXISTS annex (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date_created TEXT,
      file TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0,
      sync_action TEXT,
      status INTEGER NOT NULL
    );`;

    const evidence = `CREATE TABLE IF NOT EXISTS evidence (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      date_created TEXT,
      Time_created TEXT,
      latitude REAL,
      longitude REAL,
      file TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0,
      sync_action TEXT,
      status INTEGER NOT NULL
    );`;

    const region = `CREATE TABLE IF NOT EXISTS region (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date_created TEXT,
      department_uuid TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (department_uuid) REFERENCES department(uuid)
    );`;

    //NOTE: Pendiente saber que es feeds_item en sedes (offices), es un array, aquí se usan los all departments, cual es al fin?

    const sedes = `CREATE TABLE IF NOT EXISTS sedes (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date_created TEXT,
      department_uuid TEXT,
      location_uuid TEXT,
      municipality_uuid TEXT,
      state_uuid TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (department_uuid) REFERENCES all_departments(uuid),
      FOREIGN KEY (location_uuid) REFERENCES location(uuid),
      FOREIGN KEY (municipality_uuid) REFERENCES municipality(uuid),
      FOREIGN KEY (state_uuid) REFERENCES state_parametric(uuid)
    );`;

    const sedes_group = `CREATE TABLE IF NOT EXISTS sedes_group (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date_created TEXT,
      municipality_uuid TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (municipality_uuid) REFERENCES municipality(uuid)
    );`;

    //Tabla intermedia
    const sedes_group_sede = `CREATE TABLE IF NOT EXISTS sedes_group_sede (
      sedes_group_uuid TEXT NOT NULL,
      sede_uuid TEXT NOT NULL,
      PRIMARY KEY (sedes_group_uuid, sede_uuid),
      FOREIGN KEY (sedes_group_uuid) REFERENCES sedes_group(uuid),
      FOREIGN KEY (sede_uuid) REFERENCES sedes(uuid)
    );`;

    const zone = `CREATE TABLE IF NOT EXISTS zone (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date_created TEXT,
      department_uuid TEXT,
      region_uuid TEXT,
      state_uuid TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (department_uuid) REFERENCES department(uuid),
      FOREIGN KEY (region_uuid) REFERENCES region(uuid),
      FOREIGN KEY (state_uuid) REFERENCES state_parametric(uuid)
    );`;

    //Tabla intermedia
    const zone_users = `CREATE TABLE IF NOT EXISTS zone_users (
      zone_uuid TEXT NOT NULL,
      user_uuid TEXT NOT NULL,
      PRIMARY KEY (zone_uuid, user_uuid),
      FOREIGN KEY (zone_uuid) REFERENCES zone(uuid),
      FOREIGN KEY (user_uuid) REFERENCES users(uuid)
    );`;

    //Tabla intermedia
    const zone_sedes_group = `CREATE TABLE IF NOT EXISTS zone_sedes_group (
      zone_uuid TEXT NOT NULL,
      sedes_group_uuid TEXT NOT NULL,
      PRIMARY KEY (zone_uuid, sedes_group_uuid),
      FOREIGN KEY (zone_uuid) REFERENCES zone(uuid),
      FOREIGN KEY (sedes_group_uuid) REFERENCES sedes_group(uuid)
    );`;

    const register = `CREATE TABLE IF NOT EXISTS register (
      uuid TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      date_created TEXT,
      signature_file TEXT,
      approach_uuid TEXT,
      activity_uuid TEXT,
      subactivity_uuid TEXT,
      sede_uuid TEXT,
      user_uuid TEXT,
      is_synced INTEGER NOT NULL DEFAULT 0,
      sync_action TEXT,
      status INTEGER NOT NULL,
      FOREIGN KEY (approach_uuid) REFERENCES approach(uuid),
      FOREIGN KEY (activity_uuid) REFERENCES activity(uuid),
      FOREIGN KEY (subactivity_uuid) REFERENCES subactivity(uuid),
      FOREIGN KEY (sede_uuid) REFERENCES sedes(uuid)
    );`;

    // Tabla intermedia para relacionar register con annex
    const register_annex = `CREATE TABLE IF NOT EXISTS register_annex (
      register_uuid TEXT NOT NULL,
      annex_uuid TEXT NOT NULL,
      PRIMARY KEY (register_uuid, annex_uuid),
      FOREIGN KEY (register_uuid) REFERENCES register(uuid),
      FOREIGN KEY (annex_uuid) REFERENCES annex(uuid)
    );`;

    // Tabla intermedia para relacionar register con evidence
    const register_evidence = `CREATE TABLE IF NOT EXISTS register_evidence (
      register_uuid TEXT NOT NULL,
      evidence_uuid TEXT NOT NULL,
      PRIMARY KEY (register_uuid, evidence_uuid),
      FOREIGN KEY (register_uuid) REFERENCES register(uuid),
      FOREIGN KEY (evidence_uuid) REFERENCES evidence(uuid)
    );`;

    await this.db.execute(`PRAGMA foreign_keys = ON;`);
    await this.db.execute(sync_log);
    await this.db.execute(users);
    await this.db.execute(roles);
    await this.db.execute(user_roles);
    await this.db.execute(stateParametric);
    await this.db.execute(department);
    await this.db.execute(all_departments);
    await this.db.execute(approach);
    await this.db.execute(activity);
    await this.db.execute(subactivity);
    await this.db.execute(location);
    await this.db.execute(municipality);
    await this.db.execute(annex);
    await this.db.execute(evidence);
    await this.db.execute(region);
    await this.db.execute(sedes);
    await this.db.execute(sedes_group);
    await this.db.execute(sedes_group_sede);
    await this.db.execute(zone);
    await this.db.execute(zone_users);
    await this.db.execute(zone_sedes_group);
    await this.db.execute(register);
    await this.db.execute(register_annex);
    await this.db.execute(register_evidence);

    // // Crear índices
    // const indexUserName = `CREATE INDEX IF NOT EXISTS idx_user_name ON users (username);`;
    // const indexDepartmentName = `CREATE INDEX IF NOT EXISTS idx_department_name ON department (name);`;
    // const indexActivityName = `CREATE INDEX IF NOT EXISTS idx_activity_name ON activity (name);`;
    // const indexSubActivityName = `CREATE INDEX IF NOT EXISTS idx_subactivity_name ON subactivity (name);`;

    // await this.db.execute(indexUserName);
    // await this.db.execute(indexDepartmentName);
    // await this.db.execute(indexActivityName);
    // await this.db.execute(indexSubActivityName);
  }

  getSyncLogList() {
    return this.sync_log;
  }

  getUserList() {
    return this.user;
  }

  getRoleList() {
    return this.roles;
  }

  getUserRoleList() {
    return this.userRoles;
  }

  getStateParametricList() {
    return this.stateParametrics;
  }

  getDepartmentList() {
    return this.departments;
  }

  getApproachList() {
    return this.approaches;
  }

  getActivityList() {
    return this.activities;
  }

  getSubActivityList() {
    return this.subactivities;
  }

  getLocationList() {
    return this.locations;
  }

  getMunicipalityList() {
    return this.municipalities;
  }

  getAnnexList() {
    return this.annexes;
  }

  getEvidenceList() {
    return this.evidences;
  }

  getRegionList() {
    return this.regions;
  }

  getSedeList() {
    return this.sedes;
  }

  getSedesGroupList() {
    return this.sedesGroups;
  }

  getSedesGroupSedeList() {
    return this.sedesGroupSedes;
  }

  getZoneList() {
    return this.zones;
  }

  getZoneUserList() {
    return this.zoneUsers;
  }

  getZoneSedesGroupList() {
    return this.zoneSedesGroups;
  }

  getRegisterList() {
    return this.registers;
  }

  getRegisterAnnexList() {
    return this.registerAnnexes;
  }

  getRegisterEvidenceList() {
    return this.registerEvidences;
  }

  // CRUD SyncLog

  async loadSyncLogs() {
    const syncLogs = await this.db.query('SELECT * FROM sync_log ORDER BY sync_date DESC;');
    this.sync_log.set(syncLogs.values || []);
  }

  async addSyncLog(syncLog: Partial<SyncLog>) {
    const query = `INSERT INTO sync_log (sync_date, details) VALUES ('${syncLog.sync_date}', '${syncLog.details}');`;
    const result = await this.db.run(query);
    this.loadSyncLogs();
    return result;
  }

  // CRUD Users

  async getUserById(uuid: string): Promise<User | null> {
    const query = `
      SELECT u.*,
             GROUP_CONCAT(r.name, ',') AS roles,
             d.name AS department_name
      FROM users u
      LEFT JOIN user_roles ur ON u.uuid = ur.user_uuid
      LEFT JOIN roles r ON ur.role_name = r.name
      LEFT JOIN department d ON u.department = d.uuid
      WHERE u.uuid = '${uuid}'
      GROUP BY u.uuid, d.name;
    `;
    const user = await this.db.query(query);
    return user?.values?.[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT u.*, GROUP_CONCAT(r.name, ',') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.uuid = ur.user_uuid
      LEFT JOIN roles r ON ur.role_name = r.name
      WHERE u.username = '${username}'
      GROUP BY u.uuid;
    `;
    const user = await this.db.query(query);
    return user?.values?.[0] || null;
  }

  async addUser(user: Partial<User>) {
    const query = `
      INSERT INTO users (uuid, id, username, password, mail, full_name, document_type, document_number, telephone, department, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const result = await this.db.run(query, [
      user.uuid,
      user.id,
      user.username,
      user.password || null, // Permite que password sea null si no está definido
      user.mail,
      user.full_name || null, // Permite que full_name sea null si no está definido
      user.document_type || null, // Permite que document_type sea null si no está definido
      user.document_number || null, // Permite que document_number sea null si no está definido
      user.telephone || null, // Permite que telephone sea null si no está definido
      user.department || null, // Permite que department sea null si no está definido
      user.status !== undefined ? user.status : 1 // Define el status, 1 por defecto si no está definido
    ]);

    return result;
  }

  async updateUserById(uuid: string, updatedData: Partial<User>) {
    const query = `
      UPDATE users
      SET
        username = ?,
        password = ?,
        mail = ?,
        full_name = ?,
        document_type = ?,
        document_number = ?,
        telephone = ?,
        department = ?,
        status = ?
      WHERE uuid = ?;
    `;

    const result = await this.db.run(query, [
      updatedData.username,
      updatedData.password || null, // Permite que password sea null si no está definida
      updatedData.mail,
      updatedData.full_name || null, // Permite que full_name sea null si no está definida
      updatedData.document_type || null, // Permite que document_type sea null si no está definida
      updatedData.document_number || null, // Permite que document_number sea null si no está definida
      updatedData.telephone || null, // Permite que telephone sea null si no está definida
      updatedData.department || null, // Permite que department sea null si no está definida
      updatedData.status !== undefined ? updatedData.status : 1, // Define status, 1 por defecto si no está definido
      uuid // El uuid del usuario que queremos actualizar
    ]);

    return result;
  }

  // CRUD Roles

  async loadRoles() {
    const roles = await this.db.query('SELECT * FROM roles;');
    this.roles.set(roles.values || []);
  }

  async addRole(role: Partial<Role>) {
    const query = `
      INSERT INTO roles (name)
      VALUES ('${role.name}');
    `;
    const result = await this.db.run(query);
    this.loadRoles();
    return result;
  }

  // CRUD UserRoles

  async loadUserRoles() {
    const userRoles = await this.db.query('SELECT * FROM user_roles;');
    this.userRoles.set(userRoles.values || []);
  }

  async addUserRole(userUuid: string, roleName: string) {
    const query = `
      INSERT INTO user_roles (user_uuid, role_name)
      VALUES ('${userUuid}', '${roleName}');
    `;
    const result = await this.db.run(query);
    this.loadUserRoles();
    return result;
  }

  // CRUD StateParametric

  async loadStateParametrics() {
    const stateParametrics = await this.db.query('SELECT * FROM state_parametric;');
    this.stateParametrics.set(stateParametrics.values || []);
  }

  async addStateParametric(stateParametric: Partial<StateParametric>) {
    const query = `
      INSERT INTO state_parametric (uuid, name)
      VALUES ('${stateParametric.uuid}', '${stateParametric.name}');
    `;
    const result = await this.db.run(query);
    this.loadStateParametrics();
    return result;
  }

  // CRUD Department

  async loadDepartments() {
    const departments = await this.db.query('SELECT * FROM department;');
    this.departments.set(departments.values || []);
  }

  async addDepartment(department: Partial<Parametric>) {
    const query = `
      INSERT INTO department (uuid, name, status)
      VALUES ('${department.uuid}', '${department.name}', ${department.status});
    `;
    const result = await this.db.run(query);
    this.loadDepartments();
    return result;
  }

  // CRUD ALL Departments

  async loadAllDepartments() {
    const all_departments = await this.db.query('SELECT * FROM all_departments;');
    this.all_departments.set(all_departments.values || []);
  }

  async addAllDepartment(all_departments: Partial<Parametric>) {
    const query = `
      INSERT INTO all_departments (uuid, name, status)
      VALUES ('${all_departments.uuid}', '${all_departments.name}', ${all_departments.status});
    `;
    const result = await this.db.run(query);
    this.loadAllDepartments();
    return result;
  }

  // CRUD Approach

  async loadApproaches() {
    const approaches = await this.db.query('SELECT * FROM approach;');
    return approaches.values || [];
    // this.approaches.set(approaches.values || []);
  }

  async addApproach(approach: Partial<Parametric>) {
    const query = `
      INSERT INTO approach (uuid, name, status)
      VALUES ('${approach.uuid}', '${approach.name}', ${approach.status});
    `;
    const result = await this.db.run(query);
    this.loadApproaches();
    return result;
  }

  // CRUD Activity

  async loadActivities() {
    const activities = await this.db.query('SELECT * FROM activity;');
    return activities.values || [];
    // this.activities.set(activities.values || []);
  }

  async addActivity(activity: Partial<Parametric>) {
    const query = `
      INSERT INTO activity (uuid, name, status)
      VALUES ('${activity.uuid}', '${activity.name}', ${activity.status});
    `;
    const result = await this.db.run(query);
    this.loadActivities();
    return result;
  }

  // CRUD Subactivity

  async loadSubactivities() {
    const subactivities = await this.db.query('SELECT * FROM subactivity;');
    return subactivities.values || [];
    // this.subactivities.set(subactivities.values || []);
  }

  async addSubactivity(subactivity: Partial<Parametric>) {
    const query = `
      INSERT INTO subactivity (uuid, name, status)
      VALUES ('${subactivity.uuid}', '${subactivity.name}', ${subactivity.status});
    `;
    const result = await this.db.run(query);
    this.loadSubactivities();
    return result;
  }

  // CRUD Location

  async loadLocations() {
    const locations = await this.db.query('SELECT * FROM location;');
    this.locations.set(locations.values || []);
  }

  async addLocation(location: Partial<Parametric>) {
    const query = `
      INSERT INTO location (uuid, name, status)
      VALUES ('${location.uuid}', '${location.name}', ${location.status});
    `;
    const result = await this.db.run(query);
    this.loadLocations();
    return result;
  }

  // CRUD Municipality

  async loadMunicipalities() {
    const municipalities = await this.db.query('SELECT * FROM municipality;');
    this.municipalities.set(municipalities.values || []);
  }

  async addMunicipality(municipality: Partial<Parametric>) {
    const query = `
      INSERT INTO municipality (uuid, name, status)
      VALUES ('${municipality.uuid}', '${municipality.name}', ${municipality.status});
    `;
    const result = await this.db.run(query);
    this.loadMunicipalities();
    return result;
  }

  // CRUD Annex

  async loadAnnexes() {
    const annexes = await this.db.query('SELECT * FROM annex;');
    this.annexes.set(annexes.values || []);
  }

  async getAnnexById(uuid: string): Promise<Annex | null> {
    const query = `
      SELECT *
      FROM annex
      WHERE uuid = ?;
    `;

    try {
      const result = await this.db.query(query, [uuid]);

      // Verificar si la consulta devolvió algún resultado
      if (result && result.values && result.values.length > 0) {
        return result.values[0]; // Retornar el primer anexo encontrado
      }

      return null; // Si no hay resultados, retornar null
    } catch (error) {
      console.error('Error al obtener el anexo por uuid:', error);
      return null;
    }
  }

  async addAnnex(annex: Partial<Annex>) {
    const query = `
      INSERT INTO annex (uuid, name, description, date_created, file, is_synced, sync_action, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const params = [
      annex.uuid || '',
      annex.name || null,
      annex.description || null,
      annex.date_created || null,
      annex.file || null,
      annex.is_synced || 0,
      annex.sync_action || null,
      annex.status || 1
    ];

    const result = await this.db.run(query, params);
    return result;
  }


  // CRUD Evidence

  async loadEvidences() {
    const evidences = await this.db.query('SELECT * FROM evidence;');
    this.evidences.set(evidences.values || []);
  }

  async getEvidenceById(uuid: string): Promise<Evidence | null> {
    const query = `
      SELECT *
      FROM evidence
      WHERE uuid = ?;
    `;

    try {
      const result = await this.db.query(query, [uuid]);

      if (result && result.values && result.values.length > 0) {
        return result.values[0]; // Retornar la primera evidencia encontrada
      }

      return null; // Si no hay resultados, retornar null
    } catch (error) {
      console.error('Error al obtener la evidencia por uuid:', error);
      return null;
    }
  }

  async addEvidence(evidence: Partial<Evidence>) {
    const query = `
      INSERT INTO evidence (uuid, name, description, date_created, time_created, latitude, longitude, file, is_synced, sync_action, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      evidence.uuid || '',
      evidence.name || null,
      evidence.description || null,
      evidence.date_created || null,
      evidence.time_created || null,
      evidence.latitude || null,
      evidence.longitude || null,
      evidence.file || null,
      evidence.is_synced || 0,
      evidence.sync_action || null,
      evidence.status || 1
    ];

    const result = await this.db.run(query, values);
    return result;
  }

  // CRUD Region

  async loadRegions() {
    const regions = await this.db.query('SELECT * FROM region;');
    this.regions.set(regions.values || []);
  }

  async addRegion(region: Partial<Region>) {
    const query = `
      INSERT INTO region (uuid, name, date_created, department_uuid, status)
      VALUES (?, ?, ?, ?, ?);
    `;
    const values = [
      region.uuid,
      region.name,
      region.date_created,
      region.department_uuid ?? null,  // Usa null si el valor es undefined
      region.status
    ];

    const result = await this.db.run(query, values);
    // this.loadRegions();
    return result;
  }

  // CRUD Sede

  async loadSedes() {
    const sedes = await this.db.query('SELECT * FROM sedes;');
    this.sedes.set(sedes.values || []);
  }

  async getSedeById(uuid: string): Promise<Sede | null> {
    const query = `
      SELECT *
      FROM sedes
      WHERE uuid = ?;
    `;

    try {
      const result = await this.db.query(query, [uuid]);
      return result?.values?.[0] || null;  // Retorna la primera sede o null si no encuentra
    } catch (error) {
      console.error('Error cargando la sede por uuid:', error);
      return null;
    }
  }


  async addSede(sede: Partial<Sede>) {
    const query = `
      INSERT INTO sedes (uuid, name, date_created, department_uuid, location_uuid, municipality_uuid, state_uuid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
      sede.uuid,
      sede.name,
      sede.date_created,
      sede.department_uuid ?? null,
      sede.location_uuid ?? null,
      sede.municipality_uuid ?? null,
      sede.state_uuid ?? null,  // Usa null si el valor es undefined
      sede.status
    ];

    const result = await this.db.run(query, values);
    // this.loadSedes();
    return result;
  }

  // CRUD SedesGroup

  async loadSedesGroups() {
    const query = `
      SELECT sg.*,
            GROUP_CONCAT(s.name, ', ') AS sedes
      FROM sedes_group sg
      LEFT JOIN sedes_group_sede sgs ON sg.uuid = sgs.sedes_group_uuid
      LEFT JOIN sedes s ON sgs.sede_uuid = s.uuid
      GROUP BY sg.uuid;
    `;
    const sedesGroups = await this.db.query(query);
    this.sedesGroups.set(sedesGroups.values || []);
  }

  async addSedesGroup(sedesGroup: Partial<SedesGroup>) {
    const query = `
      INSERT INTO sedes_group (uuid, name, date_created, municipality_uuid, status)
      VALUES (?, ?, ?, ?, ?);
    `;
    const values = [
      sedesGroup.uuid,
      sedesGroup.name,
      sedesGroup.date_created,
      sedesGroup.municipality_uuid ?? null,
      sedesGroup.status
    ];

    const result = await this.db.run(query, values);
    // this.loadSedesGroups();
    return result;
  }

  // CRUD SedesGroupSede (Relación muchos a muchos)

  async loadSedesGroupSedes() {
    const sedesGroupSedes = await this.db.query('SELECT * FROM sedes_group_sede;');
    this.sedesGroupSedes.set(sedesGroupSedes.values || []);
  }

  async addSedeToSedesGroup(sedesGroupUuid: string, sedeUuid: string) {
    const query = `
      INSERT INTO sedes_group_sede (sedes_group_uuid, sede_uuid)
      VALUES ('${sedesGroupUuid}', '${sedeUuid}');
    `;
    const result = await this.db.run(query);
    // this.loadSedesGroupSedes();
    return result;
  }

  // CRUD Zone

  async loadZonesByUser(userUuid: string) {
    const query = `
      SELECT
        z.uuid AS zone_uuid, z.name AS zone_name, z.date_created AS zone_date_created, z.status AS zone_status,
        z.region_uuid,
        sg.uuid AS sedes_group_uuid, sg.name AS sedes_group_name, sg.date_created AS sedes_group_date_created,
        m.name AS municipality_name,
        r.name AS region_name,
        s.uuid AS sede_uuid, s.name AS sede_name, s.date_created AS sede_date_created, s.status AS sede_status,
        s.department_uuid, s.location_uuid, s.municipality_uuid, s.state_uuid
      FROM zone z
      LEFT JOIN zone_users zu ON z.uuid = zu.zone_uuid
      LEFT JOIN region r ON z.region_uuid = r.uuid
      LEFT JOIN zone_sedes_group zsg ON z.uuid = zsg.zone_uuid
      LEFT JOIN sedes_group sg ON zsg.sedes_group_uuid = sg.uuid
      LEFT JOIN municipality m ON sg.municipality_uuid = m.uuid
      LEFT JOIN sedes_group_sede sgs ON sg.uuid = sgs.sedes_group_uuid
      LEFT JOIN sedes s ON sgs.sede_uuid = s.uuid
      WHERE zu.user_uuid = ?
      ORDER BY z.uuid, sg.uuid, s.uuid;
    `;

    try {
      const result = await this.db.query(query, [userUuid]);

      // Estructurar la respuesta en un formato más adecuado
      const zonesMap = new Map();

      result?.values?.forEach(row => {
        // Verificar si la zona ya está en el mapa
        if (!zonesMap.has(row.zone_uuid)) {
          zonesMap.set(row.zone_uuid, {
            uuid: row.zone_uuid,
            name: row.zone_name,
            date_created: row.zone_date_created,
            region: row.region_name,
            status: row.zone_status,
            sedes_groups: []
          });
        }

        const zone = zonesMap.get(row.zone_uuid);

        // Verificar si el grupo de sedes ya está en la zona
        let sedesGroup = zone.sedes_groups.find((sg: any) => sg.uuid === row.sedes_group_uuid);
        if (!sedesGroup) {
          sedesGroup = {
            uuid: row.sedes_group_uuid,
            name: row.sedes_group_name,
            date_created: row.sedes_group_date_created,
            municipality: row.municipality_name,  // Añadir el nombre del municipio
            sedes: []
          };
          zone.sedes_groups.push(sedesGroup);
        }

        // Agregar la sede al grupo de sedes
        if (row.sede_uuid) {  // Verificar si hay sede asociada
          sedesGroup.sedes.push({
            uuid: row.sede_uuid,
            name: row.sede_name,
            date_created: row.sede_date_created,
            status: row.sede_status,
            department_uuid: row.department_uuid,
            location_uuid: row.location_uuid,
            municipality_uuid: row.municipality_uuid,
            state_uuid: row.state_uuid
          });
        }
      });

      // Convertir el mapa de zonas en un arreglo
      return Array.from(zonesMap.values());

    } catch (error) {
      console.error('Error cargando las zonas para el usuario:', error);
      return [];
    }
  }

  async addZone(zone: Partial<Zone>) {
    const query = `
      INSERT INTO zone (uuid, name, date_created, department_uuid, region_uuid, state_uuid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
      zone.uuid,
      zone.name,
      zone.date_created,
      zone.department_uuid ?? null,  // Usa null si el valor es undefined
      zone.region_uuid ?? null,      // Usa null si el valor es undefined
      zone.state_uuid ?? null,       // Usa null si el valor es undefined
      zone.status
    ];

    const result = await this.db.run(query, values);
    // this.loadZones();
    return result;
  }

  // CRUD ZoneUsers

  async loadZoneUsers() {
    const zoneUsers = await this.db.query('SELECT * FROM zone_users;');
    this.zoneUsers.set(zoneUsers.values || []);
  }

  async addUserToZone(zoneUuid: string, userUuid: string) {
    const query = `
      INSERT INTO zone_users (zone_uuid, user_uuid)
      VALUES ('${zoneUuid}', '${userUuid}');
    `;
    const result = await this.db.run(query);
    // this.loadZoneUsers();
    return result;
  }

  // CRUD ZoneSedesGroup

  async loadZoneSedesGroups() {
    const zoneSedesGroups = await this.db.query('SELECT * FROM zone_sedes_group;');
    this.zoneSedesGroups.set(zoneSedesGroups.values || []);
  }

  async addSedesGroupToZone(zoneUuid: string, sedesGroupUuid: string) {
    const query = `
      INSERT INTO zone_sedes_group (zone_uuid, sedes_group_uuid)
      VALUES ('${zoneUuid}', '${sedesGroupUuid}');
    `;
    const result = await this.db.run(query);
    // this.loadZoneSedesGroups();
    return result;
  }

  // CRUD Register

  async loadRegisters() {
    const query = `
      SELECT r.*,
            GROUP_CONCAT(DISTINCT a.name) AS annexes,
            GROUP_CONCAT(DISTINCT e.name) AS evidences
      FROM register r
      LEFT JOIN register_annex ra ON r.uuid = ra.register_uuid
      LEFT JOIN annex a ON ra.annex_uuid = a.uuid
      LEFT JOIN register_evidence re ON r.uuid = re.register_uuid
      LEFT JOIN evidence e ON re.evidence_uuid = e.uuid
      GROUP BY r.uuid;
    `;
    const registers = await this.db.query(query);
    this.registers.set(registers.values || []);
  }

  async getRegisterById(uuid: string): Promise<Register | null> {
    const query = `
      SELECT r.*,
             a.uuid AS annex_uuid, a.name AS annex_name, a.description AS annex_description, a.file AS annex_file,
             e.uuid AS evidence_uuid, e.name AS evidence_name, e.description AS evidence_description, e.file AS evidence_file,
             r.signature_file
      FROM register r
      LEFT JOIN register_annex ra ON r.uuid = ra.register_uuid
      LEFT JOIN annex a ON ra.annex_uuid = a.uuid
      LEFT JOIN register_evidence re ON r.uuid = re.register_uuid
      LEFT JOIN evidence e ON re.evidence_uuid = e.uuid
      WHERE r.uuid = ?
    `;

    try {
      const result = await this.db.query(query, [uuid]);

      if (result && result.values && result?.values?.length > 0) {
        const register = result.values[0];

        // Inicializar sets para controlar duplicados
        const annexSet = new Set();
        const evidenceSet = new Set();

        // Inicializar listas vacías
        const annexList: Array<any> = [];
        const evidenceList: Array<any> = [];

        // Recorrer filas para construir anexos y evidencias
        result.values.forEach((row: any) => {
          if (row.annex_uuid && !annexSet.has(row.annex_uuid)) {
            annexSet.add(row.annex_uuid);
            annexList.push({
              uuid: row.annex_uuid,
              name: row.annex_name,
              description: row.annex_description,
              file: row.annex_file
            });
          }

          if (row.evidence_uuid && !evidenceSet.has(row.evidence_uuid)) {
            evidenceSet.add(row.evidence_uuid);
            evidenceList.push({
              uuid: row.evidence_uuid,
              name: row.evidence_name,
              description: row.evidence_description,
              file: row.evidence_file
            });
          }
        });

        // Retornar registro con anexos y evidencias únicos
        return {
          ...register,
          annexList,
          evidenceList,
          signature_file: register.signature_file
        };
      }

      return null;
    } catch (error) {
      console.error('Error al obtener el registro por uuid:', error);
      return null;
    }
  }

  async getRegistersByUser(userUuid: string) {
    const query = `
      SELECT r.*,
             GROUP_CONCAT(DISTINCT a.name) AS annexes,
             GROUP_CONCAT(DISTINCT e.name) AS evidences,
             s.name AS sede_name
      FROM register r
      LEFT JOIN register_annex ra ON r.uuid = ra.register_uuid
      LEFT JOIN annex a ON ra.annex_uuid = a.uuid
      LEFT JOIN register_evidence re ON r.uuid = re.register_uuid
      LEFT JOIN evidence e ON re.evidence_uuid = e.uuid
      LEFT JOIN sedes s ON r.sede_uuid = s.uuid  -- Hacemos JOIN con la tabla de sedes
      WHERE r.user_uuid = ?
      GROUP BY r.uuid, s.name;
    `;

    try {
      const registers = await this.db.query(query, [userUuid]);
      return registers.values || [];
    } catch (error) {
      console.error('Error al obtener los registros por usuario:', error);
      return [];
    }
}


  async addRegister(register: Partial<Register>) {
    const query = `
      INSERT INTO register (uuid, name, date_created, signature_file, approach_uuid, activity_uuid, subactivity_uuid, sede_uuid, user_uuid, is_synced, sync_action, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const values = [
      register.uuid,
      register.name,
      register.date_created,
      register.signature_file ?? null,  // Usa null si el valor es undefined
      register.approach_uuid ?? null,   // Usa null si el valor es undefined
      register.activity_uuid ?? null,   // Usa null si el valor es undefined
      register.subactivity_uuid ?? null,  // Usa null si el valor es undefined
      register.sede_uuid ?? null,       // Usa null si el valor es undefined
      register.user_uuid ?? null,       // Usa null si el valor es undefined
      register.is_synced ?? 0,          // Asegura que is_synced tenga un valor predeterminado
      register.sync_action ?? null,     // Usa null si el valor es undefined
      register.status
    ];

    const result = await this.db.run(query, values);
    // this.loadRegisters();
    return result;
  }

  // CRUD RegisterAnnex

  async loadRegisterAnnexes() {
    const registerAnnexes = await this.db.query('SELECT * FROM register_annex;');
    this.registerAnnexes.set(registerAnnexes.values || []);
  }

  async addAnnexToRegister(registerUuid: string, annexUuid: string) {
    const query = `
      INSERT INTO register_annex (register_uuid, annex_uuid)
      VALUES ('${registerUuid}', '${annexUuid}');
    `;
    const result = await this.db.run(query);
    return result;
  }

  // CRUD RegisterEvidence

  async loadRegisterEvidences() {
    const registerEvidences = await this.db.query('SELECT * FROM register_evidence;');
    this.registerEvidences.set(registerEvidences.values || []);
  }

  async addEvidenceToRegister(registerUuid: string, evidenceUuid: string) {
    const query = `
      INSERT INTO register_evidence (register_uuid, evidence_uuid)
      VALUES ('${registerUuid}', '${evidenceUuid}');
    `;
    const result = await this.db.run(query);
    return result;
  }

  async resetDatabase() {
    // Cerrar la conexión si está abierta
    if (this.db) {
      await this.db.close();
    }

    // Eliminar la base de datos
    await this.db.delete();

    // Inicializar nuevamente la base de datos
    await this.initilizPlugin();
  }

  async isDbReady() {
    return !!this.db;
  }
}

