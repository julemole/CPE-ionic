import { Component, EnvironmentInjector, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, documentAttach, save, createOutline } from 'ionicons/icons';
import { SaveInSessionService } from '../../shared/services/save-in-session.service';
import { attachedData, PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../registers/services/registers.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { base64ToBlob, blobToFile, saveFileInDevice } from 'src/app/shared/utils/functions';
import { ConnectivityService } from 'src/app/shared/services/connectivity.service';
import { Annex, Evidence, Register } from 'src/app/shared/models/entity.interface';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [RouterLinkWithHref, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  isOnline: WritableSignal<boolean> = signal(true);

  public environmentInjector = inject(EnvironmentInjector);
  institutionId: string = '';

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);
  signature: WritableSignal<string> = signal<string>('');
  registerPayload: WritableSignal<any> = signal<any>({});

  loading!: HTMLIonLoadingElement;


  constructor(private aRoute: ActivatedRoute, private saveInSessionService: SaveInSessionService, private registersService: RegistersService, private connectivityService: ConnectivityService,
     private router: Router, private localSS: LocalStorageService, private loadingController: LoadingController) {
    addIcons({camera,documentAttach,createOutline,save});
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.photoData = this.saveInSessionService.getPhotoData();
    this.attachedData = this.saveInSessionService.getAttachedData();
    this.signature = this.saveInSessionService.getSignature();
    this.registerPayload = this.saveInSessionService.getRegisterPayload();
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
  }

  async saveRegister() {
    const csrf_token = this.localSS.getItem('CSRF_TOKEN');
    const user_id = this.localSS.getItem('USER_ID');
    const signaturebase64 = this.signature();
    const signatureBlob = base64ToBlob(signaturebase64, 'image/png');
    const signatureFile = blobToFile(signatureBlob, 'signature.png');

    let signature = {
      idFile: '',
      file: signatureFile
    }

    let evidences: PhotoData[] = this.photoData();
    let annexes: attachedData[] = this.attachedData();

    this.showLoading();

    if(this.isOnline()){
      await this.uploadAllFiles(evidences, annexes, signature, csrf_token);
      await this.createAllEvidences(evidences, csrf_token);
      await this.createAllAnnex(annexes, csrf_token);

      const payload: any = {
        data: {
          type: 'node--registry',
          attributes: {
            title: 'Registro'
          },
          relationships: {
            field_activities: {
              data: {
                type: 'taxonomy_term--activities',
                id: this.registerPayload().activity
              }
            },
            field_approach: {
              data: {
                type: 'taxonomy_term--approach',
                id: this.registerPayload().approach
              }
            },
            field_sub_activities: {
              data: {
                type: 'taxonomy_term--sub_activities',
                id: this.registerPayload().subactivity
              }
            },
            field_sede: {
              data: {
                type: 'node--offices',
                id: this.institutionId
              }
            },
            field_signature: {
              data: {
                type: 'file--file',
                id: signature.idFile
              }
            }
          }
        }
      }

      if(evidences.length) {
        payload.data.relationships.field_evidence = {
          data: evidences.map((photo: PhotoData) => {
            return {
              type: 'node--evidence',
              id: photo.idEvidence
            }
          })
        }
      }

      if(annexes.length) {
        payload.data.relationships.field_annex = {
          data: annexes.map((attached: attachedData) => {
            return {
              type: 'node--annex',
              id: attached.idAnnex
            }
          })
        }
      }

      this.registersService.createRegister(payload, csrf_token).subscribe({
        next: async (resp: any) => {
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
            sede_uuid: this.institutionId,
            user_uuid: user_id,
            is_synced: 1,
            status: 1,
          }
          this.hideLoading();
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error(error);
          this.hideLoading();
        }
      })
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
          sede_uuid: this.institutionId,
          user_uuid: user_id,
          is_synced: 0,
          status: 1,
        }
        await this.createRegisterOffline(registerBody, evidences, annexes);
        this.hideLoading();
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Error al crear el registro:', error);
        this.hideLoading();
      }
    }
  }

  async uploadAllFiles(evidences: PhotoData[], annexes: attachedData[], signature: any, csrf: string) {
    const evidencePromises = evidences.map(evidence => evidence.file && this.registersService.uploadFileAndSaveId(evidence.file, csrf, 'evidence', evidence));
    const annexPromises = annexes.map(annex => annex.file && this.registersService.uploadFileAndSaveId(annex.file, csrf, 'annex', annex));
    const signaturePromise = this.registersService.uploadFileAndSaveId(signature.file, csrf, 'registry', signature);

    try {
      const results = await Promise.all([...evidencePromises, ...annexPromises, signaturePromise]);
      console.log('Todos los archivos han sido subidos:', results);
    } catch (error) {
      console.error('Error al subir los archivos:', error);
    }
  }

  async createAllEvidences(photoDataArray: PhotoData[], csrfToken: string)  {
    const promises = photoDataArray.map(photoData => this.registersService.createEvidence(photoData, csrfToken));

    try {
      const results = await Promise.all(promises);
      console.log('Todas las evidencias han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear las evidencias:', error);
    }
  }

  async createAllAnnex(annexDataArray: attachedData[], csrfToken: string)  {
    const promises = annexDataArray.map(annexData => this.registersService.createAnnex(annexData, csrfToken));

    try {
      const results = await Promise.all(promises);
      console.log('Todos los anexos han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear los anexos:', error);
    }
  }

  async createAllEvidencesOffline(photoDataArray: PhotoData[])  {
    const promises = photoDataArray.map( async (photoData) => {
      let filePath = '';
      if(photoData.file){
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
      }
      const result = await this.registersService.createEvidenceOffline(evidence);
      photoData.idEvidence = result.uuid;
    });

    try {
      const results = await Promise.all(promises);
      console.log('Todas las evidencias han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear las evidencias:', error);
    }
  }

  async createAllAnnexOffline(annexDataArray: attachedData[])  {
    const promises = annexDataArray.map( async (annexData) => {
      let filePath = '';
      if(annexData.file){
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
      }
      const result = await this.registersService.createAnnexOffline(annex);
      annexData.idAnnex = result.uuid;
    });

    try {
      const results = await Promise.all(promises);
      console.log('Todos los anexos han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear los anexos:', error);
    }
  }

  async createAllEvidenceToRegister(photoDataArray: PhotoData[], registerId: string) {
    const promises = photoDataArray.map( async (photoData) =>  await this.registersService.addEvidenceToRegister(registerId, photoData.idEvidence));
    try {
      const results = await Promise.all(promises);
      console.log('Todas las evidencias han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear las evidencias:', error);
    }
  }

  async createAllAnnexToRegister(annexDataArray: attachedData[], registerId: string) {
    const promises = annexDataArray.map( async (annexData) =>  await this.registersService.addAnnexToRegister(registerId, annexData.idAnnex));
    try {
      const results = await Promise.all(promises);
      console.log('Todos los anexos han sido creadas:', results);
    } catch (error) {
      console.error('Error al crear los anexos:', error);
    }
  }

  async createRegisterOffline(registerBody: Register, evidenceData: PhotoData[], annexData: attachedData[]) {
    try {
      const register = await this.registersService.createRegisterOffline(registerBody);
      if(register){
        await this.createAllEvidenceToRegister(evidenceData, register.uuid);
        await this.createAllAnnexToRegister(annexData, register.uuid);
      }
    } catch (error) {
      console.error('Error al crear el registro:', error);
      throw error;
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
}


