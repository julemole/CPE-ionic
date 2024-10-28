import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonInput,
  IonBackButton,
  IonButtons,
  AlertController,
} from '@ionic/angular/standalone';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { addIcons } from 'ionicons';
import { key, sendOutline } from 'ionicons/icons';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { LoadingController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-recover-pass',
  templateUrl: './recover-pass.page.html',
  styleUrls: ['./recover-pass.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonButtons,
    IonButton,
    BannerGovComponent,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonIcon,
    IonInput,
    IonButton,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class RecoverPassPage {

  isOnline: WritableSignal<boolean> = signal(true);
  loading: HTMLIonLoadingElement | null = null;

  email: FormControl = new FormControl('', Validators.email);

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private authService: AuthService,
    private connectivityService: ConnectivityService
  ) {
    addIcons({ key, sendOutline });
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  sendEmail(): void {
    if (this.isOnline()) {
      this.showLoading();
      this.authService.resetPassword({ mail: this.email.value }).subscribe({
        next: () => {
          this.hideLoading();
          this.presentAlert('A su correo se han enviado las instrucciones para recuperar su contraseña.');
        },
        error: (error) => {
          this.hideLoading();
          this.errorAlert('Error: ' + error.message);
        },
      });
    } else {
      this.errorAlert('Se requiere conexión a internet para el proceso de recuperación de contraseña.');
    }
  }

  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Correo enviado',
      cssClass: 'success-alert',
      message,
      buttons: [
        {
          text: 'Continuar',
          handler: () => {
            this.router.navigate(['/reset-pass']);
          },
        },
      ],
    });

    alert.onDidDismiss().then(() => {
      this.router.navigate(['/reset-pass']);
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
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
