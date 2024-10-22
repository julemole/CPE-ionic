import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const base64ToBlob = (base64: string, contentType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
}

export const convertFileToBase64String = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;

      if (!result) {
        reject('result is null');
        return;
      }

      resolve(reader.result.toString());
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

export const downloadAndSaveFile = async (file: {url: string, filename: string}): Promise<string> => {
  try {
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error('Error al descargar el archivo');
    }
    const blob = await response.blob();

    // Crear un lector de archivos
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {

          const base64data = reader.result as string;
          console.log('BASE 6464646464646464646464664', file.filename, base64data)

          const savedFile = await Filesystem.writeFile({
            path: `${file.filename}`,
            data: base64data.split(',')[1],
            directory: Directory.Documents,
          });

          console.log('Archivo guardado correctamente en la ruta:', savedFile.uri);

          // Devolver la ruta donde se guardó el archivo
          resolve(savedFile.uri);
        } catch (error: any) {
          reject(`Error guardando el archivo: ${error.message}`);
        }
      };

      reader.onerror = () => {
        reject('Error al leer el archivo');
      };
    });
  } catch (error) {
    console.error('Error descargando o guardando el archivo', error);
    throw error;
  }
};

export const saveFileInDevice = async (file: File): Promise<string> => {
  try {
    // Crear un lector de archivos
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          // Convertir el resultado del reader en base64
          const base64data = reader.result as string;

          // Guardar el archivo en la ruta local del dispositivo
          const savedFile = await Filesystem.writeFile({
            path: `documents/${file.name}`, // Carpeta donde guardas los archivos
            data: base64data.split(',')[1], // Eliminar el prefijo de datos base64
            directory: Directory.Documents, // Usar el directorio correcto
          });

          // Mostrar la ruta donde se guardó el archivo en la consola
          console.log('Archivo guardado correctamente en la ruta:', savedFile.uri);

          // Devolver la ruta donde se guardó el archivo
          resolve(savedFile.uri);
        } catch (error: any) {
          reject(`Error guardando el archivo: ${error.message}`);
        }
      };

      reader.onerror = () => {
        reject('Error al leer el archivo');
      };

      // Convertir el archivo en base64
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error guardando el archivo', error);
    throw error;
  }
};


export const loadSignatureImage = async (signaturePath: string): Promise<string | null> => {
  try {
    const readFile = await Filesystem.readFile({
      path: signaturePath
    });

    return `data:image/png;base64,${readFile.data}`;
  } catch (error) {
    console.error('Error leyendo el archivo de firma:', error);
    return null;
  }
}

