import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonCard, IonCardContent, IonCardTitle, IonNote, IonCardHeader, IonItem, IonLabel, IonButton, IonIcon, AlertController, LoadingController } from '@ionic/angular/standalone';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { addIcons } from 'ionicons';
import { wifiOutline, syncOutline } from 'ionicons/icons';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardTitle, IonNote, IonButton, IonCardHeader, IonItem, IonLabel, CommonModule]
})
export class SettingsPage {
  isOnline: WritableSignal<boolean> = signal(true);
  loading: HTMLIonLoadingElement | null = null;

  syncStatus: string = 'No sincronizado';
  notificationsEnabled: boolean = true;
  darkModeEnabled: boolean = false;

  constructor(private dbService: DatabaseService, private ConnectivityService: ConnectivityService, private alertController: AlertController,
    private localSS: LocalStorageService, private loadingController: LoadingController, private router: Router
  ) {
    addIcons({syncOutline,wifiOutline});
    this.isOnline = this.ConnectivityService.getNetworkStatus();
    this.statusSync();
  }

  async statusSync() {
    const unsyncedRegisters = await this.dbService.getUnsyncRegisters();
    if(unsyncedRegisters.length) {
      this.syncStatus = 'No sincronizado';
    } else {
      this.syncStatus = 'Sincronizado';
    }
  }

  // Método para sincronizar la base de datos
  async syncDatabase() {
    await this.presentAlert();
  }

  // Método para habilitar/deshabilitar modo oscuro
  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkModeEnabled);
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Advertencia',
      cssClass: 'warning-alert',
      message: '¿Deseas restaurar toda tu información?',
      buttons: [{
        text: 'Aceptar',
        handler: async () => {
          await this.createInfo();
        },
      },
      {
        text: 'Cancelar',
        role: 'cancel',
      }
    ]
    });
    await alert.present();
  }

  async errorAlert(error: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message: 'Error al sincronizar la información: ' + error,
      buttons: ['OK']
    });
    await alert.present();
  }

  async successAlert() {
    const alert = await this.alertController.create({
      header: 'Éxito',
      cssClass: 'success-alert',
      message: 'Información sincronizada correctamente. Se requiere iniciar sesión nuevamente.',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.localSS.clearStorage();
          this.router.navigate(['/login']);
        }
      }],
    });

    await alert.present();

    // Manejar el evento cuando la alerta se cierra haciendo clic fuera o en el botón "OK"
    alert.onDidDismiss().then(() => {
      this.localSS.clearStorage();
      this.router.navigate(['/login']);
    });
  }


  async createInfo() {
    const idUser = this.localSS.getItem('USER_ID');
    const token = this.localSS.getItem('TOKEN');

    if (idUser && token) {
      await this.showLoading('Cargando datos, por favor espere...');

      try {
        await this.dbService.resetDatabase();
        await this.successAlert();
      } catch (error: any) {
        await this.errorAlert(error.message || error || '');
      } finally {
        await this.hideLoading();
      }
    }
  }

  async showLoading(message: string) {
    if (!this.loading) {
      this.loading = await this.loadingController.create({
        message,
      });
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
