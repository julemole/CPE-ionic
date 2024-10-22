import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButton,
  IonAlert,
  IonButtons,
  IonIcon,
  IonInput,
  AlertController,
} from '@ionic/angular/standalone';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  keyOutline,
  sendOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { LoadingController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-reset-pass',
  templateUrl: './reset-pass.page.html',
  styleUrls: ['./reset-pass.page.scss'],
  standalone: true,
  imports: [
    IonInput,
    BannerGovComponent,
    IonAlert,
    IonButton,
    IonButtons,
    IonIcon,
    IonAlert,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class ResetPassPage {
  isOnline: WritableSignal<boolean> = signal(true);
  loading: HTMLIonLoadingElement | null = null;

  username: FormControl = new FormControl('', Validators.required);
  temporalPass: FormControl = new FormControl('', Validators.required);
  newPass: FormControl = new FormControl('', Validators.required);
  showTempPass: boolean = false;
  showNewPass: boolean = false;

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private authService: AuthService,
    private connectivityService: ConnectivityService
  ) {
    addIcons({ keyOutline, eyeOffOutline, eyeOutline, sendOutline });
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  showTempPassword() {
    this.showTempPass = !this.showTempPass;
  }

  showNewPassword() {
    this.showNewPass = !this.showNewPass;
  }

  resetPass(): void {
    if (
      this.username.invalid ||
      this.temporalPass.invalid ||
      this.newPass.invalid
    ) {
      this.username.markAsTouched();
      this.temporalPass.markAsTouched();
      this.newPass.markAsTouched();
      return;
    }

    const payload = {
      name: this.username.value,
      temp_pass: this.temporalPass.value,
      new_pass: this.newPass.value,
    };

    if(this.isOnline()){
      this.showLoading();
      this.authService.setPassword(payload).subscribe({
        next: () => {
          this.hideLoading();
          this.alert('Su contraseña ha sido actualizada correctamente.');
        },
        error: (error) => {
          this.hideLoading();
          this.errorAlert(error.message);
        },
      });
    } else {
      this.errorAlert('Se requiere conexión a internet para actualizar la contraseña');
    }

  }

  async alert(message: string) {
    const alert = await this.alertController.create({
      header: 'Contraseña actualizada',
      cssClass: 'success-alert',
      message,
      buttons: [
        {
          text: 'Continuar',
          handler: () => {
            this.router.navigate(['/login']);
          },
        },
      ],
    });

    alert.onDidDismiss().then(() => {
      this.router.navigate(['/login']);
    });

    await alert.present();
  }

  async errorAlert(message: string) {
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
    console.log(this.loading);
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
