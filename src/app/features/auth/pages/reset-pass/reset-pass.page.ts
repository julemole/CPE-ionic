import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButton, IonAlert, IonButtons, IonIcon, IonInput } from '@ionic/angular/standalone';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, keyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reset-pass',
  templateUrl: './reset-pass.page.html',
  styleUrls: ['./reset-pass.page.scss'],
  standalone: true,
  imports: [IonInput, BannerGovComponent, IonAlert, IonButton, IonButtons, IonIcon, IonAlert, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule]
})
export class ResetPassPage {

  temporalPass: FormControl = new FormControl('', Validators.required);
  newPass: FormControl = new FormControl('', Validators.required);
  showTempPass: boolean = false;
  showNewPass: boolean = false;

  constructor() {
    addIcons({keyOutline, eyeOffOutline, eyeOutline});
  }

  showTempPassword() {
    this.showTempPass = !this.showTempPass;
  }

  showNewPassword() {
    this.showNewPass = !this.showNewPass;
  }

}
