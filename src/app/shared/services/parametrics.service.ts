import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, of, reduce } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ParametricsService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private dbService: DatabaseService) { }

  getTaxonomyItems(taxonomy: string): Observable<any[]> {
    const fetchTaxonomyPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data;
          if (resp.links && resp.links.next) {
            return fetchTaxonomyPage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            return of(items);
          }
        })
      );
    };

    const params = new HttpParams()
      .set(`fields[taxonomy_term--${taxonomy}]`, 'name,status');

    const initialUrl = `${this.API_URL}/taxonomy_term/${taxonomy}?sort=name`;

    return fetchTaxonomyPage(initialUrl, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
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

  getMunicipalitiesBytutor(idTutor: string) {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zones]','field_oficces_content')
      .set('fields[taxonomy_term--municipality]','name,status')
      .set('include','field_oficces_content.field_municipality,field_oficces_content.field_group_offices.field_municipality')
      .set('filter[field_tutors.id][value]', idTutor);

    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        const municipalities = resp?.included?.filter((item: any) => item.type === 'taxonomy_term--municipality');
        return municipalities;
      })
    );
  }

  getSedesBytutor(idTutor: string) {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zones]','field_oficces_content')
      .set('include','field_oficces_content.field_group_offices')
      .set('filter[field_tutors.id][value]', idTutor);

    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        const offices = resp?.included?.filter((item: any) => item.type === 'node--offices');
        return offices.map((office: any) => {
          return {
            id: office.id,
            title: office.attributes.title,
            code_dane: office.attributes.field_code_dane,
            address: office.attributes.field_address,
            created: office.attributes.created,
            department: office.relationships.field_department.data.id ? office.relationships.field_department.data.id : null,
            location: office.relationships.field_location.data.id ? office.relationships.field_location.data.id : null,
            municipality: office.relationships.field_municipality.data.id ? office.relationships.field_municipality.data.id : null,
            state: office.relationships.field_state.data ? office.relationships.field_state.data.id : null,
            status: office.attributes.status,
          };
        });
      })
    );
  }
}

