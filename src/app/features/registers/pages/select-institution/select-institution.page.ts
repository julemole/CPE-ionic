import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonCardHeader, IonCard, IonCardContent, IonCardTitle, IonAccordion, IonAccordionGroup, IonList, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-select-institution',
  templateUrl: './select-institution.page.html',
  styleUrls: ['./select-institution.page.scss'],
  standalone: true,
  imports: [IonList, IonLabel, IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonAccordion, IonAccordionGroup, IonItem, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SelectInstitutionPage {

  tutor: any;

  constructor() {
    this.tutor = {
      zonas: [
        { id: 1, nombre: 'Zona 1', instituciones: [{ id: 1, nombre: 'Institución 1' }, { id: 2, nombre: 'Institución 2' }, { id: 3, nombre: 'Institución 3' }] },
        { id: 2, nombre: 'Zona 2', instituciones: [{ id: 4, nombre: 'Institución 4' }, { id: 5, nombre: 'Institución 5' }, { id: 6, nombre: 'Institución 6' }] },
        { id: 3, nombre: 'Zona 3', instituciones: [{ id: 7, nombre: 'Institución 7' }, { id: 8, nombre: 'Institución 8' }, { id: 9, nombre: 'Institución 9' }] }
      ]
    }
  }

}
