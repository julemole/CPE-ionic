import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, IonThumbnail, IonInput, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-add-photo',
  templateUrl: './add-photo.page.html',
  styleUrls: ['./add-photo.page.scss'],
  standalone: true,
  imports: [IonButton, IonInput, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonThumbnail, IonGrid, IonCol, IonRow, IonTextarea, CommonModule, ReactiveFormsModule, RouterLinkWithHref]

})
export class AddPhotoPage implements OnInit {

  fb: FormBuilder = inject(FormBuilder);
  photoForm: FormGroup = this.fb.group({
    name: [''],
    description: [''],
    date: [''],
    time: [''],
    latitude: [''],
    longitude: [''],
  });

  tracingId: string = '';
  photoId: string = '';

  constructor(private aRoute: ActivatedRoute) {

  }

  ngOnInit() {
    this.photoForm.disable();
    this.photoForm.get('name')?.enable();
    this.photoForm.get('description')?.enable();
    console.log('first')
  }

}
