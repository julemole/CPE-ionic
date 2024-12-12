import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonProgressBar,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonCardTitle,
  IonAccordion,
  IonAccordionGroup,
  IonList,
  IonLabel,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { UserService } from '../../../menu/services/user.service';
import { LocalStorageService } from '../../../../core/services/local-storage.service';
import { forkJoin } from 'rxjs';
import { ConnectivityService } from '../../../../shared/services/connectivity.service';
import { SaveInSessionService } from '../../../../shared/services/save-in-session.service';

@Component({
  selector: 'app-select-institution',
  templateUrl: './select-institution.page.html',
  styleUrls: ['./select-institution.page.scss'],
  standalone: true,
  imports: [
    IonList,
    IonProgressBar,
    IonLabel,
    IonButton,
    IonIcon,
    IonCardTitle,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonButtons,
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
  ],
})
export class SelectInstitutionPage implements OnInit {
  isOnline: WritableSignal<boolean> = signal(true);
  isLoading: boolean = false;

  tutorInfo: any;
  zonesList: any[] = [];
  accordionValues: string[] = [];

  constructor(
    private userService: UserService,
    private localStorageSv: LocalStorageService,
    private connectivityService: ConnectivityService,
    private saveInSessionService: SaveInSessionService,
    private router: Router,
  ) {
    addIcons({ documentTextOutline });
    this.isOnline = connectivityService.getNetworkStatus();
  }

  async ngOnInit() {
    const idUser = this.localStorageSv.getItem('USER_ID');
    if (idUser) {
      if(this.isOnline()){
        this.isLoading = true;
        this.getCompleteData(idUser);
      } else {
        await this.getOfflineUserData(idUser);
      }
    }
  }

  navigateWithState(teacherId: any, institution: string, institutionBased: string, id: string) {
    this.saveInSessionService.cleanAllData();
    const currentUrl = this.router.url;
    if (teacherId && institution) {
      this.router.navigate([`${currentUrl}/${teacherId}`], { state: { institution, institutionBased, id } });
    } else {
      console.error('Teacher ID or institution is undefined');
    }
  }

  getCompleteData(user_id: string): void {
    const userInfo = this.userService.getUserInfo(user_id);
    const zonesWithSedes = this.userService.getZonesWithSedesByTutor(user_id);

    forkJoin([userInfo, zonesWithSedes]).subscribe({
      next: ([userInfo, zonesWithSedes]) => {
        this.tutorInfo = userInfo;
        this.zonesList = zonesWithSedes.map((zone: any) => {
          const ofGroups = zone.officesGroups;
          const sedes = ofGroups.flatMap((group: any) => group.groupOffices);
          return {
            ...zone,
            sedes,
          };
        });
        this.accordionValues = this.zonesList.map((zone) => zone.id);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.log(error);
      },
    });
  }

  async getOfflineUserData(user_id: string) {
    try {
      const userInfo = await this.userService.getUserInfOffline(user_id);
      if (userInfo) {
        this.tutorInfo = userInfo;
      }
      const zones = await this.userService.getZonesBytutor(user_id);
      this.zonesList = zones.map((zone: any) => {
        const ofGroups = zone.sedes_groups;
        const sedes = ofGroups.flatMap((group: any) => group.sedes);
        return {
          ...zone,
          sedes,
        };
      });
      this.accordionValues = this.zonesList.map((zone) => zone.uuid);
    } catch (error: any) {
      console.log(error);
    }
  }
}
