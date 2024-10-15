import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-add-attached',
  templateUrl: './add-attached.page.html',
  styleUrls: ['./add-attached.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class AddAttachedPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
