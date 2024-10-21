import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonCard, IonCardContent, IonCardTitle, IonNote, IonCardHeader, IonItem, IonLabel, IonButton, IonToggle } from '@ionic/angular/standalone';
import { SyncDataService } from '../../../../shared/services/sync-data.service';
import { DatabaseService } from 'src/app/shared/services/database.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonToggle, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardTitle, IonNote, IonButton, IonCardHeader, IonItem, IonLabel, CommonModule, FormsModule]
})
export class SettingsPage {

  lastUpdateDate: string = new Date().toLocaleDateString();
  syncStatus: string = 'No sincronizado';
  notificationsEnabled: boolean = true;
  darkModeEnabled: boolean = false;

  constructor(private dbService: DatabaseService) {}

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
