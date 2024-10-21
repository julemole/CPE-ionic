import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { environment } from 'src/environments/environment';
import { attachedData } from '../../../shared/models/save-in-session.interface';
import { DatabaseService } from 'src/app/shared/services/database.service';

@Injectable({
  providedIn: 'root'
})
export class RegistersService {

  private API_URL = environment.apiUrl;
  private HOST = environment.host;

  constructor(private http: HttpClient, private dbService: DatabaseService) { }

  getRegistersByUser(userId: string): Observable<any> {
    const params = new HttpParams()
      .set('filter[uid.id][value]', userId)
      .set('include', 'field_sede')
    return this.http.get(`${this.API_URL}/node/registry`, {params}).pipe(
      map((resp: any) => {
        return resp.data.map((item: any) => {
          const sedeId = item.relationships.field_sede.data ? item.relationships.field_sede.data.id : '';
          const sede = sedeId ? resp.included.find((item: any) => item.id === sedeId).attributes.name : '';
          return {
            id: item.id,
            created: item.attributes.created,
            sede
          }
        })
      })
    )
  }

  async getRegistersByUserOffline(userId: string) {
    try {
      const registers = await this.dbService.getRegistersByUser(userId);
      return registers;
    } catch (error) {
      throw new Error('Error al obtener los registros');
    }
  }

  getRegisterById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--registry]', 'title,field_activities,field_approach,field_sub_activities,field_evidence,field_annex,field_signature,field_sede')
      .set('include', 'field_evidence,field_annex,field_signature,field_sede,field_evidence.field_image,field_annex.field_file');

    return this.http.get(`${this.API_URL}/node/registry/${id}` , {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        const included = resp.included;

        const idSignature = data.relationships.field_signature.data?.id;
        let signature = included.find((item: any) => item.id === idSignature);
        signature.url = `${this.HOST}${signature.attributes.uri.url}`;


        const idsAnnex = data.relationships.field_annex.data.map((item: any) => item.id);
        const idsEvidence = data.relationships.field_evidence.data.map((item: any) => item.id);

        const annex = included.filter((item: any) => idsAnnex.includes(item.id));
        annex.map((item: any) => {
          const idFile = item.relationships.field_file.data.id;
          const file = included.find((file: any) => file.id === idFile);
          item.fileUrl = `${this.HOST}${file.attributes.uri.url}`;
        })
        const evidence = included.filter((item: any) => idsEvidence.includes(item.id));
        evidence.map((item: any) => {
          const idFile = item.relationships.field_image.data.id;
          const file = included.find((file: any) => file.id === idFile);
          item.fileUrl = `${this.HOST}${file.attributes.uri.url}`;
        })

        return {
          ...data,
          signature,
          annexList: annex,
          evidenceList: evidence
        };

      })
    );
  }

  getEvidenceById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--evidence]', 'title,field_description,field_evidence_date,field_evidence_time,field_latitude,field_longitude,field_image')
      .set('include', 'field_image');

    return this.http.get(`${this.API_URL}/node/evidence/${id}`, {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        const included = resp.included;

        const idFile = data.relationships.field_image.data.id;
        const file = included.find((item: any) => item.id === idFile);
        data.fileUrl = `${this.HOST}${file.attributes.uri.url}`;

        return data;
      })
    );
  }

  getAnnexById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--annex]', 'title,field_description,field_file')
      .set('include', 'field_file');

    return this.http.get(`${this.API_URL}/node/annex/${id}`, {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        const included = resp.included;

        const idFile = data.relationships.field_file.data.id;
        const file = included.find((item: any) => item.id === idFile);
        data.fileUrl = `${this.HOST}${file.attributes.uri.url}`;

        return data;
      })
    );
  }

  getInstitutionById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--offices]', 'title')
    return this.http.get(`${this.API_URL}/node/offices/${id}`, {params}).pipe(
      map((resp: any) => resp.data)
    );
  }

  uploadFile(file: File, csrf: string, type: string): Observable<any> {
    let URL = '';
    if(type === 'evidence') {
      URL = `${this.API_URL}/node/evidence/field_image`;
    } else if (type === 'annex') {
      URL = `${this.API_URL}/node/annex/field_file`;
    } else if (type === 'registry') {
      URL = `${this.API_URL}/node/registry/field_signature`;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/octet-stream',
        'X-Csrf-Token': csrf || '',
        'Content-Disposition': `file; filename="${file.name}"`
      }),
    };

    return this.http.post<any>(URL, file, httpOptions).pipe(
      map(resp => resp.data)
    );

  }

  async uploadFileAndSaveId(file: File, csrf: string, type: string, objToUpdate: PhotoData | attachedData | {file: File | null, idFile: string} | null) {
    let URL = '';
    if(type === 'evidence') {
      URL = `${this.API_URL}/node/evidence/field_image`;
    } else if (type === 'annex') {
      URL = `${this.API_URL}/node/annex/field_file`;
    } else if (type === 'registry') {
      URL = `${this.API_URL}/node/registry/field_signature`;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/octet-stream',
        'X-Csrf-Token': csrf || '',
        'Content-Disposition': `file; filename="${file.name}"`
      }),
    };

    try {
      const response = await firstValueFrom(this.http.post<any>(URL, file, httpOptions).pipe(
        map(resp => resp.data)
      ));
      if (objToUpdate) {
        console.log('resp img',response)
        objToUpdate.idFile = response.id;
        console.log(objToUpdate)
      }
      return response;
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      throw error;
    }
  }

  async createEvidence(photoData: PhotoData, csrfToken: string) {
    console.log('objeto',photoData)
    const payload = {
      data: {
        type: 'node--evidence',
        attributes: {
          title: photoData.name,
          field_description: photoData.description,
          field_evidence_date: photoData.date,
          field_evidence_time: photoData.time,
          field_latitude: photoData.latitude,
          field_longitude: photoData.longitude,
        },
        relationships: {
          field_image: {
            data: {
              type: 'file--file',
              id: photoData.idFile
            }
          }
        }
      }
    };
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
        'X-Csrf-Token': csrfToken,
      }),
    };
    const URL = `${this.API_URL}/node/evidence`;

    try {
      const response = await firstValueFrom(this.http.post<any>(URL, payload, httpOptions));
      photoData.idEvidence = response.data.id;
      return response;
    } catch (error) {
      console.error('Error al crear la evidencia:', error);
      throw error;
    }
  }

  async createAnnex(attachedData: attachedData, csrfToken: string) {
    const payload = {
      data: {
        type: 'node--annex',
        attributes: {
          title: attachedData.name,
          field_description: attachedData.description,
        },
        relationships: {
          field_file: {
            data: {
              type: 'file--file',
              id: attachedData.idFile
            }
          }
        }
      }
    };

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
        'X-Csrf-Token': csrfToken,
      }),
    };

    const URL = `${this.API_URL}/node/annex`;

    try {
      const response = await firstValueFrom(this.http.post<any>(URL, payload, httpOptions));
      attachedData.idAnnex = response.data.id;
      return response;
    } catch (error) {
      console.error('Error al crear el anexo:', error);
      throw error;
    }
  }

  createRegister(registerPayload: any, csrfToken: string) {
    const URL = `${this.API_URL}/node/registry`;
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
        'X-Csrf-Token': csrfToken,
      }),
    };
    return this.http.post(URL, registerPayload, httpOptions);
  }
}
