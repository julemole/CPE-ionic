import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonProgressBar,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonCol,
  IonRow,
  IonTextarea,
  IonThumbnail,
  IonInput,
  IonButton,
  IonIcon, IonImg } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { CameraService } from 'src/app/shared/services/camera.service';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { addIcons } from 'ionicons';
import { camera, cloudUpload, download } from 'ionicons/icons';
import { PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../../services/registers.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { getInfoFile, loadSignatureFile } from 'src/app/shared/utils/functions';
import { AlertController, Platform } from '@ionic/angular/standalone';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';

@Component({
  selector: 'app-add-photo',
  templateUrl: './add-photo.page.html',
  styleUrls: ['./add-photo.page.scss'],
  standalone: true,
  imports: [IonImg,
    IonIcon,
    IonButton,
    IonProgressBar,
    IonInput,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonThumbnail,
    IonGrid,
    IonCol,
    IonRow,
    IonTextarea,
    CommonModule,
    ReactiveFormsModule,
    RouterLinkWithHref,
  ],
})
export class AddPhotoPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;

  fb: FormBuilder = inject(FormBuilder);
  photoForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    date: [''],
    time: [''],
    latitude: [''],
    longitude: [''],
  });

  evidenceLocalPath: string = '';
  file: File | null = null;
  photoId: string = '';
  institutionId: string = '';
  idRegister: string = '';
  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  imageSrc: string | null = null;

  //controles
  get name() {
    return this.photoForm.get('name') as FormControl;
  }

  get description() {
    return this.photoForm.get('description') as FormControl;
  }

  constructor(
    private readonly aRoute: ActivatedRoute,
    private readonly cameraService: CameraService,
    private readonly saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private alertController: AlertController,
    private platform: Platform,
  ) {
    addIcons({ camera, cloudUpload, download });
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.photoData = this.saveInSessionService.getPhotoData();
  }

  async ngOnInit() {
    this.photoId = this.aRoute.snapshot.params['idPhoto'];
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if (this.photoId && !this.idRegister) {
      this.loadPhotoData();
    }

    if (this.idRegister && this.photoId) {
      // if(this.isOnline()){
      if(!this.platform.is('hybrid')) {
        this.isLoading = true;
        this.registersService.getEvidenceById(this.photoId).subscribe({
          next: (resp) => {
            this.photoForm.patchValue({
              name: resp.attributes.title,
              description: resp.attributes.field_description,
            });
            this.photoForm.disable();
            this.imageSrc = resp.fileUrl;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            console.error(error);
          },
        });
      } else {
        await this.getOfflineEvidence();
      }
    }
  }

  async getOfflineEvidence() {
    try {
      const evidence = await this.registersService.getEvidenceByIdOffline(this.photoId);
      if(evidence) {
        this.photoForm.patchValue({
          name: evidence.name,
          description: evidence.description,
        });
        this.photoForm.disable();
        this.evidenceLocalPath = evidence.file!;
        this.imageSrc = await loadSignatureFile(evidence.file!);
      }
    } catch (error) {
      throw new Error('Error al obtener la evidencia');
    }
  }

  async openFile() {
    try {
      const infoFile = await getInfoFile(this.evidenceLocalPath);

      const fileOpenerOptions: FileOpenerOptions = {
        filePath: this.evidenceLocalPath,
        contentType:  infoFile.mimeType,
        openWithDefault: true,
      };
      await FileOpener.open(fileOpenerOptions);
    } catch (error) {
      console.error('Error al abrir el archivo:', JSON.stringify(error));
    }
  }

  async captureImage() {
    const locationData = await this.cameraService.takePictureAndGetData();
    this.imageSrc = locationData.imagePath;
    const maxSizeInMB = 2;
    const file = locationData.file;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      await this.alert('El archivo no debe pesar más de 2MB.');
      return;
    }
    this.file = locationData.file;
    this.photoForm.patchValue({
      date: locationData.date,
      time: locationData.time,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      const maxSizeInMB = 2;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 2MB.');
        return;
      }
      this.file = file;
      const reader = new FileReader();
      reader.onload = async () => {
        this.imageSrc = reader.result as string;
        const locationData = await this.cameraService.getLocationForImage(
          this.imageSrc
        );
        this.photoForm.patchValue({
          date: locationData.date,
          time: locationData.time,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  savePhoto(): void {
    if (this.photoForm.invalid) {
      this.photoForm.markAllAsTouched();
      return;
    }

    const currentPhotoData = this.photoData();
    const nextId = currentPhotoData.length
      ? currentPhotoData[currentPhotoData.length - 1].id + 1
      : 1;

    const { name, description, date, time, latitude, longitude } =
      this.photoForm.getRawValue();

    const photoData = {
      id: nextId,
      name,
      description,
      date,
      time,
      latitude,
      longitude,
      url: this.imageSrc,
      file: this.file,
    };

    this.saveInSessionService.savePhotoData(
      photoData,
      `/registers/add/select-institution/${this.institutionId}`
    );
  }

  loadPhotoData() {
    const photoData = this.photoData();
    const currentPhotoData = photoData.find(
      (photo: PhotoData) => photo.id === Number(this.photoId)
    );
    if (currentPhotoData) {
      this.photoForm.patchValue(currentPhotoData);
      this.imageSrc = currentPhotoData.url;
      this.photoForm.disable();
    }
  }

  async alert(message: string) {
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


