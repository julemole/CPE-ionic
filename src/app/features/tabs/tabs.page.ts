import {
  Component,
  EnvironmentInjector,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  LoadingController,
  AlertController,
  Platform} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, cameraOutline, clipboardOutline, saveOutline } from 'ionicons/icons';
import { SaveInSessionService } from '../../shared/services/save-in-session.service';
import {
  attachedData,
  PhotoData,
} from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../registers/services/registers.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import {
  base64ToBlob,
  blobToFile,
  formatDateToRFC3339,
  saveFileInDevice,
} from 'src/app/shared/utils/functions';
import { ConnectivityService } from 'src/app/shared/services/connectivity.service';
import {
  Annex,
  Evidence,
  Register,
} from 'src/app/shared/models/entity.interface';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    RouterLinkWithHref,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
})
export class TabsPage {
  isOnline: WritableSignal<boolean> = signal(true);
  error: string = '';

  public environmentInjector = inject(EnvironmentInjector);
  institutionId: string = '';

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);
  signature: WritableSignal<string> = signal<string>('');
  registerPayload: WritableSignal<any> = signal<any>({});
  origIdInstitution: WritableSignal<string> = signal<string>('');

  loading!: HTMLIonLoadingElement;

  constructor(
    private aRoute: ActivatedRoute,
    private saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private router: Router,
    private localSS: LocalStorageService,
    private loadingController: LoadingController,
    private platform: Platform,
    private alertController: AlertController,
  ) {
    addIcons({cameraOutline,clipboardOutline,createOutline,saveOutline});
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.photoData = this.saveInSessionService.getPhotoData();
    this.attachedData = this.saveInSessionService.getAttachedData();
    this.signature = this.saveInSessionService.getSignature();
    this.registerPayload = this.saveInSessionService.getRegisterPayload();
    this.origIdInstitution = this.saveInSessionService.getOrigIdInstitution();
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
  }

  async saveRegister() {
    const csrf_token = this.localSS.getItem('CSRF_TOKEN');
    const user_id = this.localSS.getItem('USER_ID');
    const signaturebase64 = this.signature();
    const signatureBlob = base64ToBlob(signaturebase64, 'image/png');
    const timestamp = new Date().getTime();
    const uniqueFileName = this.isOnline() ? `sign.png` : `sign${timestamp}.png`;
    const signatureFile = blobToFile(signatureBlob, uniqueFileName);

    let signature = {
      idFile: '',
      file: signatureFile,
    };

    let evidences: PhotoData[] = this.photoData();
    let annexes: attachedData[] = this.attachedData();

    this.showLoading();

    if (this.isOnline()) {
      try {
        await this.uploadAllFiles(evidences, annexes, signature, csrf_token);
        await this.createAllEvidences(evidences, csrf_token);
        await this.createAllAnnex(annexes, csrf_token);

        const field_date = formatDateToRFC3339(new Date());
        const payload: any = {
          data: {
            type: 'node--registry',
            attributes: {
              title: 'Registro',
              field_date
            },
            relationships: {
              field_activities: {
                data: {
                  type: 'taxonomy_term--activities',
                  id: this.registerPayload().activity,
                },
              },
              field_approach: {
                data: {
                  type: 'taxonomy_term--approach',
                  id: this.registerPayload().approach,
                },
              },
              field_sub_activities: {
                data: {
                  type: 'taxonomy_term--sub_activities',
                  id: this.registerPayload().subactivity,
                },
              },
              field_teacher: {
                data: {
                  type: 'node--teacher',
                  id: this.institutionId,
                },
              },
              field_institution: {
                data: {
                  type: 'node--offices',
                  id: this.origIdInstitution(),
                },
              },
              field_signature: {
                data: {
                  type: 'file--file',
                  id: signature.idFile,
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

        this.registersService.createRegister(payload, csrf_token).subscribe({
          next: async (resp: any) => {
            if (this.platform.is('hybrid')) {
              const data = resp.data;
              const filePath = await saveFileInDevice(signature.file);
              const registerBody: Register = {
                uuid: data.id,
                name: data.attributes.title,
                date_created: data.attributes.created,
                signature_file: filePath,
                approach_uuid: this.registerPayload().approach,
                activity_uuid: this.registerPayload().activity,
                subactivity_uuid: this.registerPayload().subactivity,
                teacher_uuid: this.institutionId,
                sede_uuid: this.origIdInstitution(),
                user_uuid: user_id,
                is_synced: 1,
                status: 1,
              };
              await this.createRegisterOffline(registerBody, evidences, annexes, 1);
            }
            this.saveInSessionService.cleanAllData();
            this.hideLoading();
            this.router.navigate(['/home']);
          },
          error: async (error: any) => {
            this.hideLoading();
            await this.errorAlert(`Error al crear el registro: ${error.message || error.error?.message || error}`);
          },
        });
      } catch (error: any) {
        this.hideLoading();
        await this.errorAlert(`Error al crear el registro: ${error.message || error.error?.message || error}`);
      }
    } else {
      try {
        await this.createAllEvidencesOffline(evidences);
        await this.createAllAnnexOffline(annexes);
        const filePath = await saveFileInDevice(signature.file);
        const registerBody: Register = {
          uuid: '',
          name: 'Registro',
          date_created: new Date().toISOString(),
          signature_file: filePath,
          approach_uuid: this.registerPayload().approach,
          activity_uuid: this.registerPayload().activity,
          subactivity_uuid: this.registerPayload().subactivity,
          teacher_uuid: this.institutionId,
          sede_uuid: this.origIdInstitution(),
          user_uuid: user_id,
          is_synced: 0,
          status: 1,
        };
        await this.createRegisterOffline(registerBody, evidences, annexes, 0);
        this.saveInSessionService.cleanAllData();
        this.hideLoading();
        this.router.navigate(['/home']);
      } catch (error: any) {
        this.hideLoading();
        await this.errorAlert(`Error al crear el registro offline: ${error.message || error.error?.message || error}`);
      }
    }
  }

  async uploadAllFiles(
    evidences: PhotoData[],
    annexes: attachedData[],
    signature: any,
    csrf: string
  ) {
    const originalEvidencePromises = evidences.map(
      (evidence) =>
        evidence.originalFile &&
        this.registersService.uploadFileAndSaveId(
          evidence.originalFile,
          csrf,
          'original_evidence',
          evidence
        )
    )

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
      // Intentamos cargar todos los archivos
      const results = await Promise.all([
        ...originalEvidencePromises,
        ...evidencePromises,
        ...annexPromises,
        signaturePromise,
      ]);
      return results; // Devuelve los resultados en caso de éxito
    } catch (error: any) {
      throw new Error(`Error al subir archivos: ${error.message || error.error?.message || error}`);
    }
  }

  async createAllEvidences(photoDataArray: PhotoData[], csrfToken: string) {
    const promises = photoDataArray.map((photoData) =>
      this.registersService.createEvidence(photoData, csrfToken)
        .catch(error => {
          console.error(`Error al crear evidencia ${photoData.name}:`, error.message);
          throw new Error(`Error al crear evidencia ${photoData.name}: ${error.message}`);
        })
    );

    try {
      const results = await Promise.all(promises); // Si una promesa falla, todas fallarán
      return results;
    } catch (error: any) {
      throw new Error(`Error al crear las evidencias: ${error.message || error}`);
    }
  }

  async createAllAnnex(annexDataArray: attachedData[], csrfToken: string) {
    const promises = annexDataArray.map((annexData) =>
      this.registersService.createAnnex(annexData, csrfToken)
        .catch(error => {
          console.error(`Error al crear anexo ${annexData.name}:`, error.message);
          throw new Error(`Error al crear anexo ${annexData.name}: ${error.message}`);
        })
    );

    try {
      const results = await Promise.all(promises);
      console.log('Todos los anexos han sido creados:', results);
      return results;
    } catch (error: any) {
      throw new Error(`Error al crear todos los anexos: ${error.message || error}`);
    }
  }

  async createAllEvidencesOffline(photoDataArray: PhotoData[]) {
    const promises = photoDataArray.map(async (photoData) => {
      let filePath = '';
      if (photoData.file) {
        filePath = await saveFileInDevice(photoData.file);
      }
      const evidence: Evidence = {
        uuid: '',
        name: photoData.name,
        description: photoData.description,
        date_created: photoData.date,
        time_created: photoData.time,
        latitude: photoData.latitude,
        longitude: photoData.longitude,
        file: filePath,
        is_synced: 0,
        status: 1,
      };
      return this.registersService.createEvidenceOffline(evidence)
        .then((result) => {
          photoData.idEvidence = result.uuid;
          return result;
        })
        .catch(error => {
          console.error(`Error al crear evidencia offline ${photoData.name}:`, error.message);
          throw new Error(`Error al crear evidencia offline ${photoData.name}: ${error.message}`);
        });
    });

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error: any) {
      throw new Error(`Error al crear todas las evidencias offline: ${error.message || error}`);
    }
  }

  async createAllAnnexOffline(annexDataArray: attachedData[]) {
    const promises = annexDataArray.map(async (annexData) => {
      let filePath = '';
      if (annexData.file) {
        filePath = await saveFileInDevice(annexData.file);
      }
      const annex: Annex = {
        uuid: '',
        name: annexData.name,
        description: annexData.description,
        date_created: new Date().toISOString(),
        file: filePath,
        is_synced: 0,
        status: 1,
      };
      return this.registersService.createAnnexOffline(annex)
        .then((result) => {
          annexData.idAnnex = result.uuid;
          return result;
        })
        .catch(error => {
          console.error(`Error al crear anexo offline ${annexData.name}:`, error.message);
          throw new Error(`Error al crear anexo offline ${annexData.name}: ${error.message}`);
        });
    });

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error: any) {
      throw new Error(`Error al crear todos los anexos offline: ${error.message || error}`);
    }
  }

  async createAllEvidenceToRegister(
    photoDataArray: PhotoData[],
    registerId: string,
    is_synced: number
  ) {
    const promises = photoDataArray.map((photoData) =>
      this.registersService.addEvidenceToRegister(registerId, photoData.idEvidence, is_synced)
        .catch(error => {
          console.error(`Error al agregar evidencia ${photoData.idEvidence} al registro ${registerId}:`, error.message);
          throw new Error(`Error al agregar evidencia ${photoData.idEvidence} al registro: ${error.message}`);
        })
    );

    try {
      const results = await Promise.all(promises);
      console.log('Todas las evidencias han sido agregadas al registro:', results);
      return results;
    } catch (error: any) {
      throw new Error(`Error al agregar todas las evidencias al registro: ${error.message || error}`);
    }
  }

  async createAllAnnexToRegister(
    annexDataArray: attachedData[],
    registerId: string,
    is_synced: number
  ) {
    const promises = annexDataArray.map((annexData) =>
      this.registersService.addAnnexToRegister(registerId, annexData.idAnnex, is_synced)
        .catch(error => {
          console.error(`Error al agregar anexo ${annexData.idAnnex} al registro ${registerId}:`, error.message);
          throw new Error(`Error al agregar anexo ${annexData.idAnnex} al registro: ${error.message}`);
        })
    );

    try {
      const results = await Promise.all(promises);
      return results;
    } catch (error: any) {
      throw new Error(`Error al agregar todos los anexos al registro: ${error.message || error}`);
    }
  }

  async createRegisterOffline(
    registerBody: Register,
    evidenceData: PhotoData[],
    annexData: attachedData[],
    synced_relations: number
  ) {
    try {
      const register = await this.registersService.createRegisterOffline(registerBody);
      if (register) {
        await this.createAllEvidenceToRegister(evidenceData, register.uuid, synced_relations);
        await this.createAllAnnexToRegister(annexData, register.uuid, synced_relations);
      }
    } catch (error: any) {
      throw new Error(`Error al crear el registro offline o al agregar evidencias/anexos: ${error.message || error}`);
    }
  }

  async showLoading() {
    this.loading = await this.loadingController.create({
      message: 'Creando registro...',
      spinner: 'crescent',
      translucent: true,
    });
    await this.loading.present();
  }

  async hideLoading() {
    await this.loading.dismiss();
  }

  async errorAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message,
      buttons: [
        {
          text: 'Ok',
        },
      ],
    });

    await alert.present();
  }
}
