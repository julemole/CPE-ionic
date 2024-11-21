import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, documentTextOutline, settingsOutline, addCircleOutline } from 'ionicons/icons';
import { RouterLinkWithHref } from '@angular/router';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { SaveInSessionService } from '../../../../shared/services/save-in-session.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonButton, IonContent, IonIcon, CommonModule, FormsModule, RouterLinkWithHref, BannerGovComponent]
})
export class HomePage {

  constructor(private saveInSessionService: SaveInSessionService) {
    addIcons({personCircleOutline,settingsOutline,documentTextOutline,addCircleOutline});
    this.saveInSessionService.cleanAllData();
  }
}
