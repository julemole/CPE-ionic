import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonList,
  IonInput,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonButton,
  IonCol,
  IonGrid,
  IonRow, IonProgressBar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  personCircleOutline,
  logOutOutline, refreshOutline } from 'ionicons/icons';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { forkJoin } from 'rxjs';
import { ConnectivityService } from 'src/app/shared/services/connectivity.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonProgressBar,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class ProfilePage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);

  userInfo: any;
  tutorName: string = '';
  documentType: string = '';
  identification: string = '';
  email: string = '';
  username: string = '';
  department: string = '';
  route: string = '';
  isLoading: boolean = false;

  zonesList: any[] = [];
  groups: any[] = [];

  constructor(
    private router: Router,
    private localStorageSv: LocalStorageService,
    private userService: UserService,
    private connectivityService: ConnectivityService,
  ) {
    addIcons({personCircleOutline,refreshOutline,logOutOutline,personOutline});
    this.isOnline = this.connectivityService.getNetworkStatus();
  }

  async ngOnInit() {
    const user_id = this.localStorageSv.getItem('USER_ID');
    if (user_id) {
      if (this.isOnline()) {
        this.isLoading = true;
        this.getCompleteData(user_id);
      } else {
        await this.getOfflineUserData(user_id);
      }
    }
  }

  getCompleteData(user_id: string): void {
    const userInfo = this.userService.getUserInfo(user_id);
    const zonesWithSedes = this.userService.getZonesWithSedesByTutor(user_id);

    forkJoin([userInfo, zonesWithSedes]).subscribe({
      next: ([userInfo, zonesWithSedes]) => {
        this.userInfo = userInfo;
        this.zonesList = zonesWithSedes;
        const allOfficesGroups = this.zonesList.flatMap(
          (zone: any) => zone.officesGroups
        );
        const uniqueGroups = allOfficesGroups.filter(
          (group: any, index: number, self: any[]) =>
            index === self.findIndex((g: any) => g.id === group.id)
        );
        this.groups = uniqueGroups;
        this.loadData();
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
      },
    });
  }

  async getOfflineUserData(user_id: string) {
    try {
      const userInfo = await this.userService.getUserInfOffline(user_id);
      if (userInfo) {
        this.userInfo = userInfo;
        this.tutorName = userInfo.full_name || '';
        this.documentType = userInfo.document_type || '';
        this.identification = userInfo.document_number || '';
        this.email = userInfo.mail || '';
        this.username = userInfo.username || '';
        this.department = userInfo.department || '';
      }

      this.zonesList = await this.userService.getZonesBytutor(user_id);
      this.groups = this.zonesList.flatMap((zone: any) => zone.sedes_groups);
    } catch (error: any) {
      console.log(error);
    }
  }

  logout(): void {
    this.localStorageSv.clearStorage();
    this.router.navigate(['/login']);
  }

  loadData(): void {
    this.tutorName = this.userInfo.field_names;
    this.documentType = this.userInfo.field_document_type;
    this.identification = this.userInfo.field_document_number;
    this.email = this.userInfo.mail;
    this.username = this.userInfo.username;
    this.department = this.userInfo.field_department;
    this.isLoading = false;
  }

  goToChangePage(): void {
    this.router.navigate(['/change-pass']);
  }
}
