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
  IonThumbnail,
  IonInput,
  IonButton,
  IonIcon, IonImg } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { CameraService } from 'src/app/shared/services/camera.service';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { addIcons } from 'ionicons';
import { camera, cloudUpload, download } from 'ionicons/icons';
import { PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../../services/registers.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { blobToFile, loadSignatureFile } from 'src/app/shared/utils/functions';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import heic2any from 'heic2any';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
const piexif = require('piexifjs');

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
    IonTextarea,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class AddPhotoPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;
  loading: HTMLIonLoadingElement | null = null;

  fb: FormBuilder = inject(FormBuilder);
  photoForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    date: [''],
    time: [''],
    latitude: [''],
    longitude: [''],
  });

  file: File | null = null;
  originalFile: File | null = null;
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
    private alertController: AlertController,
    private loadingController: LoadingController,
    private registersService: RegistersService,
    private connectivityService: ConnectivityService,
    private localSS: LocalStorageService
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
      if(this.isOnline()){
        this.isLoading = true;
        this.registersService.getEvidenceById(this.photoId).subscribe({
          next: async (resp) => {
            this.photoForm.patchValue({
              name: resp.attributes.title,
              description: resp.attributes.field_description,
            });
            this.photoForm.disable();
            this.imageSrc = resp.fileUrl;
            this.isLoading = false;

            if(!resp.attributes.field_has_metadata){
              try{
                await this.showLoading();
                await this.updateEvidenceImg(resp);
              } catch (error: any) {
                await this.alert(`Error al actualizar la imagen: ${error.message || error.error?.message || error}`);
              }
            }
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

  async updateEvidenceImg(evidence: any) {
    try {
      if(evidence && evidence.id){
        const csrf_token = this.localSS.getItem('CSRF_TOKEN');
        const response = await fetch(evidence.fileUrl);
        const blob = await response.blob();
        const newImg = await this.cameraService.addTextToImage(blob, evidence.attributes.field_latitude, evidence.attributes.field_longitude, evidence.attributes.field_evidence_date, evidence.attributes.field_evidence_time);
        const newBlob = await fetch(newImg).then(res => res.blob());

        const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 15); // Formato YYYYMMDD_HHMMSS
        const fileName = `image_${timestamp}.jpg`;
        // Convertir a archivo final
        let file = blobToFile(newBlob, fileName);

        // const base64Image = await this.fileToBase64(file);
        // const exifObj: any = {
        //     '0th': {},
        //     GPS: {},
        //     Exif: {},
        // };

        // // Validar ubicación
        // if (evidence.attributes.field_latitude && evidence.attributes.field_longitude) {
        //   exifObj.GPS[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(evidence.attributes.field_latitude);
        //   exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = evidence.attributes.field_latitude >= 0 ? 'N' : 'S';
        //   exifObj.GPS[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(evidence.attributes.field_longitude);
        //   exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = evidence.attributes.field_longitude >= 0 ? 'E' : 'W';
        // }

        // // Validar fecha y hora
        // if (evidence.attributes.field_evidence_date && evidence.attributes.field_evidence_time) {
        //   const dateTime = `${evidence.attributes.field_evidence_date.replace(/-/g, ':')} ${evidence.attributes.field_evidence_time}`;
        //   exifObj.Exif[piexif.ExifIFD.DateTimeOriginal] = dateTime; // Fecha y hora de captura
        //   exifObj["0th"][piexif.ImageIFD.DateTime] = dateTime; // Fecha y hora general
        // }

        // const exifBytes = piexif.dump(exifObj);
        // const processedImage = piexif.insert(exifBytes, base64Image);

        // // Convertir la imagen procesada a un archivo Blob y actualizar el estado
        // const processedBlob = this.base64ToBlob(processedImage, 'image/jpeg');
        // file = new File([processedBlob], file.name, { type: 'image/jpeg' });

        const objFile: any = { file, idFile: '' };
        const image = await this.registersService.uploadFileAndSaveId(file, csrf_token, 'evidence', objFile)
        objFile.idFile = image.id;

        const payload = {
          data: {
            type: 'node--evidence',
            id: evidence.id,
            attributes: {
              field_has_metadata: true
            },
            relationships: {
              field_file: {
                data: {
                  type: 'file--file',
                  id: objFile.idFile
                }
              }
            }
          }
        };

        const evidenceUpdated = await this.registersService.updateEvidence(evidence.id, payload);

        this.registersService.getEvidenceById(this.photoId).subscribe({
          next: async (resp) => {
            this.imageSrc = resp.fileUrl;
            await this.hideLoading();
          },
          error: async (error) => {
            this.isLoading = false;
            console.error(error);
            await this.hideLoading();
          },
        });

      }
    } catch (error: any) {
      await this.hideLoading();
      throw new Error(`Error al obtener la imagen de la evidencia: ${error.message || error.error || error}`);
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
        this.imageSrc = await loadSignatureFile(evidence.file!);
      }
    } catch (error) {
      throw new Error('Error al obtener la evidencia');
    }
  }

  async downloadWithBrowser() {
    if(!this.isOnline()){
      await this.alert('No se puede descargar la imagen sin conexión a internet.');
      return;
    }
    try {
      await Browser.open({ url: this.imageSrc! });
    } catch (error) {
      throw new Error('No se pudo abrir el navegador para descargar la imagen.');
    }
  }

  async captureImage() {
    try {
      await this.showLoading();

      const locationData = await this.cameraService.takePictureAndGetData();

      if (!locationData) {
        throw new Error('Imagen no capturada.');
      }

      this.imageSrc = locationData.imagePath;
      const maxSizeInMB = 10;
      const file = locationData.file;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 10MB.');
        return;
      }

      this.file = file;
      this.photoForm.patchValue({
        date: locationData.date,
        time: locationData.time,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
    } catch (error: any) {
      console.error('Error en la captura de imagen:', error);
      await this.alert(error.message || 'Ocurrió un error al capturar la imagen.');
      // Puedes mostrar un mensaje al usuario si es necesario
    } finally {
      await this.hideLoading(); // Ocultar el loader pase lo que pase
    }
  }

  async onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    let file: File = input.files[0];

    // Comprobar el tipo de archivo y permitir solo tipos de imagen
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
    if (!allowedImageTypes.includes(file.type)) {
        await this.alert('Por favor, selecciona solo archivos de imagen (JPG, PNG, GIF, WEBP o HEIC).');
        return;
    }

    // Validar el tamaño del archivo
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 10MB.');
        return;
    }

    try {
      await this.showLoading();

      // Convertir el archivo HEIC a JPEG si es necesario para renderizar
      if (file.type === 'image/heic') {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
        file = new File([convertedBlob as Blob], file.name.replace(/\.heic$/, '.jpeg'), { type: 'image/jpeg' });
      }

      this.originalFile = file;

      const fileUrl = URL.createObjectURL(file);
      const locationData = await this.cameraService.getLocationForImage(fileUrl);

      if (!locationData) {
        throw new Error('No se pudieron obtener los datos de ubicación.');
      }

      this.photoForm.patchValue({
          date: locationData.date,
          time: locationData.time,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
      });

      // Agregar texto a la imagen
      const imageWithText = await this.cameraService.addTextToImage(
          file,
          locationData.latitude,
          locationData.longitude,
          locationData.date,
          locationData.time
      );

      // Convertir la imagen con texto a un Blob y luego a un File
      const response = await fetch(imageWithText);
      const blobWithText = await response.blob();

      if (!blobWithText) {
        throw new Error('No se pudo obtener el blob de la imagen procesada.');
      }

      file = new File([blobWithText], file.name, { type: 'image/jpeg' });

      const base64Image = await this.fileToBase64(file);
      const exifObj: any = {
          '0th': {},
          GPS: {},
          Exif: {},
      };

      // Validar ubicación
      if (locationData.latitude && locationData.longitude) {
        exifObj.GPS[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(locationData.latitude);
        exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = locationData.latitude >= 0 ? 'N' : 'S';
        exifObj.GPS[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(locationData.longitude);
        exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = locationData.longitude >= 0 ? 'E' : 'W';
      }

      // Validar fecha y hora
      if (locationData.date && locationData.time) {
        const dateTime = `${locationData.date.replace(/-/g, ':')} ${locationData.time}`;
        exifObj.Exif[piexif.ExifIFD.DateTimeOriginal] = dateTime; // Fecha y hora de captura
        exifObj["0th"][piexif.ImageIFD.DateTime] = dateTime; // Fecha y hora general
      }

      const exifBytes = piexif.dump(exifObj);
      const processedImage = piexif.insert(exifBytes, base64Image);

      // Convertir la imagen procesada a un archivo Blob y actualizar el estado
      const processedBlob = this.base64ToBlob(processedImage, 'image/jpeg');
      console.log("processedblob", JSON.stringify(processedBlob))
      file = new File([processedBlob], file.name, { type: 'image/jpeg' });

      if (file.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 10MB.');
        return;
      }

      // Actualizar el archivo convertido y la URL de la imagen para mostrarla
      this.file = file;
      this.imageSrc = URL.createObjectURL(file);

    } catch (error: any) {
        console.error('Error al procesar la imagen:', error);
        this.clearImage();
        await this.alert(`Ocurrió un error al procesar la imagen. Intenta nuevamente. ${error.message || error?.error?.message || error }`);
    } finally {
        await this.hideLoading();
    }
  }

  async photo(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    let file: File = input.files[0];

    // Comprobar el tipo de archivo y permitir solo tipos de imagen
    const allowedImageTypes = ['image/jpeg'];
    if (!allowedImageTypes.includes(file.type)) {
        await this.alert('Por favor, selecciona solo archivos de imagen (JPG).');
        return;
    }

    // Validar el tamaño del archivo
    const maxSizeInMB = 10;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        await this.alert('El archivo no debe pesar más de 10MB.');
        return;
    }

    try {
        // Mostrar el loader
        await this.showLoading();

        // Obtener los metadatos de ubicación y fecha
        const fileUrl = URL.createObjectURL(file);
        const locationData = await this.cameraService.getLocationForImage(fileUrl);

        // Actualizar el formulario con los datos de ubicación y fecha
        this.photoForm.patchValue({
            date: locationData.date,
            time: locationData.time,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        });

        // Convertir el archivo a Base64
        const base64Image = await this.fileToBase64(file);

        // Crear los metadatos EXIF
        const exifObj: any = {
            '0th': {},
            GPS: {},
            Exif: {},
        };

        // Agregar coordenadas GPS
        if (locationData.latitude && locationData.longitude) {
            exifObj.GPS[piexif.GPSIFD.GPSLatitude] = this.convertToDMS(locationData.latitude);
            exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = locationData.latitude >= 0 ? 'N' : 'S';
            exifObj.GPS[piexif.GPSIFD.GPSLongitude] = this.convertToDMS(locationData.longitude);
            exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = locationData.longitude >= 0 ? 'E' : 'W';
        }

        // Agregar fecha y hora
        const dateTime = `${locationData.date.replace(/-/g, ':')} ${locationData.time}`;
        exifObj['0th'][piexif.ImageIFD.DateTime] = dateTime;

        // Generar los bytes EXIF
        const exifBytes = piexif.dump(exifObj);

        // Insertar los metadatos EXIF en la imagen
        const processedImage = piexif.insert(exifBytes, base64Image);

        // Convertir la imagen procesada a un archivo Blob y actualizar el estado
        const processedBlob = this.base64ToBlob(processedImage, 'image/jpeg');
        file = new File([processedBlob], file.name, { type: 'image/jpeg' });

        this.file = file;
        this.imageSrc = URL.createObjectURL(file);

    } catch (error: any) {
        console.error('Error al procesar la imagen:', error);
        this.clearImage();
        await this.alert(`Ocurrió un error al procesar la imagen: ${error.message || error}`);
    } finally {
        await this.hideLoading();
    }
  }

  private fileToBase64(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
      });
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
      const byteString = atob(base64.split(',')[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
      }
      return new Blob([arrayBuffer], { type: mimeType });
  }

  private convertToDMS(degree: number): number[][] {
      const absDegree = Math.abs(degree);
      const d = Math.floor(absDegree);
      const m = Math.floor((absDegree - d) * 60);
      const s = (absDegree - d - m / 60) * 3600;
      return [[d, 1], [m, 1], [Math.round(s * 100), 100]];
  }


  // Método para limpiar la imagen y los campos asociados
  clearImage() {
    this.imageSrc = null;
    this.file = null;
    this.originalFile = null;
    this.photoForm.patchValue({
      date: null,
      time: null,
      latitude: null,
      longitude: null,
    });
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
      originalFile: this.originalFile,
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


