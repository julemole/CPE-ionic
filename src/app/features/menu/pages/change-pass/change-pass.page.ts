import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonButton, IonIcon, IonInput, AlertController} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { LocalStorageService } from '../../../../core/services/local-storage.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';

@Component({
  selector: 'app-change-pass',
  templateUrl: './change-pass.page.html',
  styleUrls: ['./change-pass.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonIcon, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, CommonModule, ReactiveFormsModule]
})
export class ChangePassPage {

  currentPass: FormControl = new FormControl('', Validators.required);
  newPass: FormControl = new FormControl('', Validators.required);
  showCurrentPass: boolean = false;
  showNewPass: boolean = false;
  private isOnline: WritableSignal<boolean> = signal(true);

  constructor(private alertController: AlertController, private localStorageService: LocalStorageService, private userService: UserService, private router: Router, private connectivityService: ConnectivityService) {
    addIcons({lockClosedOutline,eyeOffOutline,eyeOutline});
    this.isOnline = this.connectivityService.getNetworkStatus();

  }

  changePass(): void {

    if(!this.isOnline()){
      this.errorAlert('Se requiere conexión a internet');
      return;
    }

    const userId = this.localStorageService.getItem('USER_ID');

    if(this.currentPass.invalid || this.newPass.invalid) {
      this.currentPass.markAsTouched();
      this.newPass.markAsTouched();
      return;
    }

    const userData: any = {
      data: {
        type: "user--user",
        id: userId,
        attributes: {
          pass: {
            existing: this.currentPass.value,
            value: this.newPass.value
          }
        },
      }
    }

    if(userId) {
      this.userService.updateUser(userId, userData).subscribe({
        next: (response) => {
          this.currentPass.reset();
          this.newPass.reset();
          this.successAlert();
        },
        error: (error) => {
          this.errorAlert(error.error?.errors[0]?.detail || 'Ha ocurrido un error');
          console.error(error.error?.errors[0]?.detail);
        }
      })
    }
  }

  async successAlert() {
    const alert = await this.alertController.create({
      header: 'Contraseña actualizada',
      cssClass: 'success-alert',
      message: 'Debido a los cambios se requiere iniciar sesión nuevamente',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.localStorageService.clearStorage();
          this.router.navigate(['/login']);
        }
      }],
    });

    await alert.present();

    alert.onDidDismiss().then(() => {
      this.localStorageService.clearStorage();
          this.router.navigate(['/login']);
    });
  }

  async errorAlert(msg: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  showCurrentPassword() {
    this.showCurrentPass = !this.showCurrentPass;
  }

  showNewPassword() {
    this.showNewPass = !this.showNewPass;
  }

}
