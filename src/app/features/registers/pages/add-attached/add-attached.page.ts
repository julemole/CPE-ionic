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
  IonTextarea,
  IonInput,
  IonButton,
  IonIcon,
  IonSelectOption,
  IonSelect,
  IonItem,
  IonLabel, IonImg, IonModal } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  documentAttachOutline,
  cloudUpload,
  scanCircleOutline, close } from 'ionicons/icons';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { getInfoFile, loadSignatureFile } from 'src/app/shared/utils/functions';
import { RegistersService } from '../../services/registers.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { CameraService } from 'src/app/shared/services/camera.service';
import { AlertController, Platform, LoadingController } from '@ionic/angular/standalone';
import { FileOpener, FileOpenerOptions } from '@capacitor-community/file-opener';
import { DomSanitizer } from '@angular/platform-browser';
import { Browser } from '@capacitor/browser';


@Component({
  selector: 'app-add-attached',
  templateUrl: './add-attached.page.html',
  styleUrls: ['./add-attached.page.scss'],
  standalone: true,
  imports: [IonModal, IonImg,
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
    IonTextarea,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class AddAttachedPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;
  loading: HTMLIonLoadingElement | null = null;

  fb: FormBuilder = inject(FormBuilder);
  attachedForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  color: FormControl = new FormControl('');

  file: File | null = null;
  scanImgSrc: string | null = null;
  originalImageData: any;
  loadFileSrc: string | any = '';
  annexLocalPath: string = '';
  institutionId: string = '';
  attachId: string = '';
  idRegister: string = '';
  isPreviewOpen = false;
  fileType: string = ''

  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  constructor(
    private aRoute: ActivatedRoute,
    private saveInSessionService: SaveInSessionService,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private cameraService: CameraService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private platform: Platform
  ) {
    addIcons({documentAttachOutline,cloudUpload,scanCircleOutline,close});
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.attachedData = this.saveInSessionService.getAttachedData();
  }

  async ngOnInit() {
    this.attachId = this.aRoute.snapshot.params['attachId'];
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if (this.attachId && !this.idRegister) {
      this.loadAttachedData();
    } else {
      this.scanImgSrc = '';
    }

    if (this.idRegister && this.attachId) {
      this.scanImgSrc = '';
      if(this.isOnline()){
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

  viewAnnex() {
    console.log(this.loadFileSrc)
    Browser.open({ url: this.loadFileSrc });
  }

  async getOfflineAnnex() {
    try {
      const annex = await this.registersService.getAnnexByIdOffline(this.attachId);
      console.log('anexoooooooooo', JSON.stringify(annex))
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
    if(this.platform.is('hybrid') && !this.isOnline()){
      try {
        const infoFile = await getInfoFile(this.annexLocalPath);

        const fileOpenerOptions: FileOpenerOptions = {
          filePath: this.annexLocalPath,
          contentType:  infoFile.mimeType,
          openWithDefault: true,
        };
        await FileOpener.open(fileOpenerOptions);
      } catch (error: any) {
        console.error(`Error al abrir el archivo: ${error.message || error.error?.message || error}`);
      }
    } else {
      Browser.open({ url: this.loadFileSrc });
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
      fileType: this.fileType,
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
        this.fileType = currentAttachedData.fileType!;
        this.loadFileSrc = currentAttachedData.url!;
        this.scanImgSrc = '';
      } else {
        this.fileType = currentAttachedData.fileType!;
        this.scanImgSrc = currentAttachedData.url!;
        this.loadFileSrc = '';
      }
      this.attachedForm.disable();
    }
  }

  async changeColor() {

    await this.showLoading();
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
    let input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    let file: File | null = input.files[0];
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      await this.alert('El archivo no debe pesar más de 10MB.');
      input.value = '';
      file = null;
      return;
    }

    if (file) {
      // Modificar el nombre del archivo
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const newFileName = this.isOnline() ? `ann.${fileExtension}` : `ann${timestamp}.${fileExtension}`;
      const newFile = new File([file], newFileName, { type: file.type });

      if (newFile.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 10MB.');
        input.value = '';
        file = null;
        return;
      }

      this.file = newFile;
      this.fileType = newFile.type.includes('pdf') ? 'pdf' : 'image';

      const fileUrl = URL.createObjectURL(newFile);
      this.loadFileSrc = fileUrl;
    }
  }

  openPreview() {
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
  }


  async scan() {
    const locationData = await this.cameraService.takePictureScan(this.isOnline());
    this.originalImageData = locationData;
    this.scanImgSrc = locationData.imagePath;
    const maxSizeInMB = 10;
    const file = locationData.file;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      await this.alert('El archivo no debe pesar más de 10MB.');
      return;
    }
    this.file = locationData.file;
    this.color.setValue('grayscale');
    await this.showLoading();
    this.convertImage('grayscale');
  }

  convertImage(filterType: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = this.scanImgSrc!;

    if (ctx) {
      img.onload = async () => {
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
            const timestamp = new Date().getTime();
            const filename = this.isOnline() ? 'ann.jpeg' : `ann${timestamp}.jpeg`;
            const newFile = new File([blob], filename, { type: 'image/jpeg' });
            this.file = newFile;

            // Actualizar la fuente de la imagen para mostrar la versión comprimida
            const compressedImageSrc = URL.createObjectURL(blob);
            this.scanImgSrc = compressedImageSrc;
          }
        }, 'image/jpeg', 0.8);
        await this.hideLoading();
      };
    }
  }

  resetImage() {
    this.scanImgSrc = this.originalImageData.imagePath;
    this.file = this.originalImageData.file;
    this.hideLoading();
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

  async showLoading() {
    if (!this.loading) {
      this.loading = await this.loadingController.create();
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
