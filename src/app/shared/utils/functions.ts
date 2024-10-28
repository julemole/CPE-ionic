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

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          // Verificar si la carpeta existe y crearla si no
          await ensureDirectoryExists('documents');

          // Convertir el resultado del reader en base64
          const base64data = reader.result as string;

          const cleanFileName = file.filename.replace(/[^a-zA-Z0-9.]/g, '_');

          // Guardar el archivo en la ruta local del dispositivo
          const savedFile = await Filesystem.downloadFile({
            url: file.url,
            path: `documents/${cleanFileName}`, // Carpeta donde guardas los archivos
            progress: true,
            recursive: true,
            directory: Directory.Data, // Usar el directorio correcto
          });

          // Mostrar la ruta donde se guardó el archivo en la consola
          console.log('Archivo guardado correctamente en la ruta:', savedFile.path);

          // Devolver la ruta donde se guardó el archivo
          resolve(savedFile.path!);
        } catch (error: any) {
          reject(`Error guardando el archivo: ${error.message}`);
        }
      };

      reader.onerror = () => {
        reject('Error al leer el archivo');
      };

      // Verificar si el archivo es una imagen o no
      if (blob.type.includes('image')) {
        reader.readAsDataURL(blob); // Manejar imágenes como base64
      } else {
        reader.readAsDataURL(blob); // Convertir otros archivos en base64 también
      }
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
          // Verificar si la carpeta existe y crearla si no
          await ensureDirectoryExists('documents');

          // Convertir el resultado del reader en base64
          const base64data = reader.result as string;

          // Limpiar el nombre del archivo
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');

          // Guardar el archivo en la ruta local del dispositivo
          const savedFile = await Filesystem.writeFile({
            path: `documents/${cleanFileName}`, // Carpeta donde guardas los archivos
            data: base64data.split(',')[1], // Eliminar el prefijo de datos base64
            directory: Directory.Data, // Usar el directorio correcto
          });

          const normalizedPath = normalizeFilePath(savedFile.uri);

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

// Función para asegurarse de que la carpeta existe
const ensureDirectoryExists = async (path: string) => {
  try {
    await Filesystem.mkdir({
      path,
      directory: Directory.Data,
      recursive: true, // Crear la carpeta de forma recursiva si no existe
    });
    console.log(`Directorio ${path} creado exitosamente o ya existe`);
  } catch (error: any) {
    // Ignorar el error si la carpeta ya existe
    if (error.message !== 'Directory exists') {
      console.error(`Error al crear el directorio ${path}:`, error);
      throw error;
    } else {
      console.log(`Directorio ${path} ya existe`);
    }
  }
};

export const loadSignatureFile = async (signaturePath: string): Promise<string | null> => {
  const relativePath = extractFilePath(signaturePath);
  const extension = relativePath.split('.').pop();

  if (!extension) {
    console.error('No se pudo determinar la extensión del archivo');
    return null;
  }

  const mimeType = getMimeType(extension);

  try {
    const readFile = await Filesystem.readFile({
      path: relativePath,
      directory: Directory.Data,
    });

    return `data:${mimeType};base64,${readFile.data}`;
  } catch (error) {
    console.error('Error leyendo el archivo de firma:', error);
    return null;
  }
};

export const getInfoFile = async (filePath: string): Promise<{file: string,  name: string, extension: string, mimeType: string }> => {
  const relativePath = extractFilePath(filePath);
  const name = relativePath.split('/').pop() || '';
  const extension = relativePath.split('.').pop();

  if (!extension) {
    console.error('No se pudo determinar la extensión del archivo');
    throw new Error('No se pudo determinar la extensión del archivo');
  }

  const mimeType = getMimeType(extension);

  try {
    const readFile = await Filesystem.readFile({
      path: relativePath,
      directory: Directory.Data,
    });

    return {file: `data:${mimeType};base64,${readFile.data}`, name, extension, mimeType};
  } catch (error) {
    console.error('Error leyendo el archivo de firma:', error);
    throw error;
  }
};

const extractFilePath = (fullPath: string): string => {
  const folderName = 'documents';
  const folderIndex = fullPath.indexOf(folderName);

  if (folderIndex !== -1) {
    return fullPath.substring(folderIndex);
  } else {
    throw new Error(`La ruta no contiene la carpeta "${folderName}"`);
  }
};

const getMimeType = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    // Agrega más tipos MIME según sea necesario
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

const normalizeFilePath = (filePath: string): string => {
  if (filePath.startsWith('file://')) {
    return filePath.substring(7); // Remueve 'file://'
  }
  return filePath;
}


