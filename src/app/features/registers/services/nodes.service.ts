import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, of, reduce } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NodesService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAnnexList(idUser: string): Observable<any[]> {
    const URL = `${this.API_URL}/node/annex`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', idUser)
      .set('fields[node--annex]', 'title,field_description,created,status,uid,field_file')
      .set('include', 'field_file');

    const fetchAnnexPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const idFile = item.relationships.field_file.data ? item.relationships.field_file.data.id : '';
            let file = idFile ? resp.included.find((file: any) => file.id === idFile) : '';

            file = file ? {
              filename: file.attributes.filename,
              url: `${environment.host}${file.attributes.uri.url}`
            } : '';
            return {
              id: item.id,
              title: item.attributes.title,
              description: item.attributes.field_description,
              created: item.attributes.created,
              status: item.attributes.status,
              file
            };
          });

          if (resp.links && resp.links.next) {
            return fetchAnnexPage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            return of(items);
          }
        })
      );
    };

    return fetchAnnexPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  getEvidenceList(idUser: string): Observable<any[]> {
    const URL = `${this.API_URL}/node/evidence`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', idUser)
      .set('fields[node--evidence]', 'title,field_description,field_latitude,field_longitude,field_evidence_time,field_evidence_date,status,uid,field_image')
      .set('include', 'field_image');

    const fetchEvidencePage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const idFile = item.relationships.field_image.data ? item.relationships.field_image.data.id : null;
            let file = idFile ? resp.included.find((file: any) => file.id === idFile) : null;
            file = file ? {
              filename: file.attributes.filename,
              url: `${environment.host}${file.attributes.uri.url}`
            } : '';
            return {
              id: item.id,
              title: item.attributes.title,
              description: item.attributes.field_description,
              latitude: item.attributes.field_latitude,
              longitude: item.attributes.field_longitude,
              date: item.attributes.field_evidence_date,
              time: item.attributes.field_evidence_time,
              status: item.attributes.status,
              file
            };
          });

          if (resp.links && resp.links.next) {
            return fetchEvidencePage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            return of(items);
          }
        })
      );
    };

    return fetchEvidencePage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  getSedeList(): Observable<any[]> {
    const URL = `${this.API_URL}/node/offices?sort=title`;
    const params = new HttpParams()
      .set('fields[node--sede]', 'title,field_code_dane,field_address,created,status,field_department,field_location,field_municipality,field_state');

    const fetchSedePage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => ({
            id: item.id,
            title: item.attributes.title,
            code_dane: item.attributes.field_code_dane,
            address: item.attributes.field_address,
            created: item.attributes.created,
            status: item.attributes.status,
            department: item.relationships.field_department.data ? item.relationships.field_department.data.id : null,
            location: item.relationships.field_location.data ? item.relationships.field_location.data.id : null,
            municipality: item.relationships.field_municipality.data ? item.relationships.field_municipality.data.id : null,
            state: item.relationships.field_state.data ? item.relationships.field_state.data.id : null
          }));

          if (resp.links && resp.links.next) {
            // Si hay una siguiente página, hacer la siguiente solicitud
            return fetchSedePage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            // No hay más páginas, retornar los elementos actuales
            return of(items);
          }
        })
      );
    };

    // Empezar a traer los datos desde la primera página
    return fetchSedePage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  getSedeGroupList(): Observable<any[]> {
    const URL = `${this.API_URL}/node/group_offices?sort=title`;
    const params = new HttpParams()
      .set('fields[node--sedes_group]', 'title,created,status,field_municipality,field_group_offices');

    const fetchSedeGroupPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const offices = item.relationships.field_group_offices.data ? item.relationships.field_group_offices.data.map((group: any) => group.id) : [];
            return {
              id: item.id,
              title: item.attributes.title,
              created: item.attributes.created,
              status: item.attributes.status,
              municipality: item.relationships.field_municipality.data ? item.relationships.field_municipality.data.id : null,
              offices
            };
          });

          if (resp.links && resp.links.next) {
            // Si hay una siguiente página, hacer la siguiente solicitud
            return fetchSedeGroupPage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            // No hay más páginas, retornar los elementos actuales
            return of(items);
          }
        })
      );
    };

    // Empezar a traer los datos desde la primera página
    return fetchSedeGroupPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  getSedeGroupListByTutor(idTutor: string) {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zones]','field_oficces_content')
      .set('include','field_oficces_content,field_oficces_content.field_group_offices')
      .set('filter[field_tutors.id][value]', idTutor);

    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        const included = resp?.included;
        const groups = resp?.included?.filter((item: any) => item.type === 'node--group_offices');
        return groups.map((group: any) => {
          const officesIds = group.relationships.field_group_offices.data ? group.relationships.field_group_offices.data.map((office: any) => office.id) : [];
          console.log(officesIds)
          const offices = officesIds ? included.filter((office: any) => officesIds.includes(office.id)) : [];
          return {
            id: group.id,
            title: group.attributes.title,
            created: group.attributes.created,
            municipality: group.relationships.field_municipality.data ? group.relationships.field_municipality.data.id : null,
            status: group.attributes.status,
            offices
          };
        });
      })
    );
  }

  getZoneList() {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zone]', 'title,created,status,field_department,field_state,field_oficces_content,field_tutors');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          const groups = item.relationships.field_oficces_content.data ? item.relationships.field_oficces_content.data.map((group: any) => group.id) : [];
          const tutors = item.relationships.field_tutors.data ? item.relationships.field_tutors.data.map((tutor: any) => tutor.id) : [];
          return {
            id: item.id,
            title: item.attributes.title,
            created: item.attributes.created,
            status: item.attributes.status,
            department: item.relationships.field_department.data ? item.relationships.field_department.data.id : null,
            // region: item.relationships.field_region.data ? item.relationships.field_region.data.id : null,
            state: item.relationships.field_state.data ? item.relationships.field_state.data.id : null,
            groups,
            tutors
          }
        })
      })
    )
  }

  getZoneListByTutor(idTutor: string) {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zone]', 'title,created,status,field_department,field_state,field_oficces_content,field_tutors')
      .set('filter[field_tutors.id][value]', idTutor);
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          const groups = item.relationships.field_oficces_content.data ? item.relationships.field_oficces_content.data.map((group: any) => group.id) : [];
          const tutors = item.relationships.field_tutors.data ? item.relationships.field_tutors.data.map((tutor: any) => tutor.id) : [];
          return {
            id: item.id,
            title: item.attributes.title,
            created: item.attributes.created,
            status: item.attributes.status,
            department: item.relationships.field_department.data ? item.relationships.field_department.data.id : null,
            // region: item.relationships.field_region.data ? item.relationships.field_region.data.id : null,
            state: item.relationships.field_state.data ? item.relationships.field_state.data.id : null,
            groups,
            tutors
          }
        })
      })
    )
  }

  getRegisterList(userId: string): Observable<any[]> {
    const URL = `${this.API_URL}/node/registry`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', userId)
      .set('fields[node--registers]', 'title,created,status,uid,field_signature,field_activities,field_approach,field_sub_activities,field_sede,field_annex,field_evidence')
      .set('include', 'field_signature,field_annex,field_evidence');

    const fetchRegisterPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const idFile = item.relationships.field_signature.data ? item.relationships.field_signature.data.id : null;
            let file = idFile ? resp.included.find((file: any) => file.id === idFile) : null;
            file = file ? {
              filename: file.attributes.filename,
              url: `${environment.host}${file.attributes.uri.url}`
            } : '';

            return {
              id: item.id,
              title: item.attributes.title,
              created: item.attributes.created,
              status: item.attributes.status,
              signature_file: file,
              activity: item.relationships.field_activities.data ? item.relationships.field_activities.data.id : null,
              approach: item.relationships.field_approach.data ? item.relationships.field_approach.data.id : null,
              sub_activity: item.relationships.field_sub_activities.data ? item.relationships.field_sub_activities.data.id : null,
              sede: item.relationships.field_sede.data ? item.relationships.field_sede.data.id : null,
              user_uuid: item.relationships.uid.data ? item.relationships.uid.data.id : null,
              annexList: item.relationships.field_annex.data ? item.relationships.field_annex.data.map((annex: any) => annex.id) : [],
              evidenceList: item.relationships.field_evidence.data ? item.relationships.field_evidence.data.map((evidence: any) => evidence.id) : []
            };
          });

          if (resp.links && resp.links.next) {
            return fetchRegisterPage(resp.links.next.href, params).pipe(
              map(nextItems => items.concat(nextItems))
            );
          } else {
            return of(items);
          }
        })
      );
    };

    return fetchRegisterPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }
}
