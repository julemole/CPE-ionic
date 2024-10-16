import { Injectable } from '@angular/core';

type LocalStorageKey = 'USER_ID' | 'TOKEN' | 'SETTINGS' | 'LOGOUT_TOKEN' | 'CSRF_TOKEN';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  setItem(key: LocalStorageKey, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: LocalStorageKey) {
    return JSON.parse(localStorage.getItem(key) || '{}');
  }

  removeItem(key: LocalStorageKey) {
    localStorage.removeItem(key);
  }

  clearStorage() {
    localStorage.clear();
  }
}
