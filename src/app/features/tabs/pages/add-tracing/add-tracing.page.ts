import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonInput, IonSelect, IonSelectOption, IonGrid, IonCol, IonRow, IonLabel, IonItem, IonCard, IonButton, IonIcon, IonTextarea } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-add-tracing',
  templateUrl: './add-tracing.page.html',
  styleUrls: ['./add-tracing.page.scss'],
  standalone: true,
  imports: [IonTextarea, IonCard, IonItem, IonLabel, IonGrid, IonRow, IonCol, IonInput, IonButton, IonSelect, IonSelectOption, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, CommonModule, ReactiveFormsModule, FormsModule, RouterLinkWithHref]
})
export class AddTracingPage implements OnInit {

  fb: FormBuilder = inject(FormBuilder);
  detailForm: FormGroup = this.fb.group({
    region: ['', Validators.required],
    department: ['', Validators.required],
    zone: ['', Validators.required],
    city: ['', Validators.required],
    headquarter: ['', Validators.required],
    // tutor: [''],
    activity: ['', Validators.required],
    approach: ['', Validators.required],
    subactivity: ['', Validators.required],
  });
  description: string = '';
  news: string = '';

  photos: any[] = [
    { id: '1', name: 'Photo 1', date: '2021-09-01', url: 'https://via.placeholder.com/150' },
    { id: '2', name: 'Photo 2', date: '2021-09-02', url: 'https://via.placeholder.com/150' },
    { id: '3', name: 'Photo 3', date: '2021-09-03', url: 'https://via.placeholder.com/150' }
  ];

  constructor(private aRoute: ActivatedRoute) {
    addIcons({eyeOutline});
  }

  ngOnInit() {
    this.detailForm.get('region')?.disable();
    this.detailForm.get('department')?.disable();
    console.log('holaa')
  }

}
