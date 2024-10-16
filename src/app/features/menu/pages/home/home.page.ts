import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonLabel, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, documentTextOutline, addCircle, settingsOutline } from 'ionicons/icons';
import { RouterLinkWithHref } from '@angular/router';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonLabel, CommonModule, FormsModule, RouterLinkWithHref, BannerGovComponent]
})
export class HomePage implements OnInit {

  constructor() {
    addIcons({personCircleOutline,settingsOutline,documentTextOutline,addCircle});
  }

  ngOnInit() {
    console.log('first')
  }

}
