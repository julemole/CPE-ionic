import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserInfo(idUser: string) {
    const URL = `${this.API_URL}/user/user/${idUser}`;
    return this.http.get(URL).pipe(
      map((resp: any) => resp.data.attributes)
    )
  }
}
