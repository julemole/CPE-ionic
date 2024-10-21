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

export const downloadAndSaveFile = async (img: {url: string, filename: string}): Promise<string> => {
  try {
    // Descargar el archivo desde la URL
    const response = await fetch(img.url);
    if (!response.ok) {
      throw new Error('Error al descargar el archivo');
    }
    const blob = await response.blob();

    // Convertir el archivo en base64 para almacenarlo
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;

          // Verificar si la carpeta existe y crearla si no
          await ensureDirectoryExists('images');

          // Guardar el archivo en la ruta local del dispositivo
          const savedFile = await Filesystem.writeFile({
            path: `images/${img.filename}`, // Puedes ajustar la carpeta según tu preferencia
            data: base64data.split(',')[1], // Eliminar el prefijo de datos base64
            directory: Directory.Data, // Puedes elegir Documents, Data o Cache
          });

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

// Función para asegurarse de que la carpeta existe
const ensureDirectoryExists = async (path: string) => {
  try {
    await Filesystem.mkdir({
      path,
      directory: Directory.Data,
      recursive: true, // Crear la carpeta de forma recursiva si no existe
    });
  } catch (error: any) {
    // Ignorar el error si la carpeta ya existe
    if (error.message !== 'Directory exists') {
      throw error;
    }
  }
};
