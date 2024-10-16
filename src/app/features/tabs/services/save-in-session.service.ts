import { Injectable, signal, WritableSignal } from '@angular/core';
import { PhotoData } from '../models/save-in-session.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SaveInSessionService {

  private photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);

  constructor(private router: Router) { }

  savePhotoData(data: PhotoData, url: string) {
    this.photoData.set([...this.photoData(), data]);
    this.router.navigate([url]);
  }

  getPhotoData() {
    return this.photoData;
  }
}
