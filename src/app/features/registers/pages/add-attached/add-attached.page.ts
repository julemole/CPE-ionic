import { attachedData } from './../../../../shared/models/save-in-session.interface';
import { Component, effect, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, IonInput, IonButton, IonIcon, IonSelect, IonSelectOption, IonItem, IonLabel } from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { documentAttachOutline, cloudUpload, scanCircleOutline } from 'ionicons/icons';
import { Camera, CameraResultType } from '@capacitor/camera';
import { ImageCropperComponent, ImageTransform } from 'ngx-image-cropper';
import { Capacitor } from '@capacitor/core';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { base64ToBlob, blobToFile } from 'src/app/shared/utils/functions';
import { RegistersService } from '../../services/registers.service';

@Component({
  selector: 'app-add-attached',
  templateUrl: './add-attached.page.html',
  styleUrls: ['./add-attached.page.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, IonIcon, IonButton, ImageCropperComponent, IonInput, IonContent, IonHeader, IonSelect, IonSelectOption, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, CommonModule, ReactiveFormsModule, RouterLinkWithHref]
})
export class AddAttachedPage implements OnInit {

  isMobile = Capacitor.getPlatform() !== 'web';

  fb: FormBuilder = inject(FormBuilder);
  attachedForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(250)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  color: FormControl = new FormControl('');

  imageChangedEvent: any = '';
  croppedImage: WritableSignal<string> = signal<string>('');
  blobCropImg: WritableSignal<Blob> = signal<Blob>(new Blob());
  originalImage: WritableSignal<string> = signal<string>('');
  transform: ImageTransform = {};

  file: File | null = null;
  fileSrc: string = '';
  institutionId: string = '';
  attachId: string = '';
  idRegister: string = '';

  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  constructor(private aRoute: ActivatedRoute, private router: Router, private saveInSessionService: SaveInSessionService, private registersService: RegistersService) {
    addIcons({documentAttachOutline,cloudUpload,scanCircleOutline});
    this.attachedData = this.saveInSessionService.getAttachedData();
    this.croppedImage = this.saveInSessionService.getAttachImg();
    this.blobCropImg = this.saveInSessionService.getBlobAttachImg();
    this.originalImage = this.saveInSessionService.getOriginalAttachImg();

    effect(() => {
      const currentValue = this.blobCropImg();
      console.log('La signal ha cambiado:');
      const file = blobToFile(currentValue, 'image.png');
      this.file = file;
    });
  }

  ngOnInit() {
    this.attachId = this.aRoute.snapshot.params['attachId'];
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if(this.attachId) {
      this.loadAttachedData();
    } else {
      this.croppedImage.set('');
    }

    if(this.idRegister && this.attachId) {
      this.registersService.getAnnexById(this.attachId).subscribe({
        next: (resp) => {
          console.log(resp)
          this.attachedForm.patchValue({
            name: resp.attributes.title,
            description: resp.attributes.field_description
          });
          this.attachedForm.disable();
          this.fileSrc = resp.fileUrl;
        }
      });
    }

  }

  saveAttached() {
    if(this.attachedForm.invalid){
      this.attachedForm.markAllAsTouched();
      return;
    }

    const currentAttachedData = this.attachedData();
    const nextId = currentAttachedData.length ? currentAttachedData[currentAttachedData.length - 1].id + 1 : 1;

    const {name, description} = this.attachedForm.getRawValue();

    const attachedData = {
      id: nextId,
      name,
      description,
      file: this.file,
      url: this.fileSrc || this.croppedImage(),
      urlType: this.fileSrc ? 'doc' : 'img'
    }

    this.saveInSessionService.saveAttachedData(attachedData, `/registers/add/select-institution/${this.institutionId}`);
  }

  loadAttachedData() {
    const attachedData = this.attachedData();
    const currentAttachedData = attachedData.find((photo: attachedData) => photo.id === Number(this.attachId));
    if (currentAttachedData) {
      this.attachedForm.patchValue(currentAttachedData);
      if(currentAttachedData.urlType === 'doc'){
        this.fileSrc = currentAttachedData.url!;
        this.saveInSessionService.saveAttachImg('');
      } else {
        this.saveInSessionService.saveAttachImg(currentAttachedData.url!);
        this.fileSrc = '';
      }
      // currentAttachedData.urlType === 'doc' ? this.fileSrc = currentAttachedData.url! : this.saveInSessionService.saveAttachImg(currentAttachedData.url!);
      this.attachedForm.disable();
    }
  }

  changeColor() {
    if(this.color.value == 'grayscale'){
      this.convertImage('grayscale');
    }

    if(this.color.value == 'sepia'){
      this.convertImage('sepia');
    }

    if(this.color.value == 'color'){
      this.resetImage();
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.file = file;
      const fileUrl = URL.createObjectURL(file);
      this.fileSrc = fileUrl;
      this.saveInSessionService.saveAttachImg('', '', true)
    }
  }

  async scan() {
    const image = await Camera.getPhoto({
      quality: 100,
      allowEditing: true,
      resultType: CameraResultType.Base64,
    });

    const myImage = `data:image/jpeg;base64,${image.base64String}`;

    if (image && myImage) {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        this.fileSrc = '';
        this.saveInSessionService.saveAttachImgB64(myImage, width, height, `/registers/add/select-institution/${this.institutionId}/cropper`);
      };
      img.src = myImage;
    }
  }

  convertImage(filterType: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = this.croppedImage();

    if (ctx) {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        switch (filterType) {
          case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = avg;        // Red
              data[i + 1] = avg;    // Green
              data[i + 2] = avg;    // Blue
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
        this.saveInSessionService.saveAttachImg(canvas.toDataURL('image/png'));
      };
    }
  }

  resetImage() {
    if (this.originalImage()) {
      this.saveInSessionService.saveAttachImg(this.originalImage());
    }
  }

}
