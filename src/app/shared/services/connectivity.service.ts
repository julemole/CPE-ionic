import { Injectable, signal, WritableSignal } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private isOnline: WritableSignal<boolean> = signal(true);

  constructor() {
    this.initializeNetworkListener();
    this.checkNetworkStatus();
  }

  async checkNetworkStatus() {
    const status = await Network.getStatus();
    this.isOnline.set(status.connected);
    this.handleNetworkChange(status.connected);
  }

  private initializeNetworkListener() {
    Network.addListener('networkStatusChange', (status) => {
      this.isOnline.set(status.connected);
      this.handleNetworkChange(status.connected);
    });
  }

  private handleNetworkChange(isOnline: boolean) {
    console.log(`Estado de la red: ${isOnline ? 'Con conexión' : 'Sin conexión'}`);
    console.log(isOnline)
  }

  getNetworkStatus() {
    return this.isOnline;
  }

}
