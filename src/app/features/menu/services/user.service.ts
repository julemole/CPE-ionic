import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private dbService: DatabaseService) {}

  getAllUsers() {
    const URL = `${this.API_URL}/user/user`; // Ajusta la URL para obtener todos los usuarios
    const params = new HttpParams()
      .set(
        'fields[user--user]',
        'field_names,field_document,drupal_internal__uid,mail,name,status,field_department,field_document_type,roles'
      )
      .set('include', 'field_department,field_document_type,roles');

    return this.http.get(URL, { params }).pipe(
      map((resp: any) => {
        const data = resp.data.filter((user: any) => user.id !== 'bec9590d-70c8-448b-8d3d-ba250f505578'); //NOTE: Quemado
        // Procesar la lista de usuarios en lugar de un solo usuario
        return data.map((user: any) => {
          const idDept = user.relationships.field_department.data ? user.relationships.field_department.data.id : null;
          const dept = idDept ? resp.included.find((item: any) => item.id === idDept) : null;
          const idDocType = user.relationships.field_document_type.data ? user.relationships.field_document_type.data.id : null;
          const docType = idDocType ? resp.included.find(
            (item: any) => item.id === idDocType
          ) : '';
          // const idsRoles = user.relationships.roles.data ? user.relationships.roles.data.map((item: any) => item.id) : [];
          // const roles = idsRoles.length ? resp.included.filter((item: any) => idsRoles.includes(item.id)) : [];

          return {
            id: user.id,
            uid: user.attributes.drupal_internal__uid,
            field_names: user.attributes.field_names,
            field_document_number: user.attributes.field_document,
            mail: user.attributes.mail,
            username: user.attributes.name,
            field_department: dept ? dept.attributes.name : null,
            field_document_type: docType ? docType.attributes.name : null,
            // roles: roles.length ? roles.map((role: any) => role.attributes.label) : [],
            status: user.attributes.status,
          };
        });
      })
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
        const data = resp.data;
        const idDept = data.relationships.field_department.data ? data.relationships.field_department.data.id : null;
        const dept = idDept ? resp.included.find((item: any) => item.id === idDept) : null;
        const idDocType = data.relationships.field_document_type.data?.id;
        const docType = idDocType ? resp.included.find(
          (item: any) => item.id === idDocType
        ) : '';
        // const idsRoles = data.relationships.roles.data ? data.relationships.roles.data.map((item: any) => item.id) : [];
        // const roles = idsRoles.length ? resp.included.filter((item: any) => idsRoles.includes(item.id)) : [];

        return {
          id: data.id,
          uid: data.attributes.drupal_internal__uid,
          field_names: data.attributes.field_names,
          field_document_number: data.attributes.field_document,
          mail: data.attributes.mail,
          username: data.attributes.name,
          field_department: dept ? dept.attributes.name : null,
          field_document_type: docType ? docType.attributes.name : null,
          // roles: roles.length ? roles.map((role: any) => role.attributes.label) : [],
          status: data.attributes.status,
        };
      })
    );
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
    const URL = `${this.API_URL}/node/zones`;
    const params = new HttpParams()
      .set(
        'fields[node--zones]',
        'title,field_department,field_oficces_content,field_region,field_state,field_tutors'
      )
      .set(
        'include',
        'field_department,field_oficces_content,field_oficces_content.field_group_offices,field_oficces_content.field_municipality,field_oficces_content.field_group_offices.field_department,field_oficces_content.field_group_offices.field_location,field_oficces_content.field_group_offices.field_municipality,field_oficces_content.field_group_offices.field_state,field_region,field_state'
      )
      .set('filter[field_tutors.id][value]', idTutor);

    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        console.log(resp)
        const data = resp.data;
        return data.map((zone: any) => {
          const idDept = zone.relationships.field_department.data.id;
          const dept = resp.included.find((item: any) => item.id === idDept);
          const idRegion = zone.relationships.field_region.data.id;
          const region = resp.included.find((item: any) => item.id === idRegion);
          const idState = zone.relationships.field_state.data.id;
          const state = resp.included.find((item: any) => item.id === idState);
          const idsOfficesContent = zone.relationships.field_oficces_content.data ? zone.relationships.field_oficces_content.data.map((item: any) => item.id) : [];
          const officesGroups = idsOfficesContent.length ? resp.included.filter((item: any) => idsOfficesContent.includes(item.id)) : [];

          const processedOfficesGroups = officesGroups.map((group: any) => {
            const idsGroupOffices = group.relationships.field_group_offices.data ? group.relationships.field_group_offices.data.map((item: any) => item.id) : [];
            const groupOffices = idsGroupOffices.length ? resp.included.filter((item: any) => idsGroupOffices.includes(item.id)) : [];
            const idMunicipality = group.relationships.field_municipality.data.id;
            const municipality = resp.included.find((item: any) => item.id === idMunicipality);

            const processedGroupOffices = groupOffices.map((office: any) => {
              const idDepartment = office.relationships.field_department.data.id;
              const department = resp.included.find((item: any) => item.id === idDepartment);
              const idLocation = office.relationships.field_location.data.id;
              const location = resp.included.find((item: any) => item.id === idLocation);
              const idMunicipality = office.relationships.field_municipality.data.id;
              const officeMunicipality = resp.included.find((item: any) => item.id === idMunicipality);
              const idState = office.relationships.field_state.data.id;
              const officeState = resp.included.find((item: any) => item.id === idState);

              return {
                ...office,
                field_department: department?.attributes?.name,
                field_location: location?.attributes?.name,
                field_municipality: officeMunicipality?.attributes?.name,
                field_state: officeState?.attributes?.name,
              };
            });

            return {
              ...group,
              groupOffices: processedGroupOffices,
              field_municipality: municipality?.attributes?.name,
            };
          });

          return {
            id: zone.id,
            title: zone.attributes.title,
            field_department: dept?.attributes?.name,
            field_region: region?.attributes?.title,
            field_state: state?.attributes?.name,
            officesGroups: processedOfficesGroups,
          };
        });
      })
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

  getRoles() {
    const URL = `${this.API_URL}/user_role/user_role`;
    const params = new HttpParams()
      .set('fields[user_role]', 'label');

    return this.http.get(URL, { params }).pipe(
      map((resp: any) => {
        return resp.data.map((role: any) => {
          return {
            id: role.id,
            label: role.attributes.label,
          };
        });
      })
    );
  }
}
