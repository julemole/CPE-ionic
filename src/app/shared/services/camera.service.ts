// src/app/services/camera.service.ts
import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, Platform } from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import * as ExifReader from 'exifreader';
import { blobToFile } from 'src/app/shared/utils/functions';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor(private alertController: AlertController, private platform: Platform) {}

  async takePictureScan(isOnline: boolean = true): Promise<{ imagePath: string, file: File }> {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 80,
        saveToGallery: true,
      });

      if (!image.webPath) {
        throw new Error("No se pudo obtener la ruta de la imagen.");
      }

      const imagePath = image.webPath;
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const timestamp = new Date().getTime();
      const fileName = isOnline ? `ann.jpg` : `ann${timestamp}.jpg`;
      const file = blobToFile(blob, fileName);

      return { imagePath, file };
    } catch (error) {
      console.error("Error al tomar la foto y escanear:", error);
      throw error;
    }
  }

  /*
    * Tomar una foto y obtener la información de la misma
    * @returns Objeto con la URL de la imagen, el archivo, la latitud, longitud, fecha y hora de la imagen
  */
  async takePictureAndGetData(isOnline: boolean = true): Promise<{
    imagePath: string,
    file: File,
    latitude: number | null,
    longitude: number | null,
    date: string,
    time: string
  }> {
    try {
      // Capturar imagen usando la cámara
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 80,
        saveToGallery: true, // Guardar imagen en galería
      });

      if (!image.webPath) {
        throw new Error('No se pudo obtener la imagen de la cámara.');
      }

      const imagePath = image.webPath;
      const response = await fetch(imagePath);
      const blob = await response.blob();

      // Inicializar variables de ubicación, fecha y hora
      let latitude: number | null = null;
      let longitude: number | null = null;
      let date: string;
      let time: string;

      try {
        // Obtener permisos y geolocalización
        if (this.platform.is('hybrid')) {
          const hasPermission = await Geolocation.requestPermissions();
          if (hasPermission.location !== 'granted') {
            throw new Error('Permiso de ubicación denegado, por favor habilítalo en la configuración de tu dispositivo.');
          }
        }

        const position = await Geolocation.getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;

        const timestamp = new Date(position.timestamp);
        date = timestamp.toLocaleDateString();
        time = timestamp.toLocaleTimeString();

      } catch (geoError) {
        console.error('Error obteniendo la geolocalización:', geoError);
        const now = new Date();
        date = now.toLocaleDateString();
        time = now.toLocaleTimeString();

        // Lanza el error para manejarlo en el flujo principal
        throw new Error('No se pudo obtener la ubicación. Se usará la fecha y hora actual.');
      }

      // Procesar la imagen para agregar texto (datos de ubicación y fecha/hora)
      const processedImage = await this.addTextToImage(blob, latitude, longitude, date, time);
      const processedBlob = await fetch(processedImage).then(res => res.blob());

      // Generar un nombre automático para el archivo
      const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 15); // Formato YYYYMMDD_HHMMSS
      let fileName = '';
      if(isOnline){
        fileName = 'ev.jpg';
      } else {
        fileName = `ev${timestamp}.jpg`
      }

      // Convertir a archivo final
      const file = blobToFile(processedBlob, fileName);

      return { imagePath: processedImage, file, latitude, longitude, date, time };

    } catch (error: any) {
      throw new Error(`No se pudo completar la operación: ${error.message || error}`);
    }
  }

  async addTextToImage(
    blob: Blob,
    latitude: number | null,
    longitude: number | null,
    date: string,
    time: string
  ): Promise<string> {
    let address = 'Ubicación no disponible';
    if (latitude !== null && longitude !== null) {
      try {
        address = await this.getAddressFromCoordinates(latitude, longitude);
      } catch (error) {
        console.error('Error obteniendo la dirección aproximada:', error);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Configurar tamaño del canvas
          canvas.width = img.width;
          canvas.height = img.height;

          // Dibujar la imagen original
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Configurar el tamaño dinámico del texto
          const baseFontSize = 0.015; // Proporción del tamaño de la fuente basada en el alto de la imagen
          const fontSize = Math.round(canvas.height * baseFontSize);
          const lineHeight = fontSize * 1.1; // Altura entre líneas
          ctx.font = `bold ${fontSize}px Arial`; // Tamaño dinámico de la fuente
          ctx.fillStyle = 'white'; // Letra blanca
          ctx.textBaseline = 'top'; // Alinear en la parte superior

          // Configurar el contenedor negro con opacidad
          const padding = fontSize * 0.3; // Padding proporcional al tamaño de la fuente
          const maxWidth = canvas.width * 0.9; // Máximo ancho del contenedor (90% del ancho de la imagen)
          let currentY = padding; // Coordenada Y inicial
          let rectHeight = 0;

          // Calcular las líneas de texto dinámicamente
          const lines = [
            address,
            latitude !== null && longitude !== null
              ? `Lat ${latitude}° Long ${longitude}°`
              : '',
            `${date} ${time}`,
          ].filter(line => line); // Filtrar líneas vacías

          rectHeight = lines.length * lineHeight + padding * 2;

          // Dibujar el fondo negro con opacidad
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(
            canvas.width - maxWidth - padding,
            padding,
            maxWidth + padding * 2,
            rectHeight
          );

          // Dibujar el texto dentro del contenedor
          ctx.fillStyle = 'white';
          lines.forEach(line => {
            ctx.fillText(line, canvas.width - maxWidth, currentY, maxWidth);
            currentY += lineHeight; // Incrementar la posición vertical
          });

          // Exportar la imagen del canvas
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    const apiKey = '295731c1b4ac4ea68be015c89be0e96a';
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted;
    }

    return 'Dirección no disponible';
  }

  /*
    * Obtener la ubicación y la fecha de una imagen
    * @param imageSrc URL de la imagen
    * @returns Objeto con la latitud, longitud, fecha y hora de la imagen
  */

  async getLocationForImage(imageSrc: string): Promise<{ latitude: number | null, longitude: number | null, date: string, time: string, tags?: any }> {
    try {
      const file = await fetch(imageSrc).then(r => r.blob());
      const tags: any = ExifReader.load(await file.arrayBuffer());

      console.log(JSON.stringify(tags, null, 2));

      let latitude = null;
      let longitude = null;
      let date = null;
      let time = null;

      // Verificar si existen datos GPS en los metadatos EXIF
      if (tags && tags.GPSLatitude && tags.GPSLongitude && tags.GPSLatitudeRef && tags.GPSLongitudeRef) {
        latitude = this.convertDMSToDD(tags.GPSLatitude.description, tags.GPSLatitudeRef.description);
        longitude = this.convertDMSToDD(tags.GPSLongitude.description, tags.GPSLongitudeRef.description);
      }

      if (tags.DateTimeOriginal) {
        const timestamp = tags.DateTimeOriginal.description;
        const [datePart, timePart] = timestamp.split(' ');
        date = datePart.split(':').join('-');
        time = timePart;
      } else if (tags.DateTime) {
        const timestamp = tags.DateTime.description;
        const [datePart, timePart] = timestamp.split(' ');
        date = datePart.split(':').join('-');
        time = timePart;
      }

      // Si faltan datos de ubicación, intentar obtener la ubicación actual
      if (!latitude || !longitude || !date || !time) {
        const confirmed = await this.warningAlert(
          'Advertencia',
          'No se encontraron datos de ubicación en la imagen. ¿Deseas usar tu ubicación actual?',
          [
            {
              text: 'Aceptar',
              handler: () => true,
            },
            {
              text: 'Cancelar',
              role: 'cancel',
              handler: () => false,
            }
          ]
      );

      if (!confirmed) {
        throw new Error('El usuario canceló el proceso al no aceptar usar la ubicación actual.');
      }

      const fallbackLocation = await this.getCurrentLocation();
        latitude = latitude || fallbackLocation.latitude;
        longitude = longitude || fallbackLocation.longitude;
        date = date || fallbackLocation.date;
        time = time || fallbackLocation.time;
      }

      return { latitude, longitude, date, time, tags };

    } catch (error) {
      console.error('Error obteniendo los metadatos EXIF o la geolocalización', error);
      throw error;
    }
  }

  async warningAlert(header: string, message: string, buttons: any[]): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        cssClass: 'warning-alert',
        message,
        buttons: buttons.map((button) => ({
            ...button,
            handler: () => {
              if (button.handler) button.handler();
              resolve(button.role !== 'cancel');
            }
        }))
      });
      await alert.present();
    });
  }


  /**
   * Obtener la ubicación actual
   * @returns Objeto con la latitud, longitud, fecha y hora actuales
  */
  async getCurrentLocation(): Promise<{ latitude: number | null, longitude: number | null, date: string, time: string }> {
    try {
      // Verificar si el usuario otorgó permiso para la geolocalización
      if(this.platform.is('hybrid')) {
        const hasPermission = await Geolocation.requestPermissions();
        if (hasPermission.location !== 'granted') {
          throw new Error('Permiso de ubicación denegado, por favor habilítalo en la configuración de tu dispositivo.');
        }
      }

      const position = await Geolocation.getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const timestamp = new Date(position.timestamp);

      const date = timestamp.toLocaleDateString();
      const time = timestamp.toLocaleTimeString();

      return { latitude, longitude, date, time };
    } catch (error) {
      console.error('Error obteniendo la geolocalización', error);
      throw error; // Lanzar el error para manejar en onFileSelected
    }
  }

  /*
    * Convertir coordenadas en grados, minutos y segundos a grados decimales
    * @param dms Coordenadas en grados, minutos y segundos
    * @param ref Referencia de la dirección (Norte, Sur, Este, Oeste)
    * @returns Coordenadas en grados decimales
  */
  convertDMSToDD(dms: number, ref: string): number {
    const refDescription = ref.toLowerCase();
    if (refDescription.includes('south') || refDescription.includes('west')) {
      dms = dms * -1;
    }

    return dms;
  }

}
