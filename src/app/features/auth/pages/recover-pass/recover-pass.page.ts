import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-recover-pass',
  templateUrl: './recover-pass.page.html',
  styleUrls: ['./recover-pass.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class RecoverPassPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
