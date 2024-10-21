import { Component, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { ImageCropperComponent, ImageTransform } from 'ngx-image-cropper';
import { Capacitor } from '@capacitor/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-cropper',
  templateUrl: './cropper.page.html',
  styleUrls: ['./cropper.page.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ImageCropperComponent]
})
export class CropperPage {

  @ViewChild('cropper', {static: false}) cropper!: ImageCropperComponent;
  isMobile = Capacitor.getPlatform() !== 'web';
  transform: ImageTransform = {};
  image: WritableSignal<string> = signal<string>('');
  imgWidth: WritableSignal<number> = signal<number>(0);
  imgHeight: WritableSignal<number> = signal<number>(0);
  institutionId: string = '';

  constructor(private router: Router, private aRoute: ActivatedRoute, private saveInSessionService: SaveInSessionService) {
    addIcons({closeCircle,checkmarkCircle});
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
    this.image = this.saveInSessionService.getAttachImgB64();
    this.imgWidth = this.saveInSessionService.getWidthImgB64();
    this.imgHeight = this.saveInSessionService.getHeightImgB64();
  }

  imageCropped(event: any) {
    this.saveInSessionService.saveBlobAttachImg(event.blob);
    this.saveInSessionService.saveAttachImg(event.objectUrl, `/registers/add/select-institution/${this.institutionId}/add-attached`, true);
  }

  cropImage() {
    this.cropper.crop();
    this.saveInSessionService.saveAttachImgB64('')
  }

  discardChanges() {
    this.saveInSessionService.saveAttachImgB64('')
    this.saveInSessionService.saveAttachImg('', `/registers/add/select-institution/${this.institutionId}/add-attached`);
  }

  loadImageFailed() {
    console.log('La carga de la imagen falló');
  }

  rotate() {
    const newValue = ((this.transform.rotate ?? 0) + 90) % 360;

    this.transform = {
      ...this.transform,
      rotate: newValue,
    };
  }

}
