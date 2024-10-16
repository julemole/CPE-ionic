import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonCard, IonIcon, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonInfiniteScrollContent, IonInfiniteScroll } from '@ionic/angular/standalone';

@Component({
  selector: 'app-my-registers',
  templateUrl: './my-registers.page.html',
  styleUrls: ['./my-registers.page.scss'],
  standalone: true,
  imports: [IonInfiniteScroll, IonInfiniteScrollContent, IonButton, IonCardContent, IonCardTitle, IonCardHeader, IonBackButton, IonButtons, IonCard, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MyRegistersPage {

  data = [
    { id: '1', departamento: 'Meta', zona: 'Zona 1', municipio: 'Acacías', sede: 'Colegio 1' },
    { id: '2', departamento: 'Meta', zona: 'Zona 2', municipio: 'Villavicencio', sede: 'Colegio 2' },
    { id: '3', departamento: 'Meta', zona: 'Zona 3', municipio: 'Granada', sede: 'Colegio 3' },
    { id: '4', departamento: 'Meta', zona: 'Zona 4', municipio: 'Puerto López', sede: 'Colegio 4' },
    { id: '5', departamento: 'Meta', zona: 'Zona 5', municipio: 'Restrepo', sede: 'Colegio 5' },
    { id: '6', departamento: 'Meta', zona: 'Zona 6', municipio: 'San Martín', sede: 'Colegio 6' },
    { id: '7', departamento: 'Meta', zona: 'Zona 7', municipio: 'Uribe', sede: 'Colegio 7' },
  ]

  constructor() { }

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
