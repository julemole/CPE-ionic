import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, mergeMap, Observable, of, reduce } from 'rxjs';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private dbService: DatabaseService) {}

  getAllUsers(): Observable<any[]> {
    const URL = `${this.API_URL}/user/user`; // URL base para obtener usuarios
    const params = new HttpParams()
      .set(
        'fields[user--user]',
        'status,display_name,field_names,field_document,drupal_internal__uid,mail,name,field_department,field_document_type,roles'
      )
      .set('include', 'field_department,field_document_type,roles');

    // Función recursiva para manejar la paginación
    const fetchUserPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp?.data
            ?.filter((user: any) => user.attributes?.display_name !== 'Anónimo') // Filtrar usuarios anónimos
            ?.map((user: any) => {
              const attributes = user.attributes;
              const relationships = user.relationships;

              // Relación con `field_department`
              const idDept = relationships?.field_department?.data?.id || null;
              const dept = idDept
                ? resp.included.find((item: any) => item.id === idDept)
                : null;

              // Relación con `field_document_type`
              const idDocType = relationships?.field_document_type?.data?.id || null;
              const docType = idDocType
                ? resp.included.find((item: any) => item.id === idDocType)
                : null;

              // Retornar datos procesados de usuario
              return {
                id: user.id,
                uid: attributes?.drupal_internal__uid || null,
                field_names: attributes?.field_names || null,
                field_document_number: attributes?.field_document || null,
                mail: attributes?.mail || null,
                username: attributes?.name || null,
                field_department: dept?.attributes?.name || null,
                field_document_type: docType?.attributes?.name || null,
                status: attributes?.status || null,
              };
            }) || [];

          // Verificar si hay una página siguiente
          if (resp.links?.next?.href) {
            return fetchUserPage(resp.links.next.href, params).pipe(
              map((nextItems) => items.concat(nextItems))
            );
          } else {
            return of(items);
          }
        }),
        catchError((error) => {
          console.error('Error al obtener los usuarios:', error);
          return of([]); // Retorna un arreglo vacío en caso de error
        })
      );
    };

    // Llamar a la función recursiva y eliminar duplicados
    return fetchUserPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map((item) => [item.id, item]));
        items.forEach((item) => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  getUserInfo(idUser: string) {
    const URL = `${this.API_URL}/user/user/${idUser}`;
    const params = new HttpParams()
      .set(
        'fields[user--user]',
        'field_names,field_document,mail,name,drupal_internal__uid,status,field_department,field_document_type,roles'
      )
      .set('include', 'field_department,field_document_type,roles');
    return this.http.get(URL, { params }).pipe(
      map((resp: any) => {
        const attributes = resp.data.attributes;
        const relationships = resp.data.relationships;
        const idDept = relationships && relationships.field_department.data ? relationships.field_department.data.id : null;
        const dept = idDept ? resp.included.find((item: any) => item.id === idDept) : null;
        const idDocType = relationships && relationships.field_document_type.data ? relationships.field_document_type.data.id : null;
        const docType = idDocType ? resp.included.find((item: any) => item.id === idDocType) : null;
        // const idsRoles = relationships.roles.data ? relationships.roles.data.map((item: any) => item.id) : [];
        // const roles = idsRoles.length ? resp.included.filter((item: any) => idsRoles.includes(item.id)) : [];

        return {
          id: resp.data.id,
          uid: attributes ? attributes.drupal_internal__uid : null,
          field_names: attributes ? attributes.field_names : null,
          field_document_number: attributes ?  attributes.field_document : null,
          mail: attributes ? attributes.mail : null,
          username: attributes ? attributes.name : null,
          field_department: dept ? dept.attributes.name : null,
          field_document_type: docType ? docType.attributes.name : null,
          // roles: roles.length ? roles.map((role: any) => role.attributes.label) : [],
          status: attributes ? attributes.status : null,
        };
      })
    );
  }

  updateUser(idUser: string, data: any) {
    const URL = `${this.API_URL}/user/user/${idUser}`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
      }),
    };
    return this.http.patch(URL, data, httpOptions);
  }

  async getUserInfOffline(idUser: string) {
    try {
      const userInfo = await this.dbService.getUserById(idUser);
      return userInfo;
    } catch (error) {
      throw new Error('No se encontro el usuario');
    }
  }

  getZonesWithSedesByTutor(idTutor: string) {
    const URL = `${this.API_URL}/node/zones?sort=title`;
    const params = new HttpParams()
      .set('fields[node--zones]', 'title,field_department,field_oficces_content,field_state,field_tutors')
      .set('fields[taxonomy_term--all_departments]', 'name,status')
      .set('fields[taxonomy_term--location]', 'name,status')
      .set('fields[taxonomy_term--municipality]', 'name,status')
      .set('fields[taxonomy_term--state]', 'name,status')
      .set('include', 'field_department,field_oficces_content,field_oficces_content.field_group_offices,field_oficces_content.field_municipality,field_oficces_content.field_group_offices.field_department,field_oficces_content.field_group_offices.field_location,field_oficces_content.field_group_offices.field_municipality,field_oficces_content.field_group_offices.field_state,field_oficces_content.field_group_offices.field_teachers,field_state')
      .set('filter[field_tutors.id][value]', idTutor);

    const fetchZonesPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const data = resp.data || [];
          const included = resp.included || [];

          const processedZones = data.map((zone: any) => {
            const idDept = zone.relationships.field_department.data ? zone.relationships.field_department.data.id : null;
            const dept = idDept ? included.find((item: any) => item.id === idDept) : null;

            const idState = zone.relationships.field_state.data ? zone.relationships.field_state.data.id : null;
            const state = idState ? included.find((item: any) => item.id === idState) : null;

            const idsOfficesContent = zone.relationships.field_oficces_content.data ? zone.relationships.field_oficces_content.data.map((item: any) => item.id) : [];
            const officesGroups = idsOfficesContent.length ? included.filter((item: any) => idsOfficesContent.includes(item.id)) : [];

            const processedOfficesGroups = officesGroups.map((group: any) => {
              const idsGroupOffices = group.relationships.field_group_offices.data ? group.relationships.field_group_offices.data.map((item: any) => item.id) : [];
              const groupOffices = idsGroupOffices.length ? included.filter((item: any) => idsGroupOffices.includes(item.id)) : [];

              const idMunicipality = group.relationships.field_municipality.data ? group.relationships.field_municipality.data.id : null;
              const municipality = idMunicipality ? included.find((item: any) => item.id === idMunicipality) : null;

              const processedGroupOffices = groupOffices.map((office: any) => {
                const idDepartment = office.relationships.field_department.data ? office.relationships.field_department.data.id : null;
                const department = idDepartment ? included.find((item: any) => item.id === idDepartment) : null;

                const idLocation = office.relationships.field_location.data ? office.relationships.field_location.data.id : null;
                const location = idLocation ? included.find((item: any) => item.id === idLocation) : null;

                const idMunicipality = office.relationships.field_municipality.data ? office.relationships.field_municipality.data.id : null;
                const officeMunicipality = idMunicipality ? included.find((item: any) => item.id === idMunicipality) : null;

                const idState = office.relationships.field_state.data ? office.relationships.field_state.data.id : null;
                const officeState = idState ? included.find((item: any) => item.id === idState) : null;

                const idsTeachers = office.relationships.field_teachers.data ? office.relationships.field_teachers.data.map((item: any) => item.id) : [];
                const teachers = idsTeachers.length ? included.filter((item: any) => idsTeachers.includes(item.id)) : [];

                return {
                  ...office,
                  field_department: department ? department.attributes.name : null,
                  field_location: location ? location.attributes.name : null,
                  field_municipality: officeMunicipality ? officeMunicipality.attributes.name : null,
                  field_state: officeState ? officeState.attributes.name : null,
                  teachers,
                };
              });

              return {
                ...group,
                groupOffices: processedGroupOffices,
                field_municipality: municipality ? municipality.attributes.name : null,
                municipality_id: municipality ? municipality.id : null,
              };
            });

            return {
              id: zone.id,
              title: zone.attributes.title,
              field_department: dept ? dept.attributes.name : null,
              field_state: state ? state.attributes.name : null,
              officesGroups: processedOfficesGroups,
            };
          });

          if (resp.links?.next?.href) {
            return fetchZonesPage(resp.links.next.href, params).pipe(
              map((nextItems) => processedZones.concat(nextItems))
            );
          } else {
            return of(processedZones);
          }
        }),
        catchError((error) => {
          console.error('Error al obtener las zonas con sedes:', error);
          return of([]);
        })
      );
    };

    return fetchZonesPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map((item) => [item.id, item]));
        items.forEach((item) => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, [])
    );
  }

  async getZonesBytutor(idUser: string) {
    try {
      const zones = await this.dbService.loadZonesByUser(idUser);
      return zones;
    } catch (error) {
      throw new Error('Error al traer la información');
    }
  }

}
