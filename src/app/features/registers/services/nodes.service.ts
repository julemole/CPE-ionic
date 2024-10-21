import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NodesService {

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAnnexList(idUser: string) {
    const URL = `${this.API_URL}/node/annex`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', idUser)
      .set('fields[node--annex]', 'title,field_description,created,status,uid,field_file')
      .set('include', 'field_file');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
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
          }
        })
      })
    )
  }

  getEvidenceList(idUser: string) {
    const URL = `${this.API_URL}/node/evidence`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', idUser)
      .set('fields[node--evidence]', 'title,field_description,field_latitude,field_longitude,field_evidence_time,field_evidence_date,status,uid,field_image')
      .set('include', 'field_image');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
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
          }
        })
      })
    )
  }

  getRegionList() {
    const URL = `${this.API_URL}/node/region`;
    const params = new HttpParams()
      .set('fields[node--region]', 'title,created,status,field_department')
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          return {
            id: item.id,
            title: item.attributes.title,
            created: item.attributes.created,
            status: item.attributes.status,
            department: item.relationships.field_department.data ? item.relationships.field_department.data.id : null
          }
        })
      })
    )
  }

  getSedeList() {
    const URL = `${this.API_URL}/node/offices`;
    const params = new HttpParams()
      .set('fields[node--sede]', 'title,created,status,field_department,field_location,field_municipality,field_state');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          return {
            id: item.id,
            title: item.attributes.title,
            created: item.attributes.created,
            status: item.attributes.status,
            department: item.relationships.field_department.data ? item.relationships.field_department.data.id : null,
            location: item.relationships.field_location.data ? item.relationships.field_location.data.id : null,
            municipality: item.relationships.field_municipality.data ? item.relationships.field_municipality.data.id : null,
            state: item.relationships.field_state.data ? item.relationships.field_state.data.id : null
          }
        })
      })
    )
  }

  getSedeGroupList() {
    const URL = `${this.API_URL}/node/group_offices`;
    const params = new HttpParams()
      .set('fields[node--sedes_group]', 'title,created,status,field_municipality,field_group_offices');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          const offices = item.relationships.field_group_offices.data ? item.relationships.field_group_offices.data.map((group: any) => group.id) : [];
          return {
            id: item.id,
            title: item.attributes.title,
            created: item.attributes.created,
            status: item.attributes.status,
            municipality: item.relationships.field_municipality.data ? item.relationships.field_municipality.data.id : null,
            offices
          }
        })
      })
    )
  }

  getZoneList() {
    const URL = `${this.API_URL}/node/zones`;
    const params = new HttpParams()
      .set('fields[node--zone]', 'title,created,status,field_department,field_region,field_state,field_oficces_content,field_tutors');
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
            region: item.relationships.field_region.data ? item.relationships.field_region.data.id : null,
            state: item.relationships.field_state.data ? item.relationships.field_state.data.id : null,
            groups,
            tutors
          }
        })
      })
    )
  }

  getRegisterList(userId: string) {
    const URL = `${this.API_URL}/node/registry`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', userId)
      .set('fields[node--registers]', 'title,created,status,uid,field_signature,field_activities,field_approach,field_sub_activities,field_sede,field_annex,field_evidence')
      .set('include', 'field_signature,field_annex,field_evidence');
    return this.http.get(URL, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
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
          }
        })
      })
    )
  }
}
