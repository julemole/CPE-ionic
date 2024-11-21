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
      .set('fields[node--registry]', 'title,created,field_date,field_teacher,field_institution')
      .set('include', 'field_teacher,field_institution');

    const fetchRegistersPage = (url: string, params: HttpParams): Observable<any[]> => {
      return this.http.get(url, { params }).pipe(
        mergeMap((resp: any) => {
          const items = resp.data.map((item: any) => {
            const teacherId = item.relationships.field_teacher.data ? item.relationships.field_teacher.data.id : '';
            const teacher = teacherId ? resp.included.find((item: any) => item.id === teacherId) : null;
            const institutionId = item.relationships.field_institution.data ? item.relationships.field_institution.data.id : '';
            const institution = institutionId ? resp.included.find((item: any) => item.id === institutionId) : null;
            return {
              id: item.id,
              created: item.attributes.created,
              field_date: item.attributes.field_date,
              teacher: teacher ? teacher.attributes.title : '',
              teacherId,
              institutionRadicado: institution ? institution.attributes.field_based : '',
              institution: institution ? institution.attributes.title : null, // Set institution title or null
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

        // Agrupar los registros por institución
        const groupedItems = Array.from(uniqueItems.values()).reduce((acc: any, register: any) => {
          const institutionName = register.institution || 'Sin Institución';
          const institutionRadicado = register.institutionRadicado || '';
          if (!acc[institutionName]) {
            acc[institutionName] = { institution: institutionName, institutionRadicado,  records: [] };
          }
          acc[institutionName].records.push(register);
          return acc;
        }, {});

        // Convertir el objeto de agrupación en un array
        return Object.values(groupedItems);
      }, []) // Acumular todos los elementos en un solo array sin duplicados
    );
  }

  async getRegistersByUserOffline(userId: string) {
    try {
      // Obtener registros sin procesar
      const registers = await this.dbService.getRegistersByUser(userId);

      // Agrupar por sede
      const groupedData = registers.reduce((acc, register) => {
        const sedeName = register.sede_name || "Sin institución"; // Para registros sin sede
        const radicado = register.institution_radicado || ''; // Para registros sin radicado

        // Inicializar el grupo de sede si no existe en el acumulador
        if (!acc[sedeName]) {
          acc[sedeName] = {
            institution: sedeName,
            institutionRadicado: radicado,
            records: []
          };
        }

        // Añadir el registro al array de records bajo la sede correspondiente
        acc[sedeName].records.push({
          id: register.uuid,
          created: register.date_created,
          annexes: register.annexes ? register.annexes.split(',') : [],
          evidences: register.evidences ? register.evidences.split(',') : [],
          teacher: register.teacher_name || null,
          signature_file: register.signature_file
        });

        return acc;
      }, {});

      // Convertir el objeto agrupado en un array
      return Object.values(groupedData);

    } catch (error) {
      throw new Error('Error al obtener los registros');
    }
  }

  getRegisterById(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--registry]', 'title,field_activities,field_approach,field_sub_activities,field_evidence,field_annex,field_signature,field_teacher,field_institution')
      .set('include', 'field_evidence,field_annex,field_signature,field_teacher,field_institution,field_evidence.field_file,field_annex.field_file');

    return this.http.get(`${this.API_URL}/node/registry/${id}` , {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        const included = resp.included;

        const idTeacher = data.relationships.field_teacher.data ? data.relationships.field_teacher.data.id : '';
        const teacher = idTeacher ? included.find((item: any) => item.id === idTeacher).attributes.title : null;

        const idInstitution = data.relationships.field_institution.data ? data.relationships.field_institution.data.id : '';
        const institutionObj = idInstitution ? included.find((item: any) => item.id === idInstitution) : null;

        const institution = institutionObj ? institutionObj.attributes.title : '';
        const institution_radicado = institution ? institutionObj.attributes.field_based : '';
        const idSignature = data.relationships.field_signature.data?.id;
        let signature = idSignature ? included.find((item: any) => item.id === idSignature) : null;
        signature.url = signature ? `${this.HOST}${signature.attributes.uri.url}` : '';


        const idsAnnex = data.relationships.field_annex.data.map((item: any) => item.id);
        const idsEvidence = data.relationships.field_evidence.data.map((item: any) => item.id);

        const annex = included.filter((item: any) => idsAnnex.includes(item.id));
        annex.map((item: any) => {
          const idFile = item.relationships.field_file.data?.id;
          const file = idFile ? included.find((file: any) => file.id === idFile) : null;
          item.fileUrl = file ? `${this.HOST}${file.attributes.uri.url}` : '';
        })
        const evidence = included.filter((item: any) => idsEvidence.includes(item.id));
        evidence.map((item: any) => {
          const idFile = item.relationships.field_file.data?.id;
          const file = idFile ? included.find((file: any) => file.id === idFile) : null;
          item.fileUrl = file ? `${this.HOST}${file.attributes.uri.url}` : '';
        })

        return {
          ...data,
          teacher,
          institution,
          institution_radicado,
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
      .set('fields[node--evidence]', 'title,field_description,field_evidence_date,field_evidence_time,field_latitude,field_longitude,field_has_metadata,field_file')
      .set('include', 'field_file');

    return this.http.get(`${this.API_URL}/node/evidence/${id}`, {params}).pipe(
      map((resp: any) => {
        const data = resp.data;
        const included = resp.included;

        const idFile = data.relationships.field_file.data?.id;
        const file = idFile ? included.find((item: any) => item.id === idFile) : null;
        data.fileUrl = file ? `${this.HOST}${file.attributes.uri.url}` : '';

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

  getTeacherByid(id: string): Observable<any> {
    const params = new HttpParams()
      .set('fields[node--teacher]', 'title')
    return this.http.get(`${this.API_URL}/node/offices/${id}`, {params}).pipe(
      map((resp: any) => resp.data)
    );
  }

  async uploadFileAndSaveId(file: File, csrf: string, type: string, objToUpdate: PhotoData | attachedData | {file: File | null, idFile: string, idOriginalFile?: string} | null) {
    let URL = '';
    if(type === 'evidence') {
      URL = `${this.API_URL}/node/evidence/field_file`;
    } else if (type === 'original_evidence') {
      URL = `${this.API_URL}/node/evidence/field_original_pic`;
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
        if(type === 'original_evidence') {
          objToUpdate.idOriginalFile = response.id;
        } else {
          objToUpdate.idFile = response.id;
        }
      }
      return response;
    } catch (error: any) {
      throw new Error(`Error al subir el archivo: ${error.message || error.error?.message || error}`);
    }
  }

  async updateEvidence(id: string, payload: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
      }),
    };
    const URL = `${this.API_URL}/node/evidence/${id}`;

    try {
      const response = await firstValueFrom(this.http.patch<any>(URL, payload, httpOptions));
      return response;
    } catch (error: any) {
      throw new Error(`Error al actualizar la evidencia: ${error.message || error.error?.message || error}`);
    }
  }

  async createEvidence(photoData: PhotoData, csrfToken: string, isFromLocal: boolean = false) {
    const payload: any = {
      data: {
        type: 'node--evidence',
        attributes: {
          title: photoData.name,
          field_description: photoData.description,
          field_evidence_date: photoData.date || '',
          field_evidence_time: photoData.time || '',
          field_latitude: photoData.latitude || '',
          field_longitude: photoData.longitude || '',
          field_has_metadata: true
        },
        relationships: {
          field_file: {
            data: {
              type: 'file--file',
              id: photoData.idFile
            }
          }
        }
      }
    };

    if (photoData.idOriginalFile) {
      payload.data.relationships.field_original_pic = {
        data: {
          type: 'file--file',
          id: photoData.idOriginalFile
        }
      };
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Accept': '*/*',
        'Content-Type': 'application/vnd.api+json',
        'X-Csrf-Token': csrfToken,
      }),
    };
    const URL = `${this.API_URL}/node/evidence`;

    try {
      // Envío de solicitud a la API para crear la evidencia
      const response = await firstValueFrom(this.http.post<any>(URL, payload, httpOptions));
      photoData.idEvidence = response.data.id;

      // Guardar en la base de datos local si está en modo híbrido
      if (this.plaftorm.is('hybrid') && !isFromLocal) {
        let filePath = '';
        if (photoData.file) {
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
        };

        await this.dbService.addEvidence(evidence).catch((error) => {
          throw new Error(`Error al guardar la evidencia en la base de datos local: ${error.message}`);
        });
      }

      // Actualización en base de datos local si proviene de datos locales
      if (isFromLocal) {
        const evidence: Evidence = {
          uuid: photoData.local_uuid!,
          server_uuid: response.data.id,
          name: photoData.name,
          is_synced: 1,
          status: 1,
        };

        await this.dbService.updateEvidence(evidence).catch((error) => {
          throw new Error(`Error al actualizar la evidencia en la base de datos local: ${error.message}`);
        });
      }

      return response;
    } catch (error: any) {
      throw new Error(`Error al crear evidencia: ${error.message || error.error?.message || error}`);
    }
  }

  async createEvidenceOffline(evidence: Evidence) {
    try {
      // Generar un UUID si no existe
      const uuid = evidence.uuid || crypto.randomUUID();
      evidence.uuid = uuid;

      // Intentar agregar la evidencia en la base de datos local
      await this.dbService.addEvidence(evidence).catch((error) => {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error('Error de integridad: Clave foránea faltante al insertar evidencia offline');
        } else if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Error de integridad: Evidencia duplicada detectada en la base de datos local');
        } else {
          throw new Error('Error al guardar la evidencia en la base de datos local');
        }
      });

      return evidence;
    } catch (error: any) {
      throw new Error(`Error al crear evidencia offline: ${error.message || error}`);
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
      // Solicitud a la API para crear el anexo
      const response = await firstValueFrom(this.http.post<any>(URL, payload, httpOptions));
      attachedData.idAnnex = response.data.id;

      // Guardar el archivo en la base de datos local si está en modo híbrido
      if (this.plaftorm.is('hybrid') && !isFromLocal) {
        let filePath = '';
        if (attachedData.file) {
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
        };

        await this.dbService.addAnnex(annex).catch((error) => {
          throw new Error(`Error al guardar el anexo en la base de datos local: ${error.message}`);
        });
      }

      // Actualizar el anexo en la base de datos local si es desde datos locales
      if (isFromLocal) {
        const annex: Annex = {
          uuid: attachedData.local_uuid!,
          server_uuid: response.data.id,
          name: attachedData.name,
          is_synced: 1,
          status: 1,
        };

        await this.dbService.updateAnnex(annex).catch((error) => {
          throw new Error(`Error al actualizar el anexo en la base de datos local: ${error.message}`);
        });
      }

      return response;
    } catch (error: any) {
      throw new Error(`Error al crear anexo: ${error.message || error.error?.message || error}`);
    }
  }

  async createAnnexOffline(annex: Annex) {
    try {
      // Generar un UUID si no existe
      const uuid = annex.uuid || crypto.randomUUID();
      annex.uuid = uuid;

      // Intentar agregar el anexo en la base de datos local
      await this.dbService.addAnnex(annex).catch((error) => {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error('Error de integridad: Clave foránea faltante al insertar anexo offline');
        } else if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Error de integridad: Anexo duplicado detectado en la base de datos local');
        } else {
          throw new Error('Error al guardar el anexo en la base de datos local');
        }
      });

      return annex;
    } catch (error: any) {
      throw new Error(`Error al crear anexo offline: ${error.message || error}`);
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

      // Intentar agregar el registro en la base de datos local
      await this.dbService.addRegister(register).catch((error) => {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error('Error de integridad: Clave foránea faltante al insertar registro offline');
        } else if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Error de integridad: Registro duplicado detectado en la base de datos local');
        } else {
          throw new Error('Error al guardar el registro en la base de datos local');
        }
      });

      return register;
    } catch (error: any) {
      console.error('Error al crear el registro offline en la base de datos local:', error);
      throw new Error(`Error al crear registro offline: ${error.message || error}`);
    }
  }


  async addEvidenceToRegister(registerId: string, evidenceId?: string, is_synced: number = 1) {
    try {
      if (evidenceId) {
        await this.dbService.addEvidenceToRegister(registerId, evidenceId, is_synced).catch((error) => {
          if (error.message.includes('FOREIGN KEY constraint failed')) {
            throw new Error(`Error de integridad: El registro o evidencia con ID ${registerId} o ${evidenceId} no existe`);
          } else {
            throw new Error(`Error al agregar evidencia al registro en la base de datos local: ${error.message}`);
          }
        });
      }
    } catch (error: any) {
      throw new Error(`Error al agregar evidencia al registro: ${error.message || error}`);
    }
  }


  async addAnnexToRegister(registerId: string, annexId?: string, is_synced: number = 1) {
    try {
      if (annexId) {
        await this.dbService.addAnnexToRegister(registerId, annexId, is_synced).catch((error) => {
          if (error.message.includes('FOREIGN KEY constraint failed')) {
            throw new Error(`Error de integridad: El registro o anexo con ID ${registerId} o ${annexId} no existe`);
          } else {
            throw new Error(`Error al agregar anexo al registro en la base de datos local: ${error.message}`);
          }
        });
      }
    } catch (error: any) {
      throw new Error(`Error al agregar anexo al registro: ${error.message || error}`);
    }
  }

}
