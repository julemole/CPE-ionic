import { AfterViewInit, Component, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import SignaturePad from 'signature_pad';
import { base64ToBlob, blobToFile } from 'src/app/shared/utils/functions';
import { addIcons } from 'ionicons';
import { createOutline, trash } from 'ionicons/icons';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.page.html',
  styleUrls: ['./signature-pad.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonButton, IonButtons, IonBackButton, IonToolbar, CommonModule, FormsModule]
})
export class SignaturePadPage implements AfterViewInit {

  @ViewChild('canvas', { static: false }) signaturePadElement: any;
  private signaturePad: any;
  institutionId: string = '';
  signature: WritableSignal<string> = signal<string>('');
  editSignature: boolean = false;

  constructor(private aRoute: ActivatedRoute, private saveInSessionService: SaveInSessionService) {
    addIcons({trash,createOutline});
    this.signature = this.saveInSessionService.getSignature();
    this.institutionId = this.aRoute.snapshot.params['idInstitution'];
  }

  ngAfterViewInit() {
    if(this.signaturePadElement){
      this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement);
      this.signaturePad.clear();
      this.signaturePad.penColor = '#000';
    }
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  // saveSignature() {
  //   const base64Data = this.signaturePad.toDataURL('image/png');
  //   const blob = base64ToBlob(base64Data, 'image/png');
  //   const file = blobToFile(blob, 'signature.png');
  //   console.log(blob)
  // }

  saveSignature() {
    this.editSignature = false;
    const base64Data = this.signaturePad.toDataURL('image/png');
    this.saveInSessionService.saveSignature(base64Data, `/registers/add/select-institution/${this.institutionId}`);
  }

  updateSignature() {
    this.editSignature = true;
  }

}
