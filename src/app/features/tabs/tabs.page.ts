import { Component, EnvironmentInjector, inject, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, LoadingController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, documentAttach, save, createOutline } from 'ionicons/icons';
import { SaveInSessionService } from '../../shared/services/save-in-session.service';
import { attachedData, PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../registers/services/registers.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { base64ToBlob, blobToFile } from 'src/app/shared/utils/functions';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [RouterLinkWithHref, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  institutionId: string = '';

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);
  signature: WritableSignal<string> = signal<string>('');
  registerPayload: WritableSignal<any> = signal<any>({});

  loading!: HTMLIonLoadingElement;


  constructor(private aRoute: ActivatedRoute, private saveInSessionService: SaveInSessionService, private registersService: RegistersService, private router: Router, private localSS: LocalStorageService, private loadingController: LoadingController) {
    addIcons({camera,documentAttach,createOutline,save});
    this.photoData = this.saveInSessionService.getPhotoData();
    this.attachedData = this.saveInSessionService.getAttachedData();
    this.signature = this.saveInSessionService.getSignature();
    this.registerPayload = this.saveInSessionService.getRegisterPayload();
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
  }

  async saveRegister() {
    const csrf_token = this.localSS.getItem('CSRF_TOKEN');
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
      next: (resp) => {
        this.hideLoading();
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(error);
        this.hideLoading();
      }
    })
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


