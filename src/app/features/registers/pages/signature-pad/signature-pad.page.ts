import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import SignaturePad from 'signature_pad';
import { base64ToBlob, blobToFile } from 'src/app/shared/utils/functions';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.page.html',
  styleUrls: ['./signature-pad.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonButton, IonButtons, IonBackButton, IonToolbar, CommonModule, FormsModule]
})
export class SignaturePadPage implements AfterViewInit {

  @ViewChild('canvas', { static: true }) signaturePadElement: any;
  private signaturePad: any;
  file: any;
  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement);
    this.signaturePad.clear();
    this.signaturePad.penColor = '#000';
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  saveSignature() {
    const base64Data = this.signaturePad.toDataURL('image/png');
    const blob = base64ToBlob(base64Data, 'image/png');
    const file = blobToFile(blob, 'signature.png');
  }

}
