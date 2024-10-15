import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  supabaseUrl: string = environment.host;

  constructor(private http: HttpClient) {}

  async signUp(email: string, password: string) {
  }

  async signIn(email: string, password: string) {
  }

}
