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

  //Manejo de imagenes
  private attachImg: WritableSignal<string> = signal<string>('');
  private blobAttachImg: WritableSignal<Blob> = signal<Blob>(new Blob());
  private originalAttachImg: WritableSignal<string> = signal<string>('');
  private attachImgB64: WritableSignal<string> = signal<string>('');
  private widthImgB64: WritableSignal<number> = signal<number>(0);
  private heightImgB64: WritableSignal<number> = signal<number>(0);

  constructor(private router: Router) { }

  savePhotoData(data: PhotoData, url: string) {
    this.photoData.set([...this.photoData(), data]);
    this.router.navigate([url]);
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

  getSignature() {
    return this.signature;
  }

  saveRegisterPayload(data: any) {
    this.registerPayload.set(data);
  }

  getRegisterPayload() {
    return this.registerPayload;
  }

  saveAttachImg(data: string, url?: string, isOriginal?: boolean) {
    this.attachImg.set(data);
    if(url){
      this.router.navigate([url]);
    }

    if(isOriginal) this.originalAttachImg.set(data);
  }

  getAttachImg() {
    return this.attachImg;
  }

  getOriginalAttachImg() {
    return this.originalAttachImg;
  }

  saveBlobAttachImg(data: Blob) {
    this.blobAttachImg.set(data);
  }

  getBlobAttachImg() {
    return this.blobAttachImg;
  }

  saveAttachImgB64(data: string, width?: number, height?: number, url?: string) {
    this.attachImgB64.set(data);
    if(width){
      this.widthImgB64.set(width);
    }
    if(height){
      this.heightImgB64.set(height);
    }
    if(url){
      this.router.navigate([url]);
    }
  }

  getAttachImgB64() {
    return this.attachImgB64;
  }

  getWidthImgB64() {
    return this.widthImgB64;
  }

  getHeightImgB64() {
    return this.heightImgB64;
  }
}
