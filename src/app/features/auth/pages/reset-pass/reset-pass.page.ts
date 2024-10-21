import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButton, IonAlert, IonButtons, IonIcon, IonInput, AlertController } from '@ionic/angular/standalone';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, keyOutline, sendOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset-pass',
  templateUrl: './reset-pass.page.html',
  styleUrls: ['./reset-pass.page.scss'],
  standalone: true,
  imports: [IonInput, BannerGovComponent, IonAlert, IonButton, IonButtons, IonIcon, IonAlert, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, ReactiveFormsModule]
})
export class ResetPassPage {

  username: FormControl = new FormControl('', Validators.required);
  temporalPass: FormControl = new FormControl('', Validators.required);
  newPass: FormControl = new FormControl('', Validators.required);
  showTempPass: boolean = false;
  showNewPass: boolean = false;

  constructor(private alertController: AlertController, private router: Router, private authService: AuthService) {
    addIcons({keyOutline,eyeOffOutline,eyeOutline,sendOutline});
  }

  showTempPassword() {
    this.showTempPass = !this.showTempPass;
  }

  showNewPassword() {
    this.showNewPass = !this.showNewPass;
  }

  resetPass(): void {
    if(this.username.invalid || this.temporalPass.invalid || this.newPass.invalid) {
      this.username.markAsTouched();
      this.temporalPass.markAsTouched();
      this.newPass.markAsTouched();
      return;
    }

    const payload = {
      name: this.username.value,
      temp_pass: this.temporalPass.value,
      new_pass: this.newPass.value
    }

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.alert();
      },
      error: (error) => {
        console.error('Error resetting password', error);
      }
    });
  }

  async alert() {
    const alert = await this.alertController.create({
      header: 'Contraseña actualizada',
      message: 'Su contraseña ha sido actualizada correctamente.',
      buttons: [
        {
          text: 'Continuar',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    alert.onDidDismiss().then(() => {
      this.router.navigate(['/login']);
    });

    await alert.present();
  }

}
