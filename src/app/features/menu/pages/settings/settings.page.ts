import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonCard, IonCardContent, IonCardTitle, IonNote, IonCardHeader, IonItem, IonLabel, IonButton, IonToggle, IonIcon } from '@ionic/angular/standalone';
import { SyncDataService } from '../../../../shared/services/sync-data.service';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { addIcons } from 'ionicons';
import { settingsOutline, wifiOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonIcon, IonToggle, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardTitle, IonNote, IonButton, IonCardHeader, IonItem, IonLabel, CommonModule, FormsModule]
})
export class SettingsPage {
  isOnline: WritableSignal<boolean> = signal(true);

  syncStatus: string = 'No sincronizado';
  notificationsEnabled: boolean = true;
  darkModeEnabled: boolean = false;

  constructor(private dbService: DatabaseService, private ConnectivityService: ConnectivityService) {
    addIcons({settingsOutline,wifiOutline});
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
  syncDatabase() {
    this.syncStatus = 'Sincronizando...';
    // Simular sincronización de base de datos
    setTimeout(() => {
      this.syncStatus = 'Sincronizado correctamente';
    }, 2000);
  }

  // Método para descargar la base de datos a local
  downloadDatabase() {
    console.log('Descargando base de datos...');
    // Lógica para descargar la base de datos aquí
  }

  // Método para limpiar la caché
  clearCache() {
    console.log('Caché limpiada');
    // Lógica para limpiar caché aquí
  }

  // Método para habilitar/deshabilitar modo oscuro
  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkModeEnabled);
  }

}
