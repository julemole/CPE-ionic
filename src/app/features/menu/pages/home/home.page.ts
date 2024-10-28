import { ParametricsService } from './../../../../shared/services/parametrics.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, IonLabel, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, documentTextOutline, settingsOutline, addCircleOutline } from 'ionicons/icons';
import { RouterLinkWithHref } from '@angular/router';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { SaveInSessionService } from '../../../../shared/services/save-in-session.service';
import { NodesService } from 'src/app/features/registers/services/nodes.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonButton, IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonLabel, CommonModule, FormsModule, RouterLinkWithHref, BannerGovComponent]
})
export class HomePage {

  constructor(private dbService: DatabaseService, private saveInSessionService: SaveInSessionService, private nodeService: NodesService, private parametricsService: ParametricsService) {
    addIcons({personCircleOutline,settingsOutline,documentTextOutline,addCircleOutline});
    this.saveInSessionService.cleanAllData();
    parametricsService.getSedesBytutor('aaf52c55-48fb-4422-886e-217ed6efebd3').subscribe({
      next: (data) => {
        console.log(data);
      }
    })
  }
}
