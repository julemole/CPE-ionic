import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonIcon, IonItem, IonList, IonInput, IonLabel, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonButton, IonInput, IonLabel, IonCard, IonCardTitle, IonCardHeader, IonCardContent, IonList, IonItem, IonIcon, IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit{

  userInfo: any;
  tutorName: string = '';
  identification: string = '';
  email: string = '';
  department: string = '';
  route: string = '';

  constructor(private router: Router, private authService: AuthService, private localStorageSv: LocalStorageService, private userService: UserService) {
    addIcons({personOutline});
  }

  ngOnInit(): void {
    const user_id = this.localStorageSv.getItem('USER_ID');
    if(user_id) {
      this.getUserInfo(user_id);
    }
  }

  getUserInfo(user_id: string): void {
    this.userService.getUserInfo(user_id).subscribe({
      next: (data: any) => {
        this.loadData(data);
      }
    });
  }

  logout(): void {
    this.localStorageSv.clearStorage();
    this.router.navigate(['/login']);
    // const logoutToken = this.localStorageSv.getItem('LOGOUT_TOKEN');
    // const csrfToken = this.localStorageSv.getItem('CSRF_TOKEN');
    // if(logoutToken && csrfToken) {
    //   this.authService.logout(logoutToken, csrfToken).subscribe({
    //     next: () => {
    //     }
    //   });
    // }
  }

  loadData(data: any): void {
    this.userInfo = data;
    this.tutorName = data.field_names;
    this.identification = data.field_document_number;
    this.email = data.mail;
    // this.department = data.department;
    // this.route = data.route;
  }

}
