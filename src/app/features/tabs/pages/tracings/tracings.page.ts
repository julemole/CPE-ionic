import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonCol, IonCard, IonSelect, IonSelectOption, IonButton, IonIcon, IonCardHeader, IonCardTitle, IonCardContent, IonButtons } from '@ionic/angular/standalone';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronForwardOutline, eyeOutline } from 'ionicons/icons';



@Component({
  selector: 'app-tracings',
  templateUrl: './tracings.page.html',
  standalone: true,
  imports: [IonButtons, IonCardContent, IonCardTitle, IonCardHeader, IonIcon, ReactiveFormsModule, IonButton, IonCard, IonCol, IonGrid, NgxDatatableModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption, RouterLinkWithHref],
  styleUrls: ['./tracings.page.scss'],
})
export class TracingsPage {

  expandedRowIndex: number | null = null;
  fb: FormBuilder = inject(FormBuilder);
  searchForm = this.fb.group({
    department: [''],
    zone: [''],
    city: [''],
    headquarters: ['']
  });

  data = [
    { id: '1', departamento: 'Meta', zona: 'Zona 1', municipio: 'Acacías', sede: 'Colegio 1' },
    { id: '2', departamento: 'Meta', zona: 'Zona 2', municipio: 'Villavicencio', sede: 'Colegio 2' }
  ]

  columns = [
    { prop: 'icon', name: '' },
    { prop: 'departamento', name: 'Departamento' },
    { prop: 'zona', name: 'Zona' },
    { prop: 'municipio', name: 'Municipio' },
    { prop: 'sede', name: 'Sede' }
  ];

  constructor() {
    addIcons({chevronDownOutline, chevronForwardOutline, eyeOutline});
  }

  clearFields(): void {
    this.searchForm.reset();
  }

  toggleExpandRow(index: number) {
    this.expandedRowIndex = this.expandedRowIndex === index ? null : index;
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  onActivate(event: any) {
    console.log('Activate Event', event);
  }

}
