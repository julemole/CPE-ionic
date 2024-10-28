import { Injectable } from '@angular/core';
import { UserService } from 'src/app/features/menu/services/user.service';
import { DatabaseService } from './database.service';
import { firstValueFrom } from 'rxjs';
import { Annex, Evidence, Parametric, Region, Sede, SedesGroup, Zone, StateParametric, User, Register } from '../models/entity.interface';
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
      await this.dbService.addSyncLog({ sync_date, details });
    } catch (error) {
      console.error('Error registrando la sincronización de datos', error);
    }
  }

  async syncAllData(idUser: string, pass: string) {
    try {
      await this.syncUserData(idUser, pass);
      await this.parametricsData(idUser);
      await this.nodesData(idUser);
      await this.registerSyncData('Primera sincronización de datos. Usuario: ' + idUser);
    } catch (error) {
      console.error('Error sincronizando todos los datos', error);
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
          return this.dbService.addUser(userPayload);
        });
        await Promise.all(userPromises);
      }

      let userInLocalDB: any = await this.dbService.getUserById(idUser);
      if (userInLocalDB) {
        userInLocalDB.password = pass;
        await this.dbService.updateUserById(idUser, userInLocalDB);
      } else {
        console.error('Usuario no encontrado en la base de datos local');
      }
    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
    }
  }

  async syncExistsUserData(idUser: string, pass: string) {
    try {
      const serverUser = await firstValueFrom(this.userService.getUserInfo(idUser));
      const user = await this.dbService.getUserById(idUser);
      let userInLocalDB: User = user!;
      if (userInLocalDB) {

        userInLocalDB.id = serverUser.uid,
        userInLocalDB.username = serverUser.username,
        userInLocalDB.password = pass;
        userInLocalDB.mail = serverUser.mail,
        userInLocalDB.full_name = serverUser.field_names,
        userInLocalDB.document_type = serverUser.field_document_type,
        userInLocalDB.document_number = serverUser.field_document_number,
        userInLocalDB.department = serverUser.field_department,
        userInLocalDB.status = serverUser.username ? 1 : 0,

        await this.dbService.updateUserById(idUser, userInLocalDB); // Método que actualiza el usuario
      } else {
        console.error('Usuario no encontrado en la base de datos local');
      }

    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
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
          return this.dbService.addStateParametric(statePayload);
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
          return this.dbService.addDepartment(allDepartmentPayload);
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
          return this.dbService.addApproach(approachPayload);
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
          return this.dbService.addActivity(activityPayload);
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
          return this.dbService.addSubactivity(subactivityPayload);
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
          return this.dbService.addLocation(locationPayload);
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
          return this.dbService.addMunicipality(municipalityPayload);
        });
        await Promise.all(municipalityPromises);
      }

      const sedeList = await firstValueFrom(this.parametricsService.getSedesBytutor(idUser));

      if(sedeList.length) {
        const sedePromises = sedeList.map((sede: any) => {
          const sedePayload: Sede = {
            uuid: sede.id,
            name: sede.title,
            code_dane: sede.code_dane,
            address: sede.address,
            date_created: sede.created,
            department_uuid: sede.department,
            location_uuid: sede.location,
            municipality_uuid: sede.municipality,
            state_uuid: sede.state,
            status: sede.status ? 1 : 0,
          };
          return this.dbService.addSede(sedePayload);
        });
        await Promise.all(sedePromises);
      }

    } catch (error) {
      console.error('Error sincronizando la información paramétrica', error);
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
          return this.dbService.addAnnex(annexPayload);
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
          return this.dbService.addEvidence(evidencePayload);
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

          await this.dbService.addSedesGroup(sedeGroupPayload);

          if (sedeGroup.offices.length) {
            const sedesGroupSedePromises = sedeGroup.offices.map((sede: any) =>
              this.dbService.addSedeToSedesGroup(sedeGroup.id, sede.id)
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
          await this.dbService.addZone(zonePayload);

          // Luego agregar los grupos de sedes a la zona
          if (zone.groups.length) {
            const zoneSedesGroupPromises = zone.groups.map((group: string) =>
              this.dbService.addSedesGroupToZone(zone.id, group)
            );
            await Promise.all(zoneSedesGroupPromises);
          }

          // Luego agregar los usuarios (tutores) a la zona
          if (zone.tutors.length) {
            const zoneUsersPromises = zone.tutors.map((tutor: string) =>
              this.dbService.addUserToZone(zone.id, tutor)
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
            sede_uuid: register.sede,
            user_uuid: register.user_uuid,
            is_synced: 1,
            status: register.status ? 1 : 0,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload);

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence, 1)
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex, 1)
            );
            await Promise.all(registerAnnexPromises);
          }
        });

        await Promise.all(registerPromises);
      }

    } catch (error) {
      console.error('Error sincronizando la información de nodos', error);
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
            return this.dbService.addMunicipality(municipalityPayload);
          });
          await Promise.all(municipalityPromises);
        }
      }

      const currentSedes = await this.dbService.loadSedes();
      const currentSedeIds = currentSedes.map((s: any) => s.uuid);
      const sedeList = await firstValueFrom(this.parametricsService.getSedesBytutor(idUser));

      if(sedeList.length) {
        const newSedes = sedeList.filter((sede: any) => !currentSedeIds.includes(sede.id));

        if(newSedes.length) {
          const sedePromises = newSedes.map((sede: any) => {
            const sedePayload: Sede = {
              uuid: sede.id,
              name: sede.title,
              code_dane: sede.code_dane,
              address: sede.address,
              date_created: sede.created,
              department_uuid: sede.department,
              location_uuid: sede.location,
              municipality_uuid: sede.municipality,
              state_uuid: sede.state,
              status: sede.status ? 1 : 0,
            };
            return this.dbService.addSede(sedePayload);
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
          return this.dbService.addAnnex(annexPayload);
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
          return this.dbService.addEvidence(evidencePayload);
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

            await this.dbService.addSedesGroup(sedeGroupPayload);

            if (sedeGroup.offices.length) {
              const sedesGroupSedePromises = sedeGroup.offices.map((sede: any) =>
                this.dbService.addSedeToSedesGroup(sedeGroup.id, sede.id)
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
            await this.dbService.addZone(zonePayload);

            // Luego agregar los grupos de sedes a la zona
            if (zone.groups.length) {
              const zoneSedesGroupPromises = zone.groups.map((group: string) =>
                this.dbService.addSedesGroupToZone(zone.id, group)
              );
              await Promise.all(zoneSedesGroupPromises);
            }

            // Luego agregar los usuarios (tutores) a la zona
            if (zone.tutors.length) {
              const zoneUsersPromises = zone.tutors.map((tutor: string) =>
                this.dbService.addUserToZone(zone.id, tutor)
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
            sede_uuid: register.sede,
            user_uuid: register.user_uuid,
            is_synced: 1,
            status: register.status ? 1 : 0,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload);

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence, 1)
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex, 1)
            );
            await Promise.all(registerAnnexPromises);
          }
        });

        await Promise.all(registerPromises);
      }

      await this.registerSyncData('Sincronización de datos de usuario. Usuario: ' + idUser);

    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
    }
  }

}
