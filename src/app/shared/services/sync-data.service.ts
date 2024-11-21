import { Injectable } from '@angular/core';
import { UserService } from 'src/app/features/menu/services/user.service';
import { DatabaseService } from './database.service';
import { firstValueFrom } from 'rxjs';
import { Annex, Evidence, Parametric, Sede, SedesGroup, Zone, StateParametric, User, Register, Teacher } from '../models/entity.interface';
import { ParametricsService } from './parametrics.service';
import { NodesService } from '../../features/registers/services/nodes.service';
import { downloadAndSaveFile } from '../utils/functions';

@Injectable({
  providedIn: 'root'
})
export class SyncDataService {

  constructor(private userService: UserService, private dbService: DatabaseService, private parametricsService: ParametricsService, private nodesService: NodesService) { }

  async registerSyncData(details: string) {
    const sync_date = new Date().toISOString();

    try {
      // Intentar agregar el log de sincronización en la base de datos
      await this.dbService.addSyncLog({ sync_date, details }).catch((error) => {
        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new Error('Error de integridad: Clave foránea faltante al registrar log de sincronización');
        } else if (error.message.includes('UNIQUE constraint failed')) {
          throw new Error('Error de integridad: Log de sincronización duplicado detectado');
        } else {
          throw new Error(`Error al registrar el log de sincronización en la base de datos: ${error.message}`);
        }
      });
    } catch (error: any) {
      // Propagar el error específico para manejarlo en el proceso principal
      throw new Error(`Error en registerSyncData: ${error?.message}`);
    }
  }

  async syncAllData(idUser: string, pass: string) {
    try {
      await this.syncUserData(idUser, pass);
      await this.parametricsData(idUser);
      await this.nodesData(idUser);
      await this.registerSyncData('Primera sincronización de datos. Usuario: ' + idUser);
    } catch (error) {
      throw error;
    }
  }

  async syncUserData(idUser: string, pass: string) {
    try {
      const users = await firstValueFrom(this.userService.getAllUsers());

      if (users.length) {
        const userPromises = users.map((user: any) => {
          const userPayload: User = {
            uuid: user.id,
            id: user.uid,
            username: user.username,
            password: '',
            mail: user.mail,
            full_name: user.field_names,
            document_type: user.field_document_type,
            document_number: user.field_document_number,
            department: user.field_department,
            status: user.username ? 1 : 0,
          };

          // Manejo de errores de integridad para cada inserción
          return this.dbService.addUser(userPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar usuario');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Usuario duplicado detectado');
            } else {
              throw new Error(`Error al insertar usuario en la base de datos local: ${error.message}`);
            }
          });
        });
        await Promise.all(userPromises);
      }

      // Verificar si el usuario está en la base de datos local y actualizar su contraseña
      let userInLocalDB: any = await this.dbService.getUserById(idUser);
      if (userInLocalDB) {
        userInLocalDB.password = pass;
        await this.dbService.updateUserById(idUser, userInLocalDB).catch((error) => {
          throw new Error('Error al actualizar la contraseña en la base de datos local');
        });
      } else {
        throw new Error('Usuario no encontrado en la base de datos local');
      }
    } catch (error: any) {
      // Captura y propagación del error específico
      throw new Error(`Error en syncUserData: ${error?.message || error}`);
    }
  }

  async syncExistsUserData(idUser: string, pass: string) {
    try {
      // Obtener datos del usuario desde el servidor
      const serverUser = await firstValueFrom(this.userService.getUserInfo(idUser)).catch((error) => {
        throw new Error('Error al obtener información del usuario desde el servidor');
      });

      // Obtener datos del usuario desde la base de datos local
      const user = await this.dbService.getUserById(idUser);
      let userInLocalDB: User = user!;

      if (userInLocalDB) {
        // Actualizar datos del usuario en el objeto local
        userInLocalDB.id = serverUser.uid;
        userInLocalDB.username = serverUser.username;
        userInLocalDB.password = pass;
        userInLocalDB.mail = serverUser.mail;
        userInLocalDB.full_name = serverUser.field_names;
        userInLocalDB.document_type = serverUser.field_document_type;
        userInLocalDB.document_number = serverUser.field_document_number;
        userInLocalDB.department = serverUser.field_department;
        userInLocalDB.status = serverUser.username ? 1 : 0;

        // Intentar actualizar el usuario en la base de datos local
        await this.dbService.updateUserById(idUser, userInLocalDB).catch((error) => {
          if (error.message.includes('FOREIGN KEY constraint failed')) {
            throw new Error('Error de integridad: Clave foránea faltante al actualizar usuario');
          } else if (error.message.includes('UNIQUE constraint failed')) {
            throw new Error('Error de integridad: Intento de duplicado al actualizar usuario');
          } else {
            throw new Error(`Error al actualizar usuario en la base de datos local ${error.message}`);
          }
        });
      } else {
        throw new Error('Usuario no encontrado en la base de datos local');
      }

    } catch (error: any) {
      // Propagar el error específico para que se pueda mostrar al usuario
      throw new Error(`Error en syncExistsUserData: ${error?.message || error}`);
    }
  }

  async parametricsData(idUser: string) {
    try {
      const states = await firstValueFrom(this.parametricsService.getTaxonomyItems('state'));

      if (states.length) {
        const statePromises = states.map((state: any) => {
          const statePayload: StateParametric = {
            uuid: state.id,
            name: state.attributes.name,
          };
          return this.dbService.addStateParametric(statePayload).catch((error) => {
            // Identificar errores específicos y lanzar mensajes claros
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar estado');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Estado duplicado detectado');
            } else {
              throw new Error(`Error al insertar estado en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(statePromises);
      }

      const all_departments = await firstValueFrom(this.parametricsService.getTaxonomyItems('all_departments'));

      if (all_departments.length) {
        const allDepartmentPromises = all_departments.map((allDepartment: any) => {
          const allDepartmentPayload: Parametric = {
            uuid: allDepartment.id,
            name: allDepartment.attributes.name,
            status: allDepartment.attributes.status ? 1 : 0,
          };
          return this.dbService.addDepartment(allDepartmentPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar departamento');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Departamento duplicado detectado');
            } else {
              throw new Error(`Error al insertar departamento en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(allDepartmentPromises);
      }

      const approaches = await firstValueFrom(this.parametricsService.getTaxonomyItems('approach'));

      if (approaches.length) {
        const approachPromises = approaches.map((approach: any) => {
          const approachPayload: Parametric = {
            uuid: approach.id,
            name: approach.attributes.name,
            status: approach.attributes.status ? 1 : 0,
          };
          return this.dbService.addApproach(approachPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar enfoque');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Enfoque duplicado detectado');
            } else {
              throw new Error(`Error al insertar enfoque en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(approachPromises);
      }

      const activities = await firstValueFrom(this.parametricsService.getTaxonomyItems('activities'));

      if (activities.length) {
        const activityPromises = activities.map((activity: any) => {
          const activityPayload: Parametric = {
            uuid: activity.id,
            name: activity.attributes.name,
            status: activity.attributes.status ? 1 : 0,
          };
          return this.dbService.addActivity(activityPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar actividad');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Actividad duplicada detectada');
            } else {
              throw new Error(`Error al insertar actividad en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(activityPromises);
      }

      const subactivities = await firstValueFrom(this.parametricsService.getTaxonomyItems('sub_activities'));

      if (subactivities.length) {
        const subactivityPromises = subactivities.map((subactivity: any) => {
          const subactivityPayload: Parametric = {
            uuid: subactivity.id,
            name: subactivity.attributes.name,
            status: subactivity.attributes.status ? 1 : 0,
          };
          return this.dbService.addSubactivity(subactivityPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar subactividad');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Subactividad duplicada detectada');
            } else {
              throw new Error(`Error al insertar subactividad en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(subactivityPromises);
      }

      const locations = await firstValueFrom(this.parametricsService.getTaxonomyItems('location'));

      if (locations.length) {
        const locationPromises = locations.map((location: any) => {
          const locationPayload: Parametric = {
            uuid: location.id,
            name: location.attributes.name,
            status: location.attributes.status ? 1 : 0,
          };
          return this.dbService.addLocation(locationPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar localidad');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Localidad duplicada detectada');
            } else {
              throw new Error(`Error al insertar localidad en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(locationPromises);
      }

      const municipalities = await firstValueFrom(this.parametricsService.getMunicipalitiesBytutor(idUser));

      if (municipalities.length) {
        const municipalityPromises = municipalities.map((municipality: any) => {
          const municipalityPayload: Parametric = {
            uuid: municipality.id,
            name: municipality.attributes.name,
            status: municipality.attributes.status ? 1 : 0,
          };
          return this.dbService.addMunicipality(municipalityPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar municipio');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Municipio duplicado detectado');
            } else {
              throw new Error(`Error al insertar municipio en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(municipalityPromises);
      }

      const teacherList = await firstValueFrom(this.parametricsService.getTeachersByTutor(idUser));

      if(teacherList.length) {
        const teacherPromises = teacherList.map((teacher: any) => {
          const teacherPayload: Teacher = {
            uuid: teacher.id,
            name: teacher.name,
            document_type: teacher.documentType,
            document_number: teacher.documentNumber,
            mail: teacher.mail,
            phone: teacher.phone,
            state_uuid: teacher.state,
            status: teacher.status ? 1 : 0,
          };
          return this.dbService.addTeacher(teacherPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar docente');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Docente duplicado detectado');
            } else {
              throw new Error(`Error al insertar docente en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(teacherPromises);
      }

      const sedeList = await firstValueFrom(this.parametricsService.getSedesBytutor(idUser));

      if (sedeList.length) {
        const sedePromises = sedeList.map(async (sede: any) => {
          const sedePayload: Sede = {
            uuid: sede.id,
            name: sede.title,
            code_dane: sede.code_dane,
            based: sede.based,
            address: sede.address,
            date_created: sede.created,
            department_uuid: sede.department,
            location_uuid: sede.location,
            municipality_uuid: sede.municipality,
            state_uuid: sede.state,
            status: sede.status ? 1 : 0,
          };

          // Intentar agregar la sede a la base de datos con manejo de errores
          await this.dbService.addSede(sedePayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar sede');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Sede duplicada detectada');
            } else {
              throw new Error(`Error al insertar sede en la base de datos ${error.message}`);
            }
          });

          // Verificar si la sede tiene un arreglo de teachers y agregarlos en la tabla intermedia
          if (sede.teachers && sede.teachers.length) {
            const teacherPromises = sede.teachers.map((teacherId: string) =>
              this.dbService.addTeacherToSede(sede.id, teacherId).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al asignar teacher ${teacherId} a la sede ${sede.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre teacher ${teacherId} y sede ${sede.id}`);
                } else {
                  throw new Error(`Error al agregar teacher ${teacherId} a la sede ${sede.id}: ${error.message}`);
                }
              })
            );

            await Promise.all(teacherPromises); // Esperar a que todos los teachers se agreguen
          }
        });

        await Promise.all(sedePromises); // Esperar a que todas las sedes y sus teachers se agreguen
      }

    } catch (error: any) {
      throw new Error(`Error en parametricsData: ${error?.message || error}`);
    }
  }

  async nodesData(idUser: string) {
    try {

      const annexList = await firstValueFrom(this.nodesService.getAnnexList(idUser));

      if(annexList.length) {
        const annexPromises = annexList.map( async (annex: any) => {
          const file = annex.file ? await downloadAndSaveFile(annex.file) : '';
          // const file = '';
          const annexPayload: Annex = {
            uuid: annex.id,
            server_uuid: annex.id,
            name: annex.title,
            description: annex.description,
            date_created: annex.created,
            is_synced: 1,
            sync_action: '',
            file,
            status: annex.status ? 1 : 0,
          };
          return this.dbService.addAnnex(annexPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar anexo');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Anexo duplicado detectado');
            } else {
              throw new Error(`Error al insertar anexo en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(annexPromises);
      }

      const evidenceList = await firstValueFrom(this.nodesService.getEvidenceList(idUser));

      if(evidenceList.length) {
        const evidencePromises = evidenceList.map( async (evidence: any) => {
          const file = evidence.file ? await downloadAndSaveFile(evidence.file) : ''
          // const file = ''
          const evidencePayload: Evidence = {
            uuid: evidence.id,
            server_uuid: evidence.id,
            name: evidence.title,
            description: evidence.description,
            date_created: evidence.date,
            time_created: evidence.time,
            latitude: evidence.latitude,
            longitude: evidence.longitude,
            is_synced: 1,
            sync_action: '',
            file,
            status: evidence.status ? 1 : 0,
          };
          return this.dbService.addEvidence(evidencePayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar evidencia');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Evidencia duplicada detectada');
            } else {
              throw new Error(`Error al insertar evidencia en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(evidencePromises);
      }

      const sedeGroupList = await firstValueFrom(this.nodesService.getSedeGroupListByTutor(idUser));

      if (sedeGroupList.length) {
        const sedeGroupPromises = sedeGroupList.map(async (sedeGroup: any) => {
          const sedeGroupPayload: SedesGroup = {
            uuid: sedeGroup.id,
            name: sedeGroup.title,
            date_created: sedeGroup.created,
            municipality_uuid: sedeGroup.municipality,
            status: sedeGroup.status ? 1 : 0,
          };

          await this.dbService.addSedesGroup(sedeGroupPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar grupo de sedes');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Grupo de sedes duplicado detectado');
            } else {
              throw new Error(`Error al insertar grupo de sedes en la base de datos ${error.message}`);
            }
          });

          if (sedeGroup.offices.length) {
            const sedesGroupSedePromises = sedeGroup.offices.map((sede: any) =>
              this.dbService.addSedeToSedesGroup(sedeGroup.id, sede.id).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar sede ${sede.id} en grupo de sedes ${sedeGroup.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre sede ${sede.id} y grupo de sedes ${sedeGroup.id}`);
                } else {
                  throw new Error(`Error al agregar sede ${sede.id} al grupo de sedes ${sedeGroup.id}: ${error.message}`);
                }
              })
            );

            await Promise.all(sedesGroupSedePromises);
          }
        });

        await Promise.all(sedeGroupPromises);
      }

      const zoneList = await firstValueFrom(this.nodesService.getZoneListByTutor(idUser));

      if (zoneList.length) {
        const zonePromises = zoneList.map(async (zone: any) => {
          const zonePayload: Zone = {
            uuid: zone.id,
            name: zone.title,
            date_created: zone.created,
            department_uuid: zone.department,
            state_uuid: zone.state,
            status: zone.status ? 1 : 0,
          };

          // Primero crear la zona
          await this.dbService.addZone(zonePayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar zona');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Zona duplicada detectada');
            } else {
              throw new Error(`Error al insertar zona en la base de datos ${error.message}`);
            }
          });

          // Luego agregar los grupos de sedes a la zona
          if (zone.groups.length) {
            const zoneSedesGroupPromises = zone.groups.map((group: string) =>
              this.dbService.addSedesGroupToZone(zone.id, group).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar grupo de sedes ${group} en zona ${zone.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre grupo de sedes ${group} y zona ${zone.id}`);
                } else {
                  throw new Error(`Error al agregar grupo de sedes ${group} a la zona ${zone.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(zoneSedesGroupPromises);
          }

          // Luego agregar los usuarios (tutores) a la zona
          if (zone.tutors.length) {
            const zoneUsersPromises = zone.tutors.map((tutor: string) =>
              this.dbService.addUserToZone(zone.id, tutor).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar tutor ${tutor} en zona ${zone.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre tutor ${tutor} y zona ${zone.id}`);
                } else {
                  throw new Error(`Error al agregar tutor ${tutor} a la zona ${zone.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(zoneUsersPromises);
          }
        });

        await Promise.all(zonePromises);
      }

      const registerList = await firstValueFrom(this.nodesService.getRegisterList(idUser));

      // Manejo de los registros y sus relaciones
      if (registerList.length) {
        const registerPromises = registerList.map(async (register: any) => {
          const file = register.signature_file ? await downloadAndSaveFile(register.signature_file) : ''
          // const file = '';

          const registerPayload: Register = {
            uuid: register.id,
            name: register.title,
            date_created: register.created,
            signature_file: file,
            approach_uuid: register.approach,
            activity_uuid: register.activity,
            subactivity_uuid: register.sub_activity,
            teacher_uuid: register.teacher,
            sede_uuid: register.sede,
            user_uuid: register.user_uuid,
            is_synced: 1,
            status: register.status ? 1 : 0,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar registro');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Registro duplicado detectado');
            } else {
              throw new Error(`Error al insertar registro en la base de datos ${error.message}`);
            }
          });

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence, 1).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar evidencia ${evidence} en registro ${register.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre evidencia ${evidence} y registro ${register.id}`);
                } else {
                  throw new Error(`Error al agregar evidencia ${evidence} al registro ${register.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex, 1).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar anexo ${annex} en registro ${register.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre anexo ${annex} y registro ${register.id}`);
                } else {
                  throw new Error(`Error al agregar anexo ${annex} al registro ${register.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(registerAnnexPromises);
          }
        });

        await Promise.all(registerPromises);
      }

    } catch (error: any) {
      throw new Error(`Error en nodesData: ${error?.message || error}`);
    }
  }

  async newUserData(idUser: string, pass: string) {
    try {
      await this.syncExistsUserData(idUser, pass);

      const currentMunicipalities = await this.dbService.loadMunicipalities();
      const currentMunicipalityIds = currentMunicipalities.map((m: any) => m.uuid);
      const municipalities = await firstValueFrom(this.parametricsService.getMunicipalitiesBytutor(idUser));

      if (municipalities.length) {
        const newMunicipalities = municipalities.filter((municipality: any) => !currentMunicipalityIds.includes(municipality.id));

        if(newMunicipalities.length) {
          const municipalityPromises = newMunicipalities.map((municipality: any) => {
            const municipalityPayload: Parametric = {
              uuid: municipality.id,
              name: municipality.attributes.name,
              status: municipality.attributes.status ? 1 : 0,
            };
            return this.dbService.addMunicipality(municipalityPayload).catch((error) => {
              if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Error de integridad: Clave foránea faltante al insertar municipio');
              } else if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Error de integridad: Municipio duplicado detectado');
              } else {
                throw new Error(`Error al insertar municipio en la base de datos ${error.message}`);
              }
            });
          });
          await Promise.all(municipalityPromises);
        }
      }

      const currentTeachers = await this.dbService.loadTeachers();
      const currentTeacherIds = currentTeachers.map((t: any) => t.uuid);
      const teacherList = await firstValueFrom(this.parametricsService.getTeachersByTutor(idUser));

      if(teacherList.length) {
        const newTeachers = teacherList.filter((teacher: any) => !currentTeacherIds.includes(teacher.id));

        if(newTeachers.length) {
          const teacherPromises = newTeachers.map((teacher: any) => {
            const teacherPayload: Teacher = {
              uuid: teacher.id,
              name: teacher.name,
              document_type: teacher.documentType,
              document_number: teacher.documentNumber,
              mail: teacher.mail,
              phone: teacher.phone,
              state_uuid: teacher.state,
              status: teacher.status ? 1 : 0,
            };
            return this.dbService.addTeacher(teacherPayload).catch((error) => {
              if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Error de integridad: Clave foránea faltante al insertar docente');
              } else if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Error de integridad: Docente duplicado detectado');
              } else {
                throw new Error(`Error al insertar docente en la base de datos ${error.message}`);
              }
            });
          });
          await Promise.all(teacherPromises);
        }
      }

      const currentSedes = await this.dbService.loadSedes();
      const currentSedeIds = currentSedes.map((s: any) => s.uuid);
      const sedeList = await firstValueFrom(this.parametricsService.getSedesBytutor(idUser));

      if(sedeList.length) {
        const newSedes = sedeList.filter((sede: any) => !currentSedeIds.includes(sede.id));

        if(newSedes.length) {
          const sedePromises = newSedes.map(async (sede: any) => {
            const sedePayload: Sede = {
              uuid: sede.id,
              name: sede.title,
              code_dane: sede.code_dane,
              based: sede.based,
              address: sede.address,
              date_created: sede.created,
              department_uuid: sede.department,
              location_uuid: sede.location,
              municipality_uuid: sede.municipality,
              state_uuid: sede.state,
              status: sede.status ? 1 : 0,
            };

            await this.dbService.addSede(sedePayload).catch((error) => {
              if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Error de integridad: Clave foránea faltante al insertar sede');
              } else if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Error de integridad: Sede duplicada detectada');
              } else {
                throw new Error(`Error al insertar sede en la base de datos ${error.message}`);
              }
            });

            if (sede.teachers && sede.teachers.length) {
              const teacherPromises = sede.teachers.map((teacherId: string) =>
                this.dbService.addTeacherToSede(sede.id, teacherId).catch((error) => {
                  if (error.message.includes('FOREIGN KEY constraint failed')) {
                    throw new Error(`Error de integridad: Clave foránea faltante al asignar teacher ${teacherId} a la sede ${sede.id}`);
                  } else if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error(`Error de integridad: Relación duplicada entre teacher ${teacherId} y sede ${sede.id}`);
                  } else {
                    throw new Error(`Error al agregar teacher ${teacherId} a la sede ${sede.id}: ${error.message}`);
                  }
                })
              );

              await Promise.all(teacherPromises); // Esperar a que todos los teachers se agreguen
            }

          });
          await Promise.all(sedePromises);
        }
      }

      const annexList = await firstValueFrom(this.nodesService.getAnnexList(idUser));

      if(annexList.length) {
        const annexPromises = annexList.map( async (annex: any) => {
          const file = annex.file ? await downloadAndSaveFile(annex.file) : '';
          // const file = '';
          const annexPayload: Annex = {
            uuid: annex.id,
            server_uuid: annex.id,
            name: annex.title,
            description: annex.description,
            date_created: annex.created,
            is_synced: 1,
            sync_action: '',
            file,
            status: annex.status ? 1 : 0,
          };
          return this.dbService.addAnnex(annexPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar anexo');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Anexo duplicado detectado');
            } else {
              throw new Error(`Error al insertar anexo en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(annexPromises);
      }


      const evidenceList = await firstValueFrom(this.nodesService.getEvidenceList(idUser));

      if(evidenceList.length) {
        const evidencePromises = evidenceList.map( async (evidence: any) => {
          const file = evidence.file ? await downloadAndSaveFile(evidence.file) : ''
          // const file = ''
          const evidencePayload: Evidence = {
            uuid: evidence.id,
            server_uuid: evidence.id,
            name: evidence.title,
            description: evidence.description,
            date_created: evidence.date,
            time_created: evidence.time,
            latitude: evidence.latitude,
            longitude: evidence.longitude,
            is_synced: 1,
            sync_action: '',
            file,
            status: evidence.status ? 1 : 0,
          };
          return this.dbService.addEvidence(evidencePayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar evidencia');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Evidencia duplicada detectada');
            } else {
              throw new Error(`Error al insertar evidencia en la base de datos ${error.message}`);
            }
          });
        });
        await Promise.all(evidencePromises);
      }

      const currentSedeGroups = await this.dbService.loadSedesGroups();
      const currentSedeGroupIds = currentSedeGroups.map((sg: any) => sg.uuid);
      const sedeGroupList = await firstValueFrom(this.nodesService.getSedeGroupListByTutor(idUser));

      if (sedeGroupList.length) {
        const newSedeGroups = sedeGroupList.filter((sedeGroup: any) => !currentSedeGroupIds.includes(sedeGroup.id));

        if(newSedeGroups.length) {
          const sedeGroupPromises = newSedeGroups.map(async (sedeGroup: any) => {
            const sedeGroupPayload: SedesGroup = {
              uuid: sedeGroup.id,
              name: sedeGroup.title,
              date_created: sedeGroup.created,
              municipality_uuid: sedeGroup.municipality,
              status: sedeGroup.status ? 1 : 0,
            };

            await this.dbService.addSedesGroup(sedeGroupPayload).catch((error) => {
              if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Error de integridad: Clave foránea faltante al insertar grupo de sedes');
              } else if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Error de integridad: Grupo de sedes duplicado detectado');
              } else {
                throw new Error(`Error al insertar grupo de sedes en la base de datos ${error.message}`);
              }
            });

            if (sedeGroup.offices.length) {
              const sedesGroupSedePromises = sedeGroup.offices.map((sede: any) =>
                this.dbService.addSedeToSedesGroup(sedeGroup.id, sede.id).catch((error) => {
                  if (error.message.includes('FOREIGN KEY constraint failed')) {
                    throw new Error(`Error de integridad: Clave foránea faltante al insertar sede ${sede.id} en grupo de sedes ${sedeGroup.id}`);
                  } else if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error(`Error de integridad: Relación duplicada entre sede ${sede.id} y grupo de sedes ${sedeGroup.id}`);
                  } else {
                    throw new Error(`Error al agregar sede ${sede.id} al grupo de sedes ${sedeGroup.id}: ${error.message}`);
                  }
                })
              );

              await Promise.all(sedesGroupSedePromises);
            }
          });

          await Promise.all(sedeGroupPromises);
        }

      }

      const currentZones = await this.dbService.loadZones();
      const currentZoneIds = currentZones.map((z: any) => z.uuid);
      const zoneList = await firstValueFrom(this.nodesService.getZoneListByTutor(idUser));

      if (zoneList.length) {
        const newZones = zoneList.filter((zone: any) => !currentZoneIds.includes(zone.id));

        if(newZones.length) {
          const zonePromises = newZones.map(async (zone: any) => {
            const zonePayload: Zone = {
              uuid: zone.id,
              name: zone.title,
              date_created: zone.created,
              department_uuid: zone.department,
              state_uuid: zone.state,
              status: zone.status ? 1 : 0,
            };

            // Primero crear la zona
            await this.dbService.addZone(zonePayload).catch((error) => {
              if (error.message.includes('FOREIGN KEY constraint failed')) {
                throw new Error('Error de integridad: Clave foránea faltante al insertar zona');
              } else if (error.message.includes('UNIQUE constraint failed')) {
                throw new Error('Error de integridad: Zona duplicada detectada');
              } else {
                throw new Error(`Error al insertar zona en la base de datos ${error.message}`);
              }
            });

            // Luego agregar los grupos de sedes a la zona
            if (zone.groups.length) {
              const zoneSedesGroupPromises = zone.groups.map((group: string) =>
                this.dbService.addSedesGroupToZone(zone.id, group).catch((error) => {
                  if (error.message.includes('FOREIGN KEY constraint failed')) {
                    throw new Error(`Error de integridad: Clave foránea faltante al insertar grupo de sedes ${group} en zona ${zone.id}`);
                  } else if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error(`Error de integridad: Relación duplicada entre grupo de sedes ${group} y zona ${zone.id}`);
                  } else {
                    throw new Error(`Error al agregar grupo de sedes ${group} a la zona ${zone.id}: ${error.message}`);
                  }
                })
              );
              await Promise.all(zoneSedesGroupPromises);
            }

            // Luego agregar los usuarios (tutores) a la zona
            if (zone.tutors.length) {
              const zoneUsersPromises = zone.tutors.map((tutor: string) =>
                this.dbService.addUserToZone(zone.id, tutor).catch((error) => {
                  if (error.message.includes('FOREIGN KEY constraint failed')) {
                    throw new Error(`Error de integridad: Clave foránea faltante al insertar tutor ${tutor} en zona ${zone.id}`);
                  } else if (error.message.includes('UNIQUE constraint failed')) {
                    throw new Error(`Error de integridad: Relación duplicada entre tutor ${tutor} y zona ${zone.id}`);
                  } else {
                    throw new Error(`Error al agregar tutor ${tutor} a la zona ${zone.id}: ${error.message}`);
                  }
                })
              );
              await Promise.all(zoneUsersPromises);
            }
          });

          await Promise.all(zonePromises);
        }

      }

      const registerList = await firstValueFrom(this.nodesService.getRegisterList(idUser));

      if (registerList.length) {
        const registerPromises = registerList.map(async (register: any) => {
          const file = register.signature_file ? await downloadAndSaveFile(register.signature_file) : ''
          // const file = '';

          const registerPayload: Register = {
            uuid: register.id,
            name: register.title,
            date_created: register.created,
            signature_file: file,
            approach_uuid: register.approach,
            activity_uuid: register.activity,
            subactivity_uuid: register.sub_activity,
            teacher_uuid: register.teacher,
            sede_uuid: register.sede,
            user_uuid: register.user_uuid,
            is_synced: 1,
            status: register.status ? 1 : 0,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload).catch((error) => {
            if (error.message.includes('FOREIGN KEY constraint failed')) {
              throw new Error('Error de integridad: Clave foránea faltante al insertar registro');
            } else if (error.message.includes('UNIQUE constraint failed')) {
              throw new Error('Error de integridad: Registro duplicado detectado');
            } else {
              throw new Error(`Error al insertar registro en la base de datos ${error.message}`);
            }
          });

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence, 1).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar evidencia ${evidence} en registro ${register.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre evidencia ${evidence} y registro ${register.id}`);
                } else {
                  throw new Error(`Error al agregar evidencia ${evidence} al registro ${register.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex, 1).catch((error) => {
                if (error.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error(`Error de integridad: Clave foránea faltante al insertar anexo ${annex} en registro ${register.id}`);
                } else if (error.message.includes('UNIQUE constraint failed')) {
                  throw new Error(`Error de integridad: Relación duplicada entre anexo ${annex} y registro ${register.id}`);
                } else {
                  throw new Error(`Error al agregar anexo ${annex} al registro ${register.id}: ${error.message}`);
                }
              })
            );
            await Promise.all(registerAnnexPromises);
          }
        });

        await Promise.all(registerPromises);
      }

      await this.registerSyncData('Sincronización de datos de usuario. Usuario: ' + idUser);

    } catch (error: any) {
      throw new Error(`Error en newUserData: ${error?.message || error}`);
    }
  }

}
