import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonLabel, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, documentTextOutline, settingsOutline, addCircleOutline } from 'ionicons/icons';
import { RouterLinkWithHref } from '@angular/router';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { NodesService } from 'src/app/features/registers/services/nodes.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonLabel, CommonModule, FormsModule, RouterLinkWithHref, BannerGovComponent]
})
export class HomePage {

  constructor(private dbService: DatabaseService, private nodeService: NodesService) {
    addIcons({personCircleOutline,settingsOutline,documentTextOutline,addCircleOutline});
    nodeService.getRegisterList('a5ec6590-4eaf-4b26-ba28-a05d71a73bcf').subscribe({
      next: (data) => {
        console.log(data);
      }
    })
  }

}
