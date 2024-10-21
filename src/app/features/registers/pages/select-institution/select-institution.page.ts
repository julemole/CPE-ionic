import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonItem, IonCardHeader, IonCard, IonCardContent, IonCardTitle, IonAccordion, IonAccordionGroup, IonList, IonLabel, IonButton, IonIcon, LoadingController } from '@ionic/angular/standalone';
import { RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { UserService } from '../../../menu/services/user.service';
import { LocalStorageService } from '../../../../core/services/local-storage.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-select-institution',
  templateUrl: './select-institution.page.html',
  styleUrls: ['./select-institution.page.scss'],
  standalone: true,
  imports: [IonList, IonLabel, IonCard, IonButton, IonIcon, IonCardContent, IonCardTitle, IonCardHeader, IonAccordion, IonAccordionGroup, IonItem, IonButtons, IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, RouterLinkWithHref]
})
export class SelectInstitutionPage implements OnInit {

  tutorInfo: any;
  zonesList: any[] = [];
  loading!: HTMLIonLoadingElement;

  constructor(private userService: UserService, private localStorageSv: LocalStorageService, private loadingController: LoadingController) {
    addIcons({documentTextOutline});
  }

  ngOnInit(): void {
    const idUser = this.localStorageSv.getItem('USER_ID');
    if(idUser) {
      this.showLoading();
      this.getCompleteData(idUser);
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
            sedes
          }
        });
        this.hideLoading();
        console.log(this.zonesList)
        // const allOfficesGroups = this.zonesList.flatMap((zone: any) => zone.officesGroups);
        // const uniqueGroups = allOfficesGroups.filter((group: any, index: number, self: any[]) =>
        //   index === self.findIndex((g: any) => g.id === group.id)
        // );
        // this.groups = uniqueGroups;
        // this.loadData();
      },
      error: (error) => {
        console.log(error)
        this.hideLoading();
      }
    });
  }

  async showLoading() {
    this.loading = await this.loadingController.create();
    await this.loading.present();
  }

  async hideLoading() {
    await this.loading.dismiss();
  }

}
