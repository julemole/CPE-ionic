import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthRequest, AuthResponse } from '../models/auth.interface';
import { map, Observable } from 'rxjs';
import { DatabaseService } from 'src/app/shared/services/database.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  hostURL = environment.host;

  constructor(private http: HttpClient, private dbService: DatabaseService) {}

  signIn(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.hostURL}/member/login?_format=json`, credentials);
  }

  async signInOffline(credentials: AuthRequest) {
    try {
      const user = await this.dbService.getUserByUsername(credentials.name);
      const passBasic = btoa(credentials.pass);

      if (user) {
        const token = btoa(`${credentials.name}:${credentials.pass}`);
        if (user.password === passBasic) {
          return { token, user };
        } else {
          throw new Error('Contraseña incorrecta');
        }
      } else {
        throw new Error('No se encontró el usuario en la DB Local');
      }
    } catch (error: any) {
      if (error.message === 'Contraseña incorrecta' || error.message === 'No se encontró el usuario en la DB Local') {
        throw error;
      } else {
        throw new Error('No se encontró el usuario');
      }
    }
  }

  logout(logoutToken: string, csrf_token: string) {
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf_token
    };
    return this.http.post(`${this.hostURL}/member/logout?_format=json&token=${logoutToken}`, {}, {headers});
  }

  resetPassword(payload: any): Observable<any>{
    const headers = {
      'Content-Type': 'application/json'
    }
    const URL = this.hostURL + '/member/lost-password?_format=json';
    return this.http.post(URL, payload, { headers});
  }

  setPassword(payload: any): Observable<any>{
    const headers = {
      'Content-Type': 'application/json'
    }
    const URL = this.hostURL + '/member/lost-password-reset?_format=json';
    return this.http.post(URL, payload, { headers});
  }

  getUserId(token: string): Observable<string> {
    const URL = `${this.hostURL}/api`;
    const headers = {
      Authorization: `Basic ${token}`
    }
    return this.http.get<any>(URL, {headers}).pipe(
      map((data: any) => {
        if (data && data.meta) {
          return data.meta.links.me.meta.id;
        } else {
          throw new Error('User ID not found in response');
        }
      })
    );
  }

  generateBase64Token(username: string, password: string): string {
    const token = `${username}:${password}`;
    return btoa(token);
  }

  decodeBase64(base64: string): string {
    return atob(base64);
  }

  encodeToBase64(value: string): string {
    return btoa(value);
  }

  getPasswordFromToken(token: string): string {
    const decodedToken = this.decodeBase64(token);
    const parts = decodedToken.split(':');
    if (parts.length === 2) {
      return this.encodeToBase64(parts[1]);
    } else {
      throw new Error('Token inválido');
    }
  }

}
