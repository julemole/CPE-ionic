import { firstValueFrom } from 'rxjs';
import { Component, effect, signal, WritableSignal } from '@angular/core';
import { IonApp, IonRouterOutlet, AlertController, Platform, LoadingController } from '@ionic/angular/standalone';
import { DatabaseService } from './shared/services/database.service';
import { ConnectivityService } from './shared/services/connectivity.service';
import { Register } from './shared/models/entity.interface';
import { LocalStorageService } from './core/services/local-storage.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { wifiOutline } from 'ionicons/icons';
import { base64ToBlob, blobToFile, formatDateToRFC3339, getInfoFile } from './shared/utils/functions';
import { RegistersService } from './features/registers/services/registers.service';
import { attachedData, PhotoData } from './shared/models/save-in-session.interface';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  isOnline: WritableSignal<boolean> = signal(true);
  loading: HTMLIonLoadingElement | null = null;

  constructor(private router: Router, private readonly database: DatabaseService, private connectivityService: ConnectivityService, private localSS: LocalStorageService,
    private alertController: AlertController, private platform: Platform, private loadingController: LoadingController, private registersService: RegistersService
  ) {
    this.isOnline = this.connectivityService.getNetworkStatus();
    addIcons({wifiOutline})
    this.initApp();
    effect(() => {
      this.isOnline();
      const token = this.localSS.getItem('TOKEN');
      if(this.isOnline() && typeof token === 'string' && platform.is('hybrid')){
        this.syncOfflineRegisters();
      }
    });
  }

  async initApp() {
    if(this.platform.is('hybrid')){
      try {
        await this.showSplash();
        await this.database.initilizPlugin();
        console.log('Base de datos inicializada');
      } catch (error) {
        console.error('Error inicializando la base de datos', error);
      }
    }
  }

  async showSplash() {
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }

  async syncOfflineRegisters() {
    try {
      const unsyncedRegisters = await this.database.getUnsyncRegisters();

      if (unsyncedRegisters.length) {
        const csrf_token = this.localSS.getItem('CSRF_TOKEN');
        if (!csrf_token) {
          const alert = await this.alertController.create({
            header: 'Advertencia',
            cssClass: 'warning-alert',
            message: 'Se requiere un nuevo inicio de sesión para sincronizar los datos',
            buttons: [{
              text: 'Aceptar',
              handler: () => {
                this.localSS.clearStorage();
                this.router.navigate(['/login']);
              }
            }]
          });
          await alert.present();

          alert.onDidDismiss().then(() => {
            this.localSS.clearStorage();
            this.router.navigate(['/login']);
          });

          return;
        }

        this.showLoading('Sincronizando registros, por favor espere...');

        for (const register of unsyncedRegisters) {
          try {
            await this.syncSingleRegister(register, csrf_token);
          } catch (error: any) {
            // En caso de error en un solo registro, se muestra una alerta y se interrumpe la sincronización
            await this.hideLoading();
            await this.errorAlert(`Error al sincronizar el registro ${register.uuid}: ${error.message}`);
            return;
          }
        }

        await this.hideLoading();

        const succesAlert = await this.alertController.create({
          header: 'Sincronización completa',
          cssClass: 'success-alert',
          message: 'Todos los registros offline se han sincronizado correctamente.',
          buttons: ['Aceptar']
        });
        await succesAlert.present();

      }

    } catch (error: any) {
      await this.hideLoading();
      console.error('Error al sincronizar registros offline:', error);
      await this.errorAlert(`Error al sincronizar registros offline: ${error.message}`);
    }
  }

  // Alerta para mostrar errores
  private async errorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message,
      buttons: ['Aceptar']
    });
    await alert.present();
  }


  private async syncSingleRegister(register: Register, csrfToken: string) {
    try {

      // Convertir firma local a File
      let signatureFile = await this.convertLocalFileToFile(register.signature_file!);
      let signatureObj = { file: signatureFile, idFile: '' };

      // Subir archivos: evidencias, anexos y firma
      let evidences;
      let annexes;
      try {
        evidences = await this.convertLocalEvidenceFiles(register.evidenceList!);
        annexes = await this.convertLocalAnnexFiles(register.annexList!);
      } catch (error: any) {
        throw new Error(`Error al convertir archivos locales de evidencias o anexos: ${error.message}`);
      }

      // Subir todos los archivos al servidor y obtener sus ids
      try {
        await this.uploadAllFiles(evidences, annexes, signatureObj, csrfToken);
      } catch (error: any) {
        throw new Error(`Error al subir los archivos al servidor: ${error.message}`);
      }

      // Crear evidencias en el servidor
      try {
        await this.createAllEvidences(evidences, csrfToken);
      } catch (error: any) {
        throw new Error(`Error al crear evidencias en el servidor: ${error.message}`);
      }

      // Crear anexos en el servidor
      try {
        await this.createAllAnnex(annexes, csrfToken);
      } catch (error: any) {
        throw new Error(`Error al crear anexos en el servidor: ${error.message}`);
      }

      // Crear el registro completo en el servidor
      try {
        await this.createRegisterInServer(register, evidences, annexes, signatureObj, csrfToken);
      } catch (error: any) {
        throw new Error(`Error al crear el registro en el servidor: ${error.message}`);
      }

      // Marcar el registro como sincronizado en la base de datos local
      try {
        await this.markRegisterAsSynced(register);
      } catch (error: any) {
        throw new Error(`Error al marcar el registro como sincronizado en la base de datos local: ${error.message}`);
      }

      console.log(`Registro ${register.uuid} sincronizado correctamente.`);
    } catch (error: any) {
      // Mostrar mensaje de error específico de cada etapa de sincronización
      console.error(`Error al sincronizar el registro ${register.uuid}: ${error.message}`);
    }
  }

  private async convertLocalFileToFile(filePath: string): Promise<File> {
    const fileInfo = await getInfoFile(filePath);
    const blob = base64ToBlob(fileInfo.file, fileInfo.mimeType);

    // Extraer el nombre y la extensión
    const nameParts = fileInfo.name.split('.');
    const name = nameParts[0].substring(0, 3); // Acortar a las primeras 3 letras
    const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : '';

    // Reconstruir el nombre del archivo
    const shortName = `${name}${extension}`;

    return blobToFile(blob, shortName);
  }

  private async convertLocalEvidenceFiles(evidenceList: any[]): Promise<PhotoData[]> {
    const convertedEvidences: PhotoData[] = [];

    for (const evidence of evidenceList) {
      const file = await this.convertLocalFileToFile(evidence.file);
      convertedEvidences.push({
        id: 0, // Puedes asignar un ID temporal si lo necesitas
        local_uuid: evidence.uuid,
        idFile: '', // Se actualizará después de subir el archivo
        name: evidence.name,
        description: evidence.description,
        date: evidence.date_created,
        time: evidence.time_created,
        latitude: evidence.latitude || '',
        longitude: evidence.longitude || '',
        url: null, // Inicialmente null, se actualizará si es necesario
        file: file, // Archivo convertido
      });
    }

    return convertedEvidences;
  }

  private async convertLocalAnnexFiles(annexList: any[]): Promise<attachedData[]> {
    const convertedAnnexes: attachedData[] = [];

    for (const annex of annexList) {
      const file = await this.convertLocalFileToFile(annex.file);
      convertedAnnexes.push({
        id: 0, // Puedes asignar un ID temporal si lo necesitas
        local_uuid: annex.uuid,
        idFile: '', // Se actualizará después de subir el archivo
        name: annex.name,
        description: annex.description,
        file: file, // Archivo convertido
        url: null, // Inicialmente null, se actualizará si es necesario
        urlType: 'local', // Asigna un tipo de URL si corresponde
      });
    }

    return convertedAnnexes;
  }

  private async uploadAllFiles(
    evidences: PhotoData[],
    annexes: attachedData[],
    signature: any,
    csrf: string
  ) {
    const evidencePromises = evidences.map(
      (evidence) =>
        evidence.file &&
        this.registersService.uploadFileAndSaveId(
          evidence.file,
          csrf,
          'evidence',
          evidence
        ).catch((error) => {
          throw new Error(`Error al subir archivo de evidencia ${evidence.file && evidence.file.name}: ${error.message}`);
        })
    );

    const annexPromises = annexes.map(
      (annex) =>
        annex.file &&
        this.registersService.uploadFileAndSaveId(
          annex.file,
          csrf,
          'annex',
          annex
        ).catch((error) => {
          throw new Error(`Error al subir archivo de anexo ${annex.file && annex.file.name}: ${error.message}`);
        })
    );

    const signaturePromise = this.registersService.uploadFileAndSaveId(
      signature.file,
      csrf,
      'registry',
      signature
    ).catch((error) => {
      throw new Error(`Error al subir el archivo de firma: ${error.message}`);
    });

    await Promise.all([
      ...evidencePromises,
      ...annexPromises,
      signaturePromise,
    ]);
  }

  private async createAllEvidences(photoDataArray: PhotoData[], csrfToken: string) {
    const promises = photoDataArray.map((photoData) =>
      this.registersService.createEvidence(photoData, csrfToken, true).catch((error) => {
        console.error(`Error al crear evidencia ${photoData.name}:`, error.message);
        throw new Error(`Error al crear evidencia ${photoData.name}: ${error.message}`);
      })
    );

    await Promise.all(promises);

    console.log('Todas las evidencias han sido creadas correctamente');
  }

  private async createAllAnnex(annexDataArray: attachedData[], csrfToken: string) {
    const promises = annexDataArray.map((annexData) =>
      this.registersService.createAnnex(annexData, csrfToken, true).catch((error) => {
        console.error(`Error al crear anexo ${annexData.name}:`, error.message);
        throw new Error(`Error al crear anexo ${annexData.name}: ${error.message}`);
      })
    );

    await Promise.all(promises);

    console.log('Todos los anexos han sido creados correctamente');
  }

  private async createRegisterInServer(
    register: Register,
    evidences: PhotoData[],
    annexes: attachedData[],
    signatureFile: { file: File; idFile: string },
    csrfToken: string
  ) {
    const field_date = formatDateToRFC3339(register.date_created!);
    const payload: any = {
      data: {
        type: 'node--registry',
        attributes: {
          title: register.name || 'Registro Offline',
          field_date: field_date || formatDateToRFC3339(new Date()),
        },
        relationships: {
          field_activities: {
            data: {
              type: 'taxonomy_term--activities',
              id: register.activity_uuid,
            },
          },
          field_approach: {
            data: {
              type: 'taxonomy_term--approach',
              id: register.approach_uuid,
            },
          },
          field_sub_activities: {
            data: {
              type: 'taxonomy_term--sub_activities',
              id: register.subactivity_uuid,
            },
          },
          field_teacher: {
            data: {
              type: 'node--teacher',
              id: register.teacher_uuid,
            },
          },
          field_institution: {
            data: {
              type: 'node--offices',
              id: register.sede_uuid,
            },
          },
          field_signature: {
            data: {
              type: 'file--file',
              id: signatureFile.idFile,
            },
          },
        },
      },
    };

    if (evidences.length) {
      payload.data.relationships.field_evidence = {
        data: evidences.map((photo: PhotoData) => ({
          type: 'node--evidence',
          id: photo.idEvidence,
        })),
      };
    }

    if (annexes.length) {
      payload.data.relationships.field_annex = {
        data: annexes.map((attached: attachedData) => ({
          type: 'node--annex',
          id: attached.idAnnex,
        })),
      };
    }

    try {
      await firstValueFrom(this.registersService.createRegister(payload, csrfToken));
    } catch (error: any) {
      throw new Error(`Error al crear el registro en el servidor: ${error.message || error.error?.message || error}`);
    }
  }

  private async markRegisterAsSynced(register: Register) {
    try {
      register.is_synced = 1;
      await this.database.updateRegister(register);
    } catch (error: any) {
      throw new Error(`Error al marcar el registro como sincronizado: ${error.message || error}`);
    }
  }

  async showLoading(message: string) {
    if (!this.loading) {
      this.loading = await this.loadingController.create({
        message,
      });
      await this.loading.present();
    }
  }

  async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }

}
