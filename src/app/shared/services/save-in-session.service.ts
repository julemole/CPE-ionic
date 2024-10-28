import { Injectable, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { attachedData, PhotoData } from '../models/save-in-session.interface';

@Injectable({
  providedIn: 'root'
})
export class SaveInSessionService {

  private photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  private attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);
  private signature: WritableSignal<string> = signal<string>('');
  private registerPayload: WritableSignal<any> = signal<any>({});

  constructor(private router: Router) { }

  cleanAllData() {
    this.saveRegisterPayload({});
    this.cleanPhotoData();
    this.cleanAttachedData();
    this.cleanSignature();
  }

  savePhotoData(data: PhotoData, url: string) {
    this.photoData.set([...this.photoData(), data]);
    this.router.navigate([url]);
  }

  cleanPhotoData() {
    this.photoData.set([]);
  }

  getPhotoData() {
    return this.photoData;
  }

  removePhotoData(id: number) {
    this.photoData.set(this.photoData().filter((data) => data.id !== id));
  }

  saveAttachedData(data: attachedData, url: string) {
    this.attachedData.set([...this.attachedData(), data]);
    this.router.navigate([url]);
  }

  cleanAttachedData() {
    this.attachedData.set([]);
  }

  getAttachedData() {
    return this.attachedData;
  }

  removeAttachedData(id: number) {
    this.attachedData.set(this.attachedData().filter((data) => data.id !== id));
  }

  saveSignature(data: string, url: string) {
    this.signature.set(data);
    this.router.navigate([url]);
  }

  cleanSignature() {
    this.signature.set('');
  }

  getSignature() {
    return this.signature;
  }

  saveRegisterPayload(data: any) {
    this.registerPayload.set(data);
  }

  getRegisterPayload() {
    return this.registerPayload;
  }
}
