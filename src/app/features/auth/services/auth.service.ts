import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserResponse } from '../models/UserResponse.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  supabaseUrl: string = environment.host;

  constructor(private http: HttpClient) {}

  signUp(email: string, password: string) {
  }

  signIn(email: string, password: string): Observable<UserResponse> {
    let body = {
      'name': email,
      'pass': password
    };
    let headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    return this.http
      .post<UserResponse>(
        environment.apiUrl + '/user/login?_format=json',
        body,
        { headers: new HttpHeaders(headers) }
      )
  }

  getAuthorizationToken(name: any, pass: any): string {
    const user = name;
    const password = pass;
    const token = btoa(`${user}:${password}`);
    return token;
  }

}
