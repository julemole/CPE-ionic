import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonInput, IonBackButton, IonButtons, AlertController } from '@ionic/angular/standalone';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { addIcons } from 'ionicons';
import { key, sendOutline } from 'ionicons/icons';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recover-pass',
  templateUrl: './recover-pass.page.html',
  styleUrls: ['./recover-pass.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, IonButton, BannerGovComponent, IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonInput, IonButton, CommonModule, ReactiveFormsModule]
})
export class RecoverPassPage {

  email: FormControl = new FormControl('', Validators.email);

  constructor(private router: Router, private alertController: AlertController, private authService: AuthService) {
    addIcons({key,sendOutline});
  }

  sendEmail(): void {
    if(this.email.valid) {
      this.authService.resetPassword({mail: this.email.value}).subscribe({
        next: () => {
          this.presentAlert();
        }
      });
    }
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Correo enviado',
      message: 'A su correo se han enviado las instrucciones para recuperar su contraseña.',
      buttons: [
        {
          text: 'Continuar',
          handler: () => {
            this.router.navigate(['/reset-pass']);
          }
        }
      ]
    });

    alert.onDidDismiss().then(() => {
      this.router.navigate(['/reset-pass']);
    });

    await alert.present();
  }

}
