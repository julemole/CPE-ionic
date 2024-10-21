import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { DatabaseService } from './shared/services/database.service';
import { ConnectivityService } from './shared/services/connectivity.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private readonly database: DatabaseService, private connectivityService: ConnectivityService) {
    this.initApp();
  }

  async initApp() {
    try {
      await this.database.initilizPlugin();
      SplashScreen.hide();
      console.log('Base de datos inicializada');
    } catch (error) {
      console.error('Error inicializando la base de datos', error);
    }

  }
}
