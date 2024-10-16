// src/app/services/camera.service.ts
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { DatabaseService } from './database.service';
import * as ExifReader from 'exifreader';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  constructor(private readonly dbService: DatabaseService) {}

  async takePicture() {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const imagePath = image.webPath;

    try {
      const position = await Geolocation.getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Guardar la imagen junto con la ubicación en la base de datos
      await this.dbService.addImage(imagePath!, latitude, longitude);
    } catch (error) {
      console.error('Error obteniendo la geolocalización', error);
      // Guardar la imagen sin la ubicación en la base de datos
      await this.dbService.addImage(imagePath!, null, null);
    }
  }

  async takePictureAndGetData(): Promise<{ imagePath: string, latitude: number | null, longitude: number | null, date: string, time: string }> {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    const imagePath = image.webPath;

    try {
      const position = await Geolocation.getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const timestamp = new Date(position.timestamp);

      const date = timestamp.toLocaleDateString();
      const time = timestamp.toLocaleTimeString();

      return { imagePath: imagePath!, latitude, longitude, date, time };
    } catch (error) {
      console.error('Error obteniendo la geolocalización', error);
      const now = new Date();
      return { imagePath: imagePath!, latitude: null, longitude: null, date: now.toLocaleDateString(), time: now.toLocaleTimeString() };
    }
  }

  async saveLocalImage(imagePath: string) {
    try {
      // Obtener la ubicación actual
      const position = await Geolocation.getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Guardar la imagen junto con la ubicación en la base de datos
      await this.dbService.addImage(imagePath, latitude, longitude);
    } catch (error) {
      console.error('Error obteniendo la geolocalización', error);
      // Guardar la imagen sin la ubicación en la base de datos
      await this.dbService.addImage(imagePath, null, null);
    }
  }

  async getLocationForImage(imageSrc: string): Promise<{ latitude: number | null, longitude: number | null, date: string, time: string }> {
    try {
      const file = await fetch(imageSrc).then(r => r.blob());
      const tags: any = ExifReader.load(await file.arrayBuffer());

      let latitude = null;
      let longitude = null;
      let date = null;
      let time = null;

      // Intentar obtener la ubicación de los metadatos EXIF
      if (tags.GPSLatitude && tags.GPSLongitude && tags.GPSLatitudeRef && tags.GPSLongitudeRef) {
        latitude = this.convertDMSToDD(tags.GPSLatitude.description, tags.GPSLatitudeRef.description);
        longitude = this.convertDMSToDD(tags.GPSLongitude.description, tags.GPSLongitudeRef.description);
      }

      // Intentar obtener la fecha y hora de los metadatos EXIF
      if (tags.DateTime) {
        const timestamp = tags.DateTime.description;
        const [datePart, timePart] = timestamp.split(' ');
        date = datePart.split(':').join('-');  // Formato de la fecha
        time = timePart;
      }

      // Si no se encuentra la información, usar la ubicación actual
      if (!latitude || !longitude || !date || !time) {
        const fallbackLocation = await this.getCurrentLocation();
        latitude = latitude || fallbackLocation.latitude;
        longitude = longitude || fallbackLocation.longitude;
        date = date || fallbackLocation.date;
        time = time || fallbackLocation.time;
      }

      return { latitude, longitude, date, time };

    } catch (error) {
      console.error('Error obteniendo los metadatos EXIF o la geolocalización', error);
      // En caso de error, también usar la ubicación actual como respaldo
      return this.getCurrentLocation();
    }
  }

  async getCurrentLocation(): Promise<{ latitude: number | null, longitude: number | null, date: string, time: string }> {
    try {
      const position = await Geolocation.getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const timestamp = new Date(position.timestamp);

      const date = timestamp.toLocaleDateString();
      const time = timestamp.toLocaleTimeString();

      return { latitude, longitude, date, time };
    } catch (error) {
      console.error('Error obteniendo la geolocalización', error);
      const now = new Date();
      return { latitude: null, longitude: null, date: now.toLocaleDateString(), time: now.toLocaleTimeString() };
    }
  }

  convertDMSToDD(dms: number, ref: string): number {
    const refDescription = ref.toLowerCase();
    if (refDescription.includes('south') || refDescription.includes('west')) {
      dms = dms * -1;
    }

    return dms;
  }


  async getApproximateLocation(latitude: number, longitude: number): Promise<string> {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_API_KEY`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      return 'Ubicación desconocida';
    }
  }
}
