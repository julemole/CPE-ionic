import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainRegisterPage } from './main-register.page';

describe('MainRegisterPage', () => {
  let component: MainRegisterPage;
  let fixture: ComponentFixture<MainRegisterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MainRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
