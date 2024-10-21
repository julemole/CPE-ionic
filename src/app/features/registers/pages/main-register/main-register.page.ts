import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonTabs, IonTabBar, IonTabButton, IonBackButton, IonSelect, IonIcon, IonLabel, IonList, IonItem, IonSelectOption, LoadingController } from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLinkWithHref } from '@angular/router';
import { addIcons } from 'ionicons';
import { camera, documentAttach, pencil, save, cameraOutline, documentAttachOutline, documentTextOutline, trashOutline } from 'ionicons/icons';
import { TaxonomyData } from 'src/app/shared/models/taxonomy.interface';
import { ParametricsService } from 'src/app/shared/services/parametrics.service';
import { forkJoin, of } from 'rxjs';
import { SaveInSessionService } from 'src/app/shared/services/save-in-session.service';
import { attachedData, PhotoData } from 'src/app/shared/models/save-in-session.interface';
import { RegistersService } from '../../services/registers.service';

@Component({
  selector: 'app-main-register',
  templateUrl: './main-register.page.html',
  styleUrls: ['./main-register.page.scss'],
  standalone: true,
  imports: [IonItem, IonList, IonSelectOption, IonContent, IonHeader, IonSelect, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton, CommonModule, FormsModule, ReactiveFormsModule, RouterLinkWithHref]
})
export class MainRegisterPage implements OnInit {

  idInstitution: string = '';
  idRegister: string = '';

  registerContent: any;

  fb: FormBuilder = inject(FormBuilder);
  registerForm: FormGroup = this.fb.group({
    approach: ['', [Validators.required]],
    activity: ['', [Validators.required]],
    subactivity: ['', [Validators.required]],
  });

  approachList: TaxonomyData[] = [];
  activitiesList: TaxonomyData[] = [];
  subactivitiesList: TaxonomyData[] = [];
  institution: any;

  photoData: WritableSignal<PhotoData[]> = signal<PhotoData[]>([]);
  attachedData: WritableSignal<attachedData[]> = signal<attachedData[]>([]);

  loading!: HTMLIonLoadingElement;

  constructor(private aRoute: ActivatedRoute, private parametricsService: ParametricsService, private loadingController: LoadingController,
    private saveInSessionService: SaveInSessionService, private registersService: RegistersService) {
    addIcons({documentTextOutline,trashOutline,cameraOutline,documentAttachOutline,camera,documentAttach,pencil,save});
    this.photoData = this.saveInSessionService.getPhotoData();
    this.attachedData = this.saveInSessionService.getAttachedData();

    this.registerForm.valueChanges.subscribe({
      next: () => {
        if(this.registerForm.valid){
          console.log('hola')
          saveInSessionService.saveRegisterPayload(this.registerForm.getRawValue());
        }
      }
    })
  }

  //controles
  get approach() {
    return this.registerForm.get('approach') as FormControl;
  }
  get activity() {
    return this.registerForm.get('activity') as FormControl;
  }
  get subactivity() {
    return this.registerForm.get('subactivity') as FormControl;
  }

  ngOnInit(): void {
    this.idInstitution = this.aRoute.snapshot.params['idInstitution'];
    this.idRegister = this.aRoute.snapshot.params['idRegister'];
    if(this.idInstitution || this.idRegister){
      this.showLoading();
      this.getTaxonomies();
    }
  }

  getRegisterData(): void {
    this.registersService.getRegisterById(this.idRegister).subscribe({
      next: (resp) => {
        this.registerContent = resp;
        console.log(resp)
        this.loadDataRegister();
      },
      error: (error) => {
        console.error(error);
        this.hideLoading();
      }
    });
  }

  loadDataRegister(): void {
    const {field_approach, field_activities, field_sub_activities} = this.registerContent.relationships;

    this.registerForm.patchValue({
      approach: field_approach.data ? field_approach.data.id : '',
      activity: field_activities.data ? field_activities.data.id : '',
      subactivity: field_sub_activities.data ? field_sub_activities.data.id : '',
    })

    this.registerForm.disable();

    this.hideLoading();

  }

  getTaxonomies(): void {
    const approachList = this.parametricsService.getTaxonomyItems('approach');
    const activitiesList = this.parametricsService.getTaxonomyItems('activities');
    const subactivitiesList = this.parametricsService.getTaxonomyItems('sub_activities');
    let institution = null;
    if(this.idInstitution){
      institution = this.registersService.getInstitutionById(this.idInstitution);
    } else {
      institution = of(null);
    }

    forkJoin([approachList, activitiesList, subactivitiesList, institution]).subscribe({
      next: ([approach, activities, subactivities, institution]) => {
        this.approachList = approach;
        this.activitiesList = activities;
        this.subactivitiesList = subactivities;
        if(institution){
          this.institution = institution;
          this.hideLoading();
        }
        if(this.idRegister){
          this.getRegisterData();
        }
      },
      error: (error) => {
        console.error(error);
        this.hideLoading();
      }
    });
  }

  removePhoto(id: number): void {
    this.saveInSessionService.removePhotoData(id);
  }

  removeAttached(id: number): void {
    this.saveInSessionService.removeAttachedData(id);
  }

  async showLoading() {
    this.loading = await this.loadingController.create();
    await this.loading.present();
  }

  async hideLoading() {
    await this.loading.dismiss();
  }

}
