import { Component, signal, WritableSignal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  eyeOffOutline,
  personCircleOutline,
  lockClosedOutline, personOutline } from 'ionicons/icons';
import {
  IonContent,
  IonInput,
  IonIcon,
  IonButton,
  AlertController,
  LoadingController,
  Platform,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.interface';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';
import { DatabaseService } from 'src/app/shared/services/database.service';
import { SyncDataService } from '../../../../shared/services/sync-data.service';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLinkWithHref,
    BannerGovComponent,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
  ],
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  isOnline: WritableSignal<boolean> = signal(true);

  loginForm: FormGroup;
  email!: FormControl;
  password!: FormControl;
  showPass: boolean = false;
  loading: HTMLIonLoadingElement | null = null;
  message: string = '';

  constructor(
    private fb: FormBuilder,
    private alertController: AlertController,
    private router: Router,
    private loadingController: LoadingController,
    private connectivityService: ConnectivityService,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    private dbService: DatabaseService,
    private syncDataService: SyncDataService,
    private platform: Platform
  ) {
    addIcons({personOutline,eyeOffOutline,eyeOutline,lockClosedOutline,personCircleOutline,});
    this.isOnline = this.connectivityService.getNetworkStatus();
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.email = this.loginForm.get('email') as FormControl;
    this.password = this.loginForm.get('password') as FormControl;
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    const credentials = {
      name: email,
      pass: password,
    };

    this.message = 'Iniciando sesión...';
    await this.showLoading();

    if (this.isOnline()) {
      this.authService.signIn(credentials).subscribe({
        next: (data: AuthResponse) => {
          const token = this.authService.generateBase64Token(email, password);
          if (token) this.localStorageService.setItem('TOKEN', token);
          this.localStorageService.setItem('LOGOUT_TOKEN', data.logout_token);
          this.localStorageService.setItem('CSRF_TOKEN', data.csrf_token);
          this.getUserId(token, password);
        },
        error: (error) => {
          this.hideLoading();
          this.alert('Usuario o contraseña incorrectos');
        },
      });
    } else {
      try {
        const data = await this.authService.signInOffline(credentials);
        this.localStorageService.setItem('TOKEN', data.token);
        this.localStorageService.setItem('USER_ID', data.user.uuid);
        await this.hideLoading();
        this.router.navigate(['/home']);
      } catch (error: any) {
        this.alert(error.message);
      } finally {
        await this.hideLoading();
      }
    }
  }

  getUserId(token: string, pass: string): void {
    this.authService.getUserId(token).subscribe({
      next: (id) => {
        this.localStorageService.setItem('USER_ID', id);
        if (this.platform.is('hybrid')) {
          this.synchronizeData(id, pass);
        } else {
          this.hideLoading();
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        this.localStorageService.clearStorage();
        this.hideLoading();
        this.alert('Error obteniendo el id del usuario');
      },
    });
  }

  async synchronizeData(idUser: string, pass: string) {
    try {
      if (await this.dbService.isDbReady()) {
        const syncLogs = await this.dbService.loadSyncLogs();
        const user = await this.dbService.getUserById(idUser);
        const passBasic = btoa(pass);

        if (!user?.password) {
          await this.hideLoading();
          this.message = 'Descargando información requerida...';
          await this.showLoading();

          try {
            if (syncLogs.length) {
              await this.syncDataService.newUserData(idUser, passBasic);
            } else {
              await this.syncDataService.syncAllData(idUser, passBasic);
            }
            this.hideLoading();
            this.router.navigate(['/home']);
          } catch (error: any) {
            // Limpiar almacenamiento local y mostrar el mensaje específico del error HTTP
            this.localStorageService.clearStorage();
            this.hideLoading();
            this.alert(`Error descargando la información: ${error.message || error?.error?.message || 'Error en servicio HTTP'}`);
            this.dbService.resetDatabase();
          }
        } else {
          if (user.password === passBasic) {
            this.hideLoading();
            this.router.navigate(['/home']);
          } else {
            try {
              await this.dbService.updateUserPasswordById(idUser, passBasic);
              this.hideLoading();
              this.router.navigate(['/home']);
            } catch (error: any) {
              // Limpiar almacenamiento local y mostrar el mensaje específico del error en la base de datos
              this.localStorageService.clearStorage();
              this.hideLoading();
              this.alert(`Error actualizando la contraseña en la base de datos: ${error.message}`);
            }
          }
        }
      } else {
        // Limpiar almacenamiento local y mostrar mensaje de error en la creación de la base de datos
        this.localStorageService.clearStorage();
        this.hideLoading();
        this.alert('Error en la creación de la base de datos, intente nuevamente');
      }
    } catch (dbError: any) {
      // Limpiar almacenamiento local y mostrar mensaje específico del error en la base de datos
      this.localStorageService.clearStorage();
      this.hideLoading();
      this.alert(`Error al acceder a la base de datos local: ${dbError.message || 'Error en la base de datos'}`);
      await this.dbService.resetDatabase();
    }
  }



  showPassword() {
    this.showPass = !this.showPass;
  }

  async alert(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message,
      buttons: [
        {
          text: 'Ok',
        },
      ],
    });

    await alert.present();
  }

  async showLoading() {
    if (!this.loading) {
      this.loading = await this.loadingController.create({
        message: this.message,
      });
      await this.loading.present();
    }
  }

  async hideLoading() {
    if (this.loading) {
      await this.loading.dismiss();
      this.loading = null;
    }
  }
}
