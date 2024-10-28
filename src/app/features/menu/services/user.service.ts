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
        'status,display_name,field_names,field_document,drupal_internal__uid,mail,name,field_department,field_document_type,roles'
      )
      .set('include', 'field_department,field_document_type,roles');

    return this.http.get(URL, { params }).pipe(
      map((resp: any) => {
        const data = resp.data.filter((user: any) => user.attributes?.display_name !== 'Anónimo');
        // Procesar la lista de usuarios en lugar de un solo usuario
        return data.map((user: any) => {
          const attributes = user.attributes;
          const relationships = user.relationships;

          const idDept = relationships && relationships.field_department.data ? relationships.field_department.data.id : null;
          const dept = idDept ? resp.included.find((item: any) => item.id === idDept) : null;
          const idDocType = relationships && relationships.field_document_type.data ? relationships.field_document_type.data.id : null;
          const docType = idDocType ? resp.included.find((item: any) => item.id === idDocType) : null;
          // const idsRoles = user.relationships.roles.data ? user.relationships.roles.data.map((item: any) => item.id) : [];
          // const roles = idsRoles.length ? resp.included.filter((item: any) => idsRoles.includes(item.id)) : [];

          return {
            id: user.id,
            uid: attributes ? attributes.drupal_internal__uid : null,
            field_names: attributes ? attributes.field_names : null,
            field_document_number: attributes ? attributes.field_document : null,
            mail: attributes ? attributes.mail : null,
            username: attributes ? attributes.name : null,
            field_department: dept ? dept.attributes.name : null,
            field_document_type: docType ? docType.attributes.name : null,
            // roles: roles.length ? roles.map((role: any) => role.attributes.label) : [],
            status: attributes ? attributes.status : null,
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
      .set('fields[node--zones]','title,field_department,field_oficces_content,field_state,field_tutors')
      .set('fields[taxonomy_term--all_departments]','name,status')
      .set('fields[taxonomy_term--location]','name,status')
      .set('fields[taxonomy_term--municipality]','name,status')
      .set('fields[taxonomy_term--state]','name,status')
      .set('include','field_department,field_oficces_content,field_oficces_content.field_group_offices,field_oficces_content.field_municipality,field_oficces_content.field_group_offices.field_department,field_oficces_content.field_group_offices.field_location,field_oficces_content.field_group_offices.field_municipality,field_oficces_content.field_group_offices.field_state,field_state')
      .set('filter[field_tutors.id][value]', idTutor);

    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        return data.map((zone: any) => {
          const idDept = zone.relationships.field_department.data ? zone.relationships.field_department.data.id : null;
          const dept = idDept ? resp.included.find((item: any) => item.id === idDept) : null;
          // const idRegion = zone.relationships.field_region.data.id;
          // const region = resp.included.find((item: any) => item.id === idRegion);
          const idState = zone.relationships.field_state.data ? zone.relationships.field_state.data.id : null;
          const state = idState ? resp.included.find((item: any) => item.id === idState) : null;
          const idsOfficesContent = zone.relationships.field_oficces_content.data ? zone.relationships.field_oficces_content.data.map((item: any) => item.id) : [];
          const officesGroups = idsOfficesContent.length ? resp.included.filter((item: any) => idsOfficesContent.includes(item.id)) : [];

          const processedOfficesGroups = officesGroups.map((group: any) => {
            const idsGroupOffices = group.relationships.field_group_offices.data ? group.relationships.field_group_offices.data.map((item: any) => item.id) : [];
            const groupOffices = idsGroupOffices.length ? resp.included.filter((item: any) => idsGroupOffices.includes(item.id)) : [];
            const idMunicipality = group.relationships.field_municipality.data ? group.relationships.field_municipality.data.id : null;
            const municipality = idMunicipality ? resp.included.find((item: any) => item.id === idMunicipality) : null;

            const processedGroupOffices = groupOffices.map((office: any) => {
              console.log(office)
              const idDepartment = office.relationships.field_department.data ? office.relationships.field_department.data.id : null;
              const department = idDepartment ? resp.included.find((item: any) => item.id === idDepartment) : null;
              const idLocation = office.relationships.field_location.data ? office.relationships.field_location.data.id : null;
              const location = idLocation ? resp.included.find((item: any) => item.id === idLocation) : null;
              const idMunicipality = office.relationships.field_municipality.data ? office.relationships.field_municipality.data.id : null;
              const officeMunicipality = idMunicipality ? resp.included.find((item: any) => item.id === idMunicipality) : null;
              const idState = office.relationships.field_state.data ? office.relationships.field_state.data.id : null;
              const officeState = idState ? resp.included.find((item: any) => item.id === idState) : null;

              return {
                ...office,
                field_department: department ? department.attributes.name : null,
                field_location: location ? location.attributes.name : null,
                field_municipality: officeMunicipality ? officeMunicipality.attributes.name : null,
                field_state: officeState ? officeState.attributes.name : null,
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
            // field_region: region?.attributes?.title,
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
