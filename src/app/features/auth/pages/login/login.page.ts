import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, personCircleOutline } from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonIcon,
  IonButton, IonItem, AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { AuthResponse } from '../../models/auth.interface';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { BannerGovComponent } from 'src/app/shared/components/banner-gov/banner-gov.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLinkWithHref, BannerGovComponent, IonItem, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonInputPasswordToggle,IonIcon],
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  loginForm: FormGroup;
  email!: FormControl;
  password!: FormControl;
  showPass: boolean = false;

  constructor(private fb: FormBuilder, private alertController: AlertController, private router: Router, private authService: AuthService, private localStorageService: LocalStorageService) {
    addIcons({personCircleOutline,eyeOffOutline,eyeOutline});
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    this.email = this.loginForm.get('email') as FormControl;
    this.password = this.loginForm.get('password') as FormControl;
  }

  login() {
    if(this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.get('email')?.value;
    const password = this.loginForm.get('password')?.value;

    const credentials = {
      name: email,
      pass: password
    }
    this.authService.signIn(credentials).subscribe({
      next: (data: AuthResponse) => {
        const token = this.authService.generateBase64Token(email, password);
        if(token) this.localStorageService.setItem('TOKEN', token);
        this.localStorageService.setItem('LOGOUT_TOKEN', data.logout_token);
        this.localStorageService.setItem('CSRF_TOKEN', data.csrf_token);
        this.getUserId(token);
      },
      error: (error) => {
        this.alert();
      }
    })
  }

  getUserId(token: string): void {
    this.authService.getUserId(token).subscribe({
      next: (id) => {
        this.localStorageService.setItem('USER_ID', id);
        this.router.navigate(['/home']);
      }
    });
  }

  showPassword() {
    this.showPass = !this.showPass;
  }

  async alert() {
    const alert = await this.alertController.create({
      header: 'Error',
      cssClass: 'error-alert',
      message: 'Usuario o contraseña incorrectos',
      buttons: [
        {
          text: 'Ok',
        }
      ]
    });

    await alert.present();
  }

}
