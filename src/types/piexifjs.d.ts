declare module 'piexifjs' {
  export function load(data: string): any;
  export function dump(exifObject: any): string;
  export function insert(exifBytes: string, data: string): string;
  export function remove(data: string): string;

  export const ImageIFD: {
    DateTime: string;
  };

  export const GPSIFD: {
    GPSLatitude: string;
    GPSLatitudeRef: string;
    GPSLongitude: string;
    GPSLongitudeRef: string;
  };
}
