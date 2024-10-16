import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLinkWithHref } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonCol, IonCard, IonSelect, IonSelectOption, IonButton, IonIcon, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonInfiniteScrollContent, IonInfiniteScroll } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDownOutline, chevronForwardOutline, eyeOutline } from 'ionicons/icons';



@Component({
  selector: 'app-tracings',
  templateUrl: './tracings.page.html',
  standalone: true,
  imports: [IonInfiniteScroll, IonInfiniteScrollContent, IonButtons, IonCardContent, IonCardTitle, IonCardHeader, IonIcon, ReactiveFormsModule, IonButton, IonCard, IonCol, IonGrid, IonHeader, IonToolbar, IonTitle, IonContent, IonSelect, IonSelectOption, RouterLinkWithHref],
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
    { id: '2', departamento: 'Meta', zona: 'Zona 2', municipio: 'Villavicencio', sede: 'Colegio 2' },
    { id: '3', departamento: 'Meta', zona: 'Zona 3', municipio: 'Granada', sede: 'Colegio 3' },
    { id: '4', departamento: 'Meta', zona: 'Zona 4', municipio: 'Puerto López', sede: 'Colegio 4' },
    { id: '5', departamento: 'Meta', zona: 'Zona 5', municipio: 'Restrepo', sede: 'Colegio 5' },
    { id: '6', departamento: 'Meta', zona: 'Zona 6', municipio: 'San Martín', sede: 'Colegio 6' },
    { id: '7', departamento: 'Meta', zona: 'Zona 7', municipio: 'Uribe', sede: 'Colegio 7' },
  ]

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

  loadMoreData(event: any) {
    // setTimeout(() => {
    //   this.currentPage++;
    //   const start = this.currentPage * this.itemsPerPage;
    //   const end = start + this.itemsPerPage;
    //   const newData = this.data.slice(start, end);
    //   this.displayedData = [...this.displayedData, ...newData];
    //   event.target.complete();

    //   // Deshabilitar el infinite scroll si no hay más datos
    //   if (this.displayedData.length >= this.data.length) {
    //     event.target.disabled = true;
    //   }
    // }, 500);
  }

}
