import { Injectable } from '@angular/core';
import { UserService } from 'src/app/features/menu/services/user.service';
import { DatabaseService } from './database.service';
import { firstValueFrom } from 'rxjs';
import { Annex, Evidence, Parametric, Region, Role, Sede, SedesGroup, Zone, StateParametric, User, Register } from '../models/entity.interface';
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
      await this.parametricsData();
      await this.nodesData(idUser);
      await this.registerSyncData('Primera sincronización de datos. Usuario: ' + idUser);
      await this.dbService.loadAllData();
    } catch (error) {
      console.error('Error sincronizando todos los datos', error);
    }
  }

  async syncUserData(idUser: string, pass: string) {
    try {
      // Sincronizar roles
      const roles = await firstValueFrom(this.userService.getRoles());
      if (roles.length) {
        const rolePromises = roles.map((role: any) => {
          const rolePayload: Role = { name: role.label };
          return this.dbService.addRole(rolePayload);
        });
        await Promise.all(rolePromises);
      }

      // Sincronizar todos los usuarios sin contraseña
      const users = await firstValueFrom(this.userService.getAllUsers());
      if (users.length) {
        const userPromises = users.map((user: any) => {
          const userPayload: User = {
            uuid: user.id,
            id: user.uid,
            username: user.username,
            password: '', // No guardamos contraseña aún
            mail: user.mail,
            full_name: user.field_names || null,
            document_number: user.field_document_number || null,
            department: user.field_department || null,
            document_type: user.field_document_type || null,
            status: user.status ? 1 : 0,
          };
          return this.dbService.addUser(userPayload);
        });
        await Promise.all(userPromises);
      }

      // Luego, buscamos el usuario específico en la base de datos local para actualizar su contraseña
      let userInLocalDB: any = await this.dbService.getUserById(idUser); // Suponiendo que tienes un método para obtener el usuario por id
      if (userInLocalDB) {
        userInLocalDB.password = pass; // Actualizamos la contraseña

        // Actualizar el usuario con la nueva contraseña
        await this.dbService.updateUserById(idUser, userInLocalDB); // Método que actualiza el usuario
      } else {
        console.error('Usuario no encontrado en la base de datos local');
      }
    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
    }
  }

  async syncExistsUserData(idUser: string, pass: string) {
    try {
      let userInLocalDB: any = await this.dbService.getUserById(idUser); // Suponiendo que tienes un método para obtener el usuario por id
      if (userInLocalDB) {
        userInLocalDB.password = pass; // Actualizamos la contraseña

        await this.dbService.updateUserById(idUser, userInLocalDB); // Método que actualiza el usuario
      } else {
        console.error('Usuario no encontrado en la base de datos local');
      }
    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
    }
  }

  async parametricsData() {
    try {
      const states = await firstValueFrom(this.parametricsService.getTaxonomyItems('state'));
      const departments = await firstValueFrom(this.parametricsService.getTaxonomyItems('departments'));
      const all_departments = await firstValueFrom(this.parametricsService.getTaxonomyItems('all_departments'));
      const approaches = await firstValueFrom(this.parametricsService.getTaxonomyItems('approach'));
      const activities = await firstValueFrom(this.parametricsService.getTaxonomyItems('activities'));
      const subactivities = await firstValueFrom(this.parametricsService.getTaxonomyItems('sub_activities'));
      const locations = await firstValueFrom(this.parametricsService.getTaxonomyItems('location'));
      const municipalities = await firstValueFrom(this.parametricsService.getTaxonomyItems('municipality'));
      const regionList = await firstValueFrom(this.nodesService.getRegionList());
      const sedeList = await firstValueFrom(this.nodesService.getSedeList());

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

      if (departments.length) {
        const departmentPromises = departments.map((department: any) => {
          const departmentPayload: Parametric = {
            uuid: department.id,
            name: department.attributes.name,
            status: department.attributes.status ? 1 : 0,
          };
          return this.dbService.addDepartment(departmentPayload);
        });
        await Promise.all(departmentPromises);
      }

      if (all_departments.length) {
        const allDepartmentPromises = all_departments.map((allDepartment: any) => {
          const allDepartmentPayload: Parametric = {
            uuid: allDepartment.id,
            name: allDepartment.attributes.name,
            status: allDepartment.attributes.status ? 1 : 0,
          };
          return this.dbService.addAllDepartment(allDepartmentPayload);
        });
        await Promise.all(allDepartmentPromises);
      }

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

      if(regionList.length) {
        const regionPromises = regionList.map((region: any) => {
          const regionPayload: Region = {
            uuid: region.id,
            name: region.title,
            date_created: region.created,
            department_uuid: region.department || '',
            status: region.status,
          };
          return this.dbService.addRegion(regionPayload);
        });
        await Promise.all(regionPromises);
      }

      if(sedeList.length) {
        const sedePromises = sedeList.map((sede: any) => {
          const sedePayload: Sede = {
            uuid: sede.id,
            name: sede.title,
            date_created: sede.created,
            department_uuid: sede.department,
            location_uuid: sede.location,
            municipality_uuid: sede.municipality,
            state_uuid: sede.state,
            status: sede.status,
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
      const evidenceList = await firstValueFrom(this.nodesService.getEvidenceList(idUser));
      const sedeGroupList = await firstValueFrom(this.nodesService.getSedeGroupList());
      const zoneList = await firstValueFrom(this.nodesService.getZoneList());
      const registerList = await firstValueFrom(this.nodesService.getRegisterList(idUser));

      if(annexList.length) {
        const annexPromises = annexList.map( async (annex: any) => {
          const file = annex.file ? await downloadAndSaveFile(annex.file) : '';
          // const file = '';
          const annexPayload: Annex = {
            uuid: annex.id,
            name: annex.title,
            description: annex.description,
            date_created: annex.created,
            is_synced: 1,
            sync_action: '',
            file,
            status: annex.status,
          };
          return this.dbService.addAnnex(annexPayload);
        });
        await Promise.all(annexPromises);
      }

      if(evidenceList.length) {
        const evidencePromises = evidenceList.map( async (evidence: any) => {
          const file = evidence.file ? await downloadAndSaveFile(evidence.file) : ''
          // const file = ''
          const evidencePayload: Evidence = {
            uuid: evidence.id,
            name: evidence.title,
            description: evidence.description,
            date_created: evidence.date,
            time_created: evidence.time,
            latitude: evidence.latitude,
            longitude: evidence.longitude,
            is_synced: 1,
            sync_action: '',
            file,
            status: evidence.status,
          };
          return this.dbService.addEvidence(evidencePayload);
        });
        await Promise.all(evidencePromises);
      }

      if (sedeGroupList.length) {
        const sedeGroupPromises = sedeGroupList.map(async (sedeGroup: any) => {
          const sedeGroupPayload: SedesGroup = {
            uuid: sedeGroup.id,
            name: sedeGroup.title,
            date_created: sedeGroup.created,
            municipality_uuid: sedeGroup.municipality,
            status: sedeGroup.status,
          };

          await this.dbService.addSedesGroup(sedeGroupPayload);

          if (sedeGroup.offices.length) {
            const sedesGroupSedePromises = sedeGroup.offices.map((sede: string) =>
              this.dbService.addSedeToSedesGroup(sedeGroup.id, sede)
            );

            await Promise.all(sedesGroupSedePromises);
          }
        });

        await Promise.all(sedeGroupPromises);
      }

      // Manejo de las zonas y sus relaciones
      if (zoneList.length) {
        const zonePromises = zoneList.map(async (zone: any) => {
          const zonePayload: Zone = {
            uuid: zone.id,
            name: zone.title,
            date_created: zone.created,
            department_uuid: zone.department,
            region_uuid: zone.region,
            state_uuid: zone.state,
            status: zone.status,
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
            status: register.status,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload);

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence)
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex)
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

      const annexList = await firstValueFrom(this.nodesService.getAnnexList(idUser));
      const evidenceList = await firstValueFrom(this.nodesService.getEvidenceList(idUser));
      const registerList = await firstValueFrom(this.nodesService.getRegisterList(idUser));

      if(annexList.length) {
        const annexPromises = annexList.map( async (annex: any) => {
          // const file = annex.file ? await downloadAndSaveFile(annex.file) : '';
          const file = '';
          const annexPayload: Annex = {
            uuid: annex.id,
            name: annex.title,
            description: annex.description,
            date_created: annex.created,
            is_synced: 1,
            sync_action: '',
            file,
            status: annex.status,
          };
          return this.dbService.addAnnex(annexPayload);
        });
        await Promise.all(annexPromises);
      }

      if(evidenceList.length) {
        const evidencePromises = evidenceList.map( async (evidence: any) => {
          // const file = evidence.file ? await downloadAndSaveFile(evidence.file) : ''
          const file = ''
          const evidencePayload: Evidence = {
            uuid: evidence.id,
            name: evidence.title,
            description: evidence.description,
            date_created: evidence.date,
            time_created: evidence.time,
            latitude: evidence.latitude,
            longitude: evidence.longitude,
            is_synced: 1,
            sync_action: '',
            file,
            status: evidence.status,
          };
          return this.dbService.addEvidence(evidencePayload);
        });
        await Promise.all(evidencePromises);
      }

      if (registerList.length) {
        const registerPromises = registerList.map(async (register: any) => {
          const file = '';  // Aquí iría la lógica de descarga si la necesitas

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
            status: register.status,
          };

          // Primero crear el registro
          await this.dbService.addRegister(registerPayload);

          // Luego agregar las evidencias al registro
          if (register.evidenceList.length) {
            const registerEvidencePromises = register.evidenceList.map((evidence: string) =>
              this.dbService.addEvidenceToRegister(register.id, evidence)
            );
            await Promise.all(registerEvidencePromises);
          }

          // Luego agregar los anexos al registro
          if (register.annexList.length) {
            const registerAnnexPromises = register.annexList.map((annex: string) =>
              this.dbService.addAnnexToRegister(register.id, annex)
            );
            await Promise.all(registerAnnexPromises);
          }
        });

        await Promise.all(registerPromises);
      }

      await this.registerSyncData('Sincronización de datos de usuario. Usuario: ' + idUser);
      await this.dbService.loadAllData();

    } catch (error) {
      console.error('Error sincronizando la información del usuario', error);
    }
  }

}
