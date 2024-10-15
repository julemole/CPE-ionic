import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonGrid, IonCol, IonRow, IonLabel, IonItem, IonCard, IonButton, IonIcon, IonTextarea } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline } from 'ionicons/icons';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-tracing-detail',
  templateUrl: './tracing-detail.page.html',
  styleUrls: ['./tracing-detail.page.scss'],
  standalone: true,
  imports: [IonTextarea, IonCard, IonItem, IonLabel, IonGrid, IonRow, IonCol, IonInput, IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, ReactiveFormsModule, FormsModule, RouterLinkWithHref]
})
export class TracingDetailPage implements OnInit {

  fb: FormBuilder = inject(FormBuilder);
  detailForm: FormGroup = this.fb.group({
    region: [''],
    department: [''],
    zone: [''],
    city: [''],
    headquarter: [''],
    tutor: [''],
    activity: [''],
    approach: [''],
    subactivity: [''],
  });
  description: string = '';
  news: string = '';
  currentId: string = '';

  photos: any[] = [
    { id: '1', name: 'Photo 1', date: '2021-09-01', url: 'https://via.placeholder.com/150' },
    { id: '2', name: 'Photo 2', date: '2021-09-02', url: 'https://via.placeholder.com/150' },
    { id: '3', name: 'Photo 3', date: '2021-09-03', url: 'https://via.placeholder.com/150' }
  ];

  constructor(private aRoute: ActivatedRoute) {
    addIcons({eyeOutline});
    this.currentId = aRoute.snapshot.params['tracingId'];
    console.log(this.currentId)
  }

  ngOnInit() {
    this.detailForm.disable();
    console.log('holaa')
  }

}
