import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { firstValueFrom, map, mergeMap, Observable, of, reduce } from 'rxjs';
import { PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { environment } from 'src/environments/environment';
import { attachedData } from '../../../shared/models/save-in-session.interface';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { Annex, Evidence, Register } from 'src/app/shared/models/entity.interface';
import { saveFileInDevice } from 'src/app/shared/utils/functions';
import { ConnectivityService } from '../../../shared/services/connectivity.service';

@Injectable({
  providedIn: 'root'
})
export class RegistersService {
  isOnline: WritableSignal<boolean> = signal(true);

  private API_URL = environment.apiUrl;
  private HOST = environment.host;

  constructor(private http: HttpClient, private plaftorm: Platform, private dbService: DatabaseService, private connectivityService: ConnectivityService) {
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  getRegistersByUser(userId: string): Observable<any[]> {
    const URL = `${this.API_URL}/node/registry?sort=-created`;
    const params = new HttpParams()
      .set('filter[uid.id][value]', userId)
      .set('include', 'field_sede');

    const fetchRegistersPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const sedeId = item.relationships.field_sede.data ? item.relationships.field_sede.data.id : '';
            const sede = sedeId ? resp.included.find((includedItem: any) => includedItem.id === sedeId).attributes.title : '';

            return {
              id: item.id,
              created: item.attributes.created,
              sede,
            };
          });

          if (resp.links && resp.links.next) {
            // Si hay una siguiente página, hacer la siguiente solicitud
            return fetchRegistersPage(resp.links.next.href, params).pipe(
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
    return fetchRegistersPage(URL, params).pipe(
      reduce((acc: any[], items) => {
        const uniqueItems = new Map(acc.map(item => [item.id, item]));
        items.forEach(item => uniqueItems.set(item.id, item));
        return Array.from(uniqueItems.values());
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
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

        const idSede = data.relationships.field_sede.data ? data.relationships.field_sede.data.id : '';
        const sede = idSede ? included.find((item: any) => item.id === idSede).attributes.title : '';

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
          sede,
          signature,
          annexList: annex,
          evidenceList: evidence
        };

      })
    );
  }

  async getRegisterByIdOffline(id: string) {
    try {
      const register = await this.dbService.getRegisterById(id);
      return register;
    } catch (error) {
      throw new Error('Error al obtener el registro');
    }
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

  async getEvidenceByIdOffline(id: string) {
    try {
      const evidence = this.isOnline() ? await this.dbService.getEvidenceByServerId(id) : await this.dbService.getEvidenceById(id);
      return evidence;
    } catch (error) {
      throw new Error('Error al obtener la evidencia');
    }
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

  async getAnnexByIdOffline(id: string) {
    try {
      const annex = this.isOnline() ? await this.dbService.getAnnexByServerId(id)  : await this.dbService.getAnnexById(id)
      return annex;
    } catch (error) {
      throw new Error('Error al obtener el anexo');
    }
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
        objToUpdate.idFile = response.id;
      }
      return response;
    } catch (error) {
      console.error('Error al subir el archivooooooooooooooooooooooooooooooooooooooooooooo:', JSON.stringify(error));
      throw error;
    }
  }

  async createEvidence(photoData: PhotoData, csrfToken: string, isFromLocal: boolean = false) {
    const payload = {
      data: {
        type: 'node--evidence',
        attributes: {
          title: photoData.name,
          field_description: photoData.description,
          field_evidence_date: photoData.date || '',
          field_evidence_time: photoData.time || '',
          field_latitude: photoData.latitude || '',
          field_longitude: photoData.longitude || '',
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
      if (this.plaftorm.is('hybrid') && !isFromLocal) {
        let filePath = '';
        if(photoData.file){
          filePath = await saveFileInDevice(photoData.file);
        }
        const evidence: Evidence = {
          uuid: response.data.id,
          server_uuid: response.data.id,
          name: photoData.name,
          description: photoData.description,
          date_created: photoData.date,
          time_created: photoData.time,
          latitude: photoData.latitude,
          longitude: photoData.longitude,
          file: filePath,
          is_synced: 1,
          status: 1,
        }
        await this.dbService.addEvidence(evidence);
      }

      if(isFromLocal){
        const evidence: Evidence = {
          uuid: photoData.local_uuid!,
          server_uuid: response.data.id,
          name: photoData.name,
          is_synced: 1,
          status: 1,
        }
        await this.dbService.updateEvidence(evidence);
      }

      return response;
    } catch (error) {
      console.error('Error al crear la evidenciaaaaaaaaaaaaaaaaaa:', JSON.stringify(error));
      throw error;
    }
  }

  async createEvidenceOffline(evidence: Evidence) {
    try {
      const uuid = evidence.uuid || crypto.randomUUID();
      evidence.uuid = uuid;
      await this.dbService.addEvidence(evidence);
      return evidence;
    } catch (error) {
      console.error('Error al crear la evidencia:', error);
      throw error;
    }
  }

  async createAnnex(attachedData: attachedData, csrfToken: string, isFromLocal: boolean = false) {
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
      if (this.plaftorm.is('hybrid') && !isFromLocal) {
        let filePath = '';
        if(attachedData.file){
          filePath = await saveFileInDevice(attachedData.file);
        }
        const annex: Annex = {
          uuid: response.data.id,
          server_uuid: response.data.id,
          name: attachedData.name,
          description: attachedData.description,
          date_created: response.data.attributes.created,
          file: filePath,
          is_synced: 1,
          status: 1,
        }
        await this.dbService.addAnnex(annex);
      }

      if(isFromLocal){
        const annex: Annex = {
          uuid: attachedData.local_uuid!,
          server_uuid: response.data.id,
          name: attachedData.name,
          is_synced: 1,
          status: 1,
        }
        await this.dbService.updateAnnex(annex);
      }

      return response;
    } catch (error) {
      console.error('Error al crear el anexoooooooooooooooooooooooooooooooooooo:', JSON.stringify(error));
      throw error;
    }
  }

  async createAnnexOffline(annex: Annex) {
    try {
      const uuid = annex.uuid || crypto.randomUUID();
      annex.uuid = uuid;
      await this.dbService.addAnnex(annex);
      return annex;
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

  async createRegisterOffline(register: Register) {
    try {
      const uuid = register.uuid || crypto.randomUUID();
      register.uuid = uuid;
      await this.dbService.addRegister(register);
      return register;
    } catch (error) {
      console.error('Error al crear el registro:', error);
      throw error;
    }
  }

  async addEvidenceToRegister(registerId: string, evidenceId?: string, is_synced: number = 1) {
    try {
      if(evidenceId){
        await this.dbService.addEvidenceToRegister(registerId, evidenceId, is_synced);
      }
    } catch (error) {
      console.error('Error al agregar la evidencia al registro:', error);
      throw error;
    }
  }

  async addAnnexToRegister(registerId: string, annexId?: string, is_synced: number = 1) {
    try {
      if(annexId){
        await this.dbService.addAnnexToRegister(registerId, annexId, is_synced);
      }
    } catch (error) {
      console.error('Error al agregar el anexo al registro:', error);
      throw error;
    }
  }
}
