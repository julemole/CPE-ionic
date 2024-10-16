import { Injectable, signal, WritableSignal } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_USERS = 'myuser';

interface User {
  id: number;
  name: string;
  active: number;
}

export interface Image {
  id: number;
  path: string;
  synced: number;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private readonly sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private user: WritableSignal<User[]> = signal<User[]>([]);
  private image: WritableSignal<Image[]> = signal<Image[]>([]);

  async initilizPlugin() {
    this.db = await this.sqlite.createConnection(
      DB_USERS,
      false,
      'no-encryption',
      1,
      false
    );

    await this.db.open();

    this.createTables();
    this.loadUsers();
    this.loadImages();
    return true;
  }

  async createTables() {
    const schema = `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active INTEGER NOT NULL
    );`;

    const createImagesTable = `CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY NOT NULL,
      path TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL
    );`;

    await this.db.execute(schema);
    await this.db.execute(createImagesTable);
  }

  get users() {
    return this.user;
  }

  get images() {
    return this.image;
  }

  // CRUD Users

  async loadUsers() {
    const user = await this.db.query('SELECT * FROM users;');
    this.user.set(user.values || []);
  }

  async addUser(name: string) {
    const query = `INSERT INTO users (name) VALUES ('${name}');`;
    const result = await this.db.run(query);
    this.loadUsers();
    return result;
  }

  async updateUserById(id: number, active: number) {
    const query = `UPDATE users SET active = ${active} WHERE id = ${id};`;
    const result = await this.db.run(query);
    this.loadUsers();
    return result;
  }

  async deleteUserById(id: number) {
    const query = `DELETE FROM users WHERE id = ${id};`;
    const result = await this.db.run(query);
    this.loadUsers();
    return result;
  }

  // CRUD Images

  async loadImages() {
    const images = await this.db.query('SELECT * FROM images;');
    this.image.set(images.values || []);
  }

  async addImage(path: string, latitude: number | null, longitude: number | null) {
    const insertQuery = `INSERT INTO images (path, synced, latitude, longitude) VALUES ('${path}', 0, ${latitude}, ${longitude});`;
    const result = await this.db.run(insertQuery);
    this.loadImages();
    return result;
  }

  async getUnsyncedImages() {
    const selectQuery = `SELECT * FROM images WHERE synced = 0;`;
    const result = await this.db.query(selectQuery);
    return result.values;
  }

  async markImageAsSynced(id: number) {
    const updateQuery = `UPDATE images SET synced = 1 WHERE id = ?;`;
    await this.db.run(updateQuery, [id]);
    this.loadImages();
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
}

