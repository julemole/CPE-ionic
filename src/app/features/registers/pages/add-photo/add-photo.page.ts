import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonGrid, IonCol, IonRow, IonTextarea, IonThumbnail, IonInput, IonButton } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { CameraService } from 'src/app/core/services/camera.service';
import { PhotoData } from 'src/app/features/tabs/models/save-in-session.interface';
import { SaveInSessionService } from 'src/app/features/tabs/services/save-in-session.service';

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
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', Validators.maxLength(250)],
    date: [''],
    time: [''],
    latitude: [''],
    longitude: [''],
  });

  photoId: string = '';
  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  imageSrc: string | null = null;

  //controles
  get name() {
    return this.photoForm.get('name') as FormControl;
  }

  get description() {
    return this.photoForm.get('description') as FormControl;
  }

  constructor(private readonly aRoute: ActivatedRoute, private readonly cameraService: CameraService, private readonly saveInSessionService: SaveInSessionService) {
    this.photoData = this.saveInSessionService.getPhotoData();
  }

  ngOnInit() {
    this.photoId = this.aRoute.snapshot.params['photoId'];
    this.photoForm.disable();
    this.photoForm.get('name')?.enable();
    this.photoForm.get('description')?.enable();
    if(this.photoId) {
      this.loadPhotoData();
    }
  }

  async captureImage() {
    const locationData = await this.cameraService.takePictureAndGetData();
    this.imageSrc = locationData.imagePath;
    this.photoForm.patchValue({
      date: locationData.date,
      time: locationData.time,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    })
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        this.imageSrc = reader.result as string;
        const locationData = await this.cameraService.getLocationForImage(this.imageSrc);
        this.photoForm.patchValue({
          date: locationData.date,
          time: locationData.time,
          latitude: locationData.latitude,
          longitude: locationData.longitude
        })

        // if (locationData.latitude && locationData.longitude) {
        //   const approximateLocation = await this.cameraService.getApproximateLocation(locationData.latitude, locationData.longitude);
        //   this.photoForm.controls['location'].setValue(approximateLocation);
        // } else {
        //   this.photoForm.controls['location'].setValue('Ubicación desconocida');
        // }
      };
      reader.readAsDataURL(file);
    }
  }

  savePhoto(): void {
    if(this.photoForm.invalid){
      this.photoForm.markAllAsTouched();
      return;
    }

    const currentPhotoData = this.photoData();
    const nextId = currentPhotoData.length ? currentPhotoData[currentPhotoData.length - 1].id + 1 : 1;

    const {name, description, date, time, latitude, longitude} = this.photoForm.getRawValue();

    const photoData = {
      id: nextId,
      name,
      description,
      date,
      time,
      latitude,
      longitude,
    };

    this.saveInSessionService.savePhotoData(photoData, '/tracing/add');
  }



  loadPhotoData() {
    const photoData = this.photoData();
    const currentPhotoData = photoData.find((photo: PhotoData) => photo.id === Number(this.photoId));
    if (currentPhotoData) {
      this.photoForm.patchValue(currentPhotoData);
    }
  }

}
