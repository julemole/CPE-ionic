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
    nodeService.getAnnexList('aaf52c55-48fb-4422-886e-217ed6efebd3').subscribe({
      next: (data) => {
        console.log(data);
      }
    })
    this.popo()
  }

  async popo() {
    const data = await fetch('https://www.tutores.co/sites/default/files/2024-10/top.png')
    const blob = await data.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      console.log(base64data.split(',')[1])
      console.log(base64data)
    }
    console.log(blob)
  }

}
