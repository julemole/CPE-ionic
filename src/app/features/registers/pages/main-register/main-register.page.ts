import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonTabs, IonTabBar, IonTabButton, IonBackButton, IonSelect, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { camera, documentAttach, pencil, save } from 'ionicons/icons';

@Component({
  selector: 'app-main-register',
  templateUrl: './main-register.page.html',
  styleUrls: ['./main-register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonSelect, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, CommonModule, FormsModule, RouterLinkWithHref]
})
export class MainRegisterPage implements OnInit {

  idInstitution: string = '';

  constructor(private aRoute: ActivatedRoute) {
    addIcons({ camera, documentAttach, pencil, save });
  }

  ngOnInit(): void {
    this.idInstitution = this.aRoute.snapshot.params['idInstitution'];
  }

}
