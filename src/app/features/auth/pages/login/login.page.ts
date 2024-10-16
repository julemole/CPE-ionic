import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonIcon,
  IonButton, IonItem } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLinkWithHref, IonItem, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonInputPasswordToggle,IonIcon],
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {

  loginForm: FormGroup;
  email!: FormControl;
  password!: FormControl;
  showPass: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    addIcons({ eyeOutline, eyeOffOutline });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.email = this.loginForm.get('email') as FormControl;
    this.password = this.loginForm.get('password') as FormControl;
  }

  login() {
    if(this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.email?.value;
    const password = this.password?.value;
    this.authService.signIn(email, password).subscribe({
      next: (res) => {
        this.setPersistenceInfo(res);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        if(err.message == 'The used authentication method is not allowed on this route.') localStorage.clear();
        console.log(err);
      },
    })
  }

  setPersistenceInfo(data:any){
    const authToken = this.authService.getAuthorizationToken(this.email.value, this.password.value);
    // this.localStorageService.setItem('authToken', authToken);
    // this.localStorageService.setItem('current_user_roles', JSON.stringify(data?.current_user.roles));
  }

  showPassword() {
    this.showPass = !this.showPass;
  }

}
