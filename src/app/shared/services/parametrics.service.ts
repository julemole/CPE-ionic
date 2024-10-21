import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ParametricsService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTaxonomyItems(taxonomy: string) {
    const params = new HttpParams()
      .set(`fields[taxonomy_term--${taxonomy}]`, 'name,status')
    return this.http.get(`${this.API_URL}/taxonomy_term/${taxonomy}`).pipe(
      map((resp: any) => resp.data)
    );
  }
}
