import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, IonThumbnail, IonInput } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-photo-evidence',
  templateUrl: './photo-evidence.page.html',
  styleUrls: ['./photo-evidence.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonThumbnail, IonGrid, IonCol, IonRow, IonTextarea, CommonModule, ReactiveFormsModule, RouterLinkWithHref]
})
export class PhotoEvidencePage implements OnInit {

  fb: FormBuilder = inject(FormBuilder);
  photoForm: FormGroup = this.fb.group({
    title: [''],
    description: [''],
    date: [''],
    time: [''],
    latitude: [''],
    longitude: [''],
  });

  tracingId: string = '';
  photoId: string = '';

  constructor(private aRoute: ActivatedRoute) {
    console.log(aRoute.snapshot.params)
    this.tracingId = aRoute.snapshot.params['id'];
    this.photoId = aRoute.snapshot.params['photoId'];
  }

  ngOnInit() {
    this.photoForm.disable();
    console.log('first')
  }

}
