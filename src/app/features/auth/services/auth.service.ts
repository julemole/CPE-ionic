import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthRequest, AuthResponse } from '../models/auth.interface';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  hostURL = environment.host;

  constructor(private http: HttpClient) {}

  signIn(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.hostURL}/member/login?_format=json`, credentials);
  }

  logout(logoutToken: string, csrf_token: string) {
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf_token
    };
    return this.http.post(`${this.hostURL}/member/logout?_format=json&token=${logoutToken}`, {}, {headers});
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

}
