import { firstValueFrom } from 'rxjs';
import { Component, effect, signal, WritableSignal } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast, AlertController, Platform, LoadingController } from '@ionic/angular/standalone';
import { DatabaseService } from './shared/services/database.service';
import { ConnectivityService } from './shared/services/connectivity.service';
import { Annex, Evidence, Register, RegisterAnnex, RegisterEvidence } from './shared/models/entity.interface';
import { LocalStorageService } from './core/services/local-storage.service';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { addIcons } from 'ionicons';
import { wifiOutline } from 'ionicons/icons';
import { base64ToBlob, blobToFile, getInfoFile } from './shared/utils/functions';
import { RegistersService } from './features/registers/services/registers.service';
import { attachedData, PhotoData } from './shared/models/save-in-session.interface';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonToast, IonRouterOutlet],
})
export class AppComponent {
  isOnline: WritableSignal<boolean> = signal(true);
  loading: HTMLIonLoadingElement | null = null;
  // toastMsg: string = '';
  // isOpen: boolean = false;
  // private firstCheck: boolean = true;
  // private wasOffline: boolean = false;

  constructor(private router: Router, private readonly database: DatabaseService, private connectivityService: ConnectivityService, private localSS: LocalStorageService,
    private alertController: AlertController, private platform: Platform, private loadingController: LoadingController, private registersService: RegistersService
  ) {
    this.isOnline = this.connectivityService.getNetworkStatus();
    addIcons({wifiOutline})
    this.initApp();
    // effect(() => {
    //   this.isOnline();
    //   if (!this.isOnline() && !this.wasOffline) {
    //     this.toastMsg = 'Sin conexión a internet';
    //     this.isOpen = true;
    //     this.wasOffline = true;
    //   } else if (this.isOnline() && this.wasOffline) {
    //     this.toastMsg = 'Conexión a internet restaurada';
    //     this.isOpen = true;
    //     this.wasOffline = false;
    //   } else {
    //     this.toastMsg = '';
    //     this.isOpen = false;
    //   }

    //   if (this.firstCheck) {
    //     this.firstCheck = false;
    //     this.isOpen = false;
    //   }
    // });

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

      if(unsyncedRegisters.length){
        const csrf_token = this.localSS.getItem('CSRF_TOKEN');
        if(!csrf_token){
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
          await this.syncSingleRegister(register, csrf_token);
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


    } catch (error) {
      console.error('Error al sincronizar registros offline:', error);
    }
  }

  private async syncSingleRegister(register: Register, csrfToken: string) {
    try {

      // Convertir firma local a File
      let signatureFile = await this.convertLocalFileToFile(register.signature_file!);
      let signatureObj = { file: signatureFile, idFile: '' };

      // Subir archivos: evidencias, anexos y firma
      let evidences = await this.convertLocalEvidenceFiles(register.evidenceList!);
      let annexes = await this.convertLocalAnnexFiles(register.annexList!);

      // Subir todos los archivos al servidor y obtener sus ids
      await this.uploadAllFiles(evidences, annexes, signatureObj, csrfToken);

      // Crear evidencias y anexos en el servidor
      await this.createAllEvidences(evidences, csrfToken);
      await this.createAllAnnex(annexes, csrfToken);

      // Crear el registro completo en el servidor
      await this.createRegisterInServer(register, evidences, annexes, signatureObj, csrfToken);

      // Marcar el registro como sincronizado en la base de datos local
      await this.markRegisterAsSynced(register);

      console.log(`Registro ${register.uuid} sincronizado correctamente.`);
    } catch (error) {
      console.error(`Error al sincronizar el registro ${register.uuid}:`, error);
    }
  }

  private async convertLocalFileToFile(filePath: string): Promise<File> {
    const fileInfo = await getInfoFile(filePath);
    const blob = base64ToBlob(fileInfo.file, fileInfo.mimeType);
    return blobToFile(blob, fileInfo.name);
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
        )
    );
    const annexPromises = annexes.map(
      (annex) =>
        annex.file &&
        this.registersService.uploadFileAndSaveId(
          annex.file,
          csrf,
          'annex',
          annex
        )
    );
    const signaturePromise = this.registersService.uploadFileAndSaveId(
      signature.file,
      csrf,
      'registry',
      signature
    );

    try {
      const results = await Promise.all([
        ...evidencePromises,
        ...annexPromises,
        signaturePromise,
      ]);
      console.log('Todos los archivos han sido subidos:', results);
    } catch (error) {
      console.error('Error al subir los archivos:', error);
    }
  }

  private async createAllEvidences(photoDataArray: PhotoData[], csrfToken: string) {
    const promises = photoDataArray.map((photoData) =>
      this.registersService.createEvidence(photoData, csrfToken, true)
    );

    try {
      const results = await Promise.all(promises);
      console.log('Todas las evidencias han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear las evidencias:', error);
    }
  }

  private async createAllAnnex(annexDataArray: attachedData[], csrfToken: string) {
    const promises = annexDataArray.map((annexData) =>
      this.registersService.createAnnex(annexData, csrfToken, true)
    );

    try {
      const results = await Promise.all(promises);
      console.log('Todos los anexos han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear los anexos:', error);
    }
  }

  private async createRegisterInServer(
    register: Register,
    evidences: PhotoData[],
    annexes: attachedData[],
    signatureFile: { file: File; idFile: string },
    csrfToken: string
  ) {
    const payload: any = {
      data: {
        type: 'node--registry',
        attributes: {
          title: register.name || 'Registro Offline',
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
          field_sede: {
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
        data: evidences.map((photo: PhotoData) => {
          return {
            type: 'node--evidence',
            id: photo.idEvidence,
          };
        }),
      };
    }

    if (annexes.length) {
      payload.data.relationships.field_annex = {
        data: annexes.map((attached: attachedData) => {
          return {
            type: 'node--annex',
            id: attached.idAnnex,
          };
        }),
      };
    }

    try {
      await firstValueFrom(this.registersService.createRegister(payload, csrfToken));
    } catch (error) {
      console.error('Error al crear el registro en el servidor:', error);
      throw error;
    }
  }

  private async markRegisterAsSynced(register: Register) {
    try {
      register.is_synced = 1;
      await this.database.updateRegister(register);
    } catch (error) {
      console.error('Error al marcar el registro como sincronizado:', error);
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
