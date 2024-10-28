import { attachedData } from './../../../../shared/models/save-in-session.interface';
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
  IonInput,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel, IonImg } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  documentAttachOutline,
  cloudUpload,
  scanCircleOutline,
} from 'ionicons/icons';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { getInfoFile, loadSignatureFile } from 'src/app/shared/utils/functions';
import { RegistersService } from '../../services/registers.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { CameraService } from 'src/app/shared/services/camera.service';
import { AlertController, Platform } from '@ionic/angular/standalone';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';


@Component({
  selector: 'app-add-attached',
  templateUrl: './add-attached.page.html',
  styleUrls: ['./add-attached.page.scss'],
  standalone: true,
  imports: [IonImg,
    IonItem,
    IonProgressBar,
    IonLabel,
    IonIcon,
    IonButton,
    IonInput,
    IonContent,
    IonHeader,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonGrid,
    IonCol,
    IonRow,
    IonTextarea,
    CommonModule,
    ReactiveFormsModule,
    RouterLinkWithHref,
  ],
})
export class AddAttachedPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;

  fb: FormBuilder = inject(FormBuilder);
  attachedForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  color: FormControl = new FormControl('');

  file: File | null = null;
  scanImgSrc: string | null = null;
  originalImageData: any;
  loadFileSrc: string = '';
  annexLocalPath: string = '';
  institutionId: string = '';
  attachId: string = '';
  idRegister: string = '';

  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  constructor(
    private aRoute: ActivatedRoute,
    private saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private cameraService: CameraService,
    private alertController: AlertController,
    private platform: Platform
  ) {
    addIcons({ documentAttachOutline, cloudUpload, scanCircleOutline });
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.attachedData = this.saveInSessionService.getAttachedData();
  }

  async ngOnInit() {
    this.attachId = this.aRoute.snapshot.params['attachId'];
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if (this.attachId) {
      this.loadAttachedData();
    } else {
      this.scanImgSrc = '';
    }

    if (this.idRegister && this.attachId) {
      this.scanImgSrc = '';
      // if(this.isOnline()){
      if(!this.platform.is('hybrid')){
        this.isLoading = true;
        this.scanImgSrc = '';
        this.registersService.getAnnexById(this.attachId).subscribe({
          next: (resp) => {
            this.attachedForm.patchValue({
              name: resp.attributes.title,
              description: resp.attributes.field_description,
            });
            this.attachedForm.disable();
            this.loadFileSrc = resp.fileUrl;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            console.error(error);
          },
        });
      } else {
        this.scanImgSrc = '';
        await this.getOfflineAnnex();
      }
    }
  }

  async getOfflineAnnex() {
    try {
      const annex = await this.registersService.getAnnexByIdOffline(this.attachId);
      if (annex) {
        this.attachedForm.patchValue({
          name: annex.name,
          description: annex.description,
        });
        this.attachedForm.disable();
        this.annexLocalPath = annex.file!;
        const file = await loadSignatureFile(annex.file!);
        this.loadFileSrc = file!;
      }
    } catch (error) {
      console.error(error);
    }
  }

  async openFile() {
    try {
      const infoFile = await getInfoFile(this.annexLocalPath);

      const fileOpenerOptions: FileOpenerOptions = {
        filePath: this.annexLocalPath,
        contentType:  infoFile.mimeType,
        openWithDefault: true,
      };
      await FileOpener.open(fileOpenerOptions);
    } catch (error) {
      console.error('Error al abrir el archivo:', JSON.stringify(error));
    }
  }

  saveAttached() {
    if (this.attachedForm.invalid) {
      this.attachedForm.markAllAsTouched();
      return;
    }

    const currentAttachedData = this.attachedData();
    const nextId = currentAttachedData.length
      ? currentAttachedData[currentAttachedData.length - 1].id + 1
      : 1;

    const { name, description } = this.attachedForm.getRawValue();

    const attachedData = {
      id: nextId,
      name,
      description,
      file: this.file,
      url: this.loadFileSrc || this.scanImgSrc,
      urlType: this.loadFileSrc ? 'doc' : 'img',
    };

    this.saveInSessionService.saveAttachedData(
      attachedData,
      `/registers/add/select-institution/${this.institutionId}`
    );
  }

  loadAttachedData() {
    const attachedData = this.attachedData();
    const currentAttachedData = attachedData.find(
      (photo: attachedData) => photo.id === Number(this.attachId)
    );
    if (currentAttachedData) {
      this.attachedForm.patchValue(currentAttachedData);
      if (currentAttachedData.urlType === 'doc') {
        this.loadFileSrc = currentAttachedData.url!;
        this.scanImgSrc = '';
      } else {
        this.scanImgSrc = currentAttachedData.url!;
        this.loadFileSrc = '';
      }
      this.attachedForm.disable();
    }
  }

  changeColor() {
    if (this.color.value == 'grayscale') {
      this.convertImage('grayscale');
    }

    if (this.color.value == 'sepia') {
      this.convertImage('sepia');
    }

    if (this.color.value == 'color') {
      this.resetImage();
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];

    const maxSizeInMB = 2;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      await this.alert('El archivo no debe pesar más de 2MB.');
      return;
    }

    if (file) {
      this.file = file;
      const fileUrl = URL.createObjectURL(file);
      this.loadFileSrc = fileUrl;
    }
  }


  async scan() {
    const locationData = await this.cameraService.takePictureAndGetData();
    this.originalImageData = locationData;
    this.scanImgSrc = locationData.imagePath;
    const maxSizeInMB = 2;
    const file = locationData.file;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      await this.alert('El archivo no debe pesar más de 2MB.');
      return;
    }
    this.file = locationData.file;
    this.color.setValue('grayscale');
    this.convertImage('grayscale');
  }

  convertImage(filterType: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = this.scanImgSrc!;

    if (ctx) {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Aplicar filtro seleccionado
        switch (filterType) {
          case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = avg; // Red
              data[i + 1] = avg; // Green
              data[i + 2] = avg; // Blue
            }
            break;
          case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              data[i] = r * 0.393 + g * 0.769 + b * 0.189; // Red
              data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168; // Green
              data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131; // Blue
            }
            break;
          // Agrega más filtros aquí según sea necesario
          default:
            break;
        }

        ctx.putImageData(imageData, 0, 0);

        // Comprimir la imagen a JPEG con calidad ajustada
        canvas.toBlob((blob) => {
          if (blob && this.file) {
            const newFile = new File([blob], this.file.name, { type: 'image/jpeg' });
            this.file = newFile;

            // Actualizar la fuente de la imagen para mostrar la versión comprimida
            const compressedImageSrc = URL.createObjectURL(blob);
            this.scanImgSrc = compressedImageSrc;
          }
        }, 'image/jpeg', 0.8); // Aquí puedes ajustar la calidad: 0.8 es un buen equilibrio entre calidad y tamaño.
      };
    }
  }

  resetImage() {
    this.scanImgSrc = this.originalImageData.imagePath;
    this.file = this.originalImageData.file;
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
