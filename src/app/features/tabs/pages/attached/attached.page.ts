import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, IonInput } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-attached',
  templateUrl: './attached.page.html',
  styleUrls: ['./attached.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, CommonModule, ReactiveFormsModule, RouterLinkWithHref]
})
export class AttachedPage implements OnInit {

  fb: FormBuilder = inject(FormBuilder);
  attachedForm: FormGroup = this.fb.group({
    name: [''],
    description: [''],
  });

  tracingId: string = '';
  photoId: string = '';

  constructor(private aRoute: ActivatedRoute) {
    console.log(aRoute.snapshot.params)
    this.tracingId = aRoute.snapshot.params['id'];
    this.photoId = aRoute.snapshot.params['photoId'];
  }

  ngOnInit() {
    this.attachedForm.disable();
    console.log('first')
  }

}
