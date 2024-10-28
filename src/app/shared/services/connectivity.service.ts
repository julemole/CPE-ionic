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
  }

  private initializeNetworkListener() {
    Network.addListener('networkStatusChange', (status) => {
      this.isOnline.set(status.connected);
    });
  }

  getNetworkStatus() {
    return this.isOnline;
  }

}
