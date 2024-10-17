import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonTabs, IonTabBar, IonTabButton, IonBackButton, IonSelect, IonIcon, IonLabel, IonList, IonItem } from '@ionic/angular/standalone';
import { RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { camera, documentAttach, pencil, save, cameraOutline, documentAttachOutline } from 'ionicons/icons';

@Component({
  selector: 'app-main-register',
  templateUrl: './main-register.page.html',
  styleUrls: ['./main-register.page.scss'],
  standalone: true,
  imports: [IonItem, IonList, IonContent, IonHeader, IonSelect, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, CommonModule, FormsModule, ReactiveFormsModule, RouterLinkWithHref]
})
export class MainRegisterPage {

  fb: FormBuilder = inject(FormBuilder);
  registerForm: FormGroup = this.fb.group({
    approach: ['', [Validators.required]],
    activity: ['', [Validators.required]],
    subactivity: ['', [Validators.required]],
  });

  // Arrays para evidencias fotográficas y anexos
  evidences = [
    { name: 'Nombre evidencia fotográfica 1', id: 1 },
    { name: 'Nombre evidencia fotográfica 2', id: 2 }
  ];

  anexos = [
    { name: 'Anexo 1', id: 1 },
    { name: 'Anexo 2', id: 2 }
  ];

  //controles
  get approach() {
    return this.registerForm.get('approach') as FormControl;
  }
  get activity() {
    return this.registerForm.get('activity') as FormControl;
  }
  get subactivity() {
    return this.registerForm.get('subactivity') as FormControl;
  }

  constructor() {
    addIcons({cameraOutline,documentAttachOutline,camera,documentAttach,pencil,save});
  }

  // Método para agregar evidencias
  addEvidence(): void {
    const newEvidence = { name: `Nueva evidencia ${this.evidences.length + 1}`, id: this.evidences.length + 1 };
    this.evidences.push(newEvidence);
    // this.router.navigate(['/tracing/add']);
  }

  // Método para agregar más anexos
  addAnexo(): void {
    const newAnexo = { name: `Nuevo anexo ${this.anexos.length + 1}`, id: this.anexos.length + 1 };
    this.anexos.push(newAnexo);
  }

  saveRegister(): void {
    if(this.registerForm.invalid){
      this.registerForm.markAllAsTouched();
      return;
    }

    // const currentPhotoData = this.photoData();
    // const nextId = currentPhotoData.length ? currentPhotoData[currentPhotoData.length - 1].id + 1 : 1;

    // const {name, description, date, time, latitude, longitude} = this.photoForm.getRawValue();

    // const photoData = {
    //   id: nextId,
    //   name,
    //   description,
    //   date,
    //   time,
    //   latitude,
    //   longitude,
    // };

    // this.saveInSessionService.savePhotoData(photoData, '/tracing/add');
  }
}
