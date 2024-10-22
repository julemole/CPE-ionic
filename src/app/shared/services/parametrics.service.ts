import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ParametricsService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private dbService: DatabaseService) { }

  getTaxonomyItems(taxonomy: string) {
    const params = new HttpParams()
      .set(`fields[taxonomy_term--${taxonomy}]`, 'name,status')
    return this.http.get(`${this.API_URL}/taxonomy_term/${taxonomy}`).pipe(
      map((resp: any) => resp.data)
    );
  }

  async getTaxonomyItemsOffline() {
    try {
      const approaches = await this.dbService.loadApproaches();
      const activities = await this.dbService.loadActivities();
      const subActivities = await this.dbService.loadSubactivities();
      return { approaches, activities, subActivities };
    } catch (error) {
      throw new Error('Error al obtener los items de taxonomía');
    }
  }
}
