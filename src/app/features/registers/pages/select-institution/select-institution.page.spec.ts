import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectInstitutionPage } from './select-institution.page';

describe('SelectInstitutionPage', () => {
  let component: SelectInstitutionPage;
  let fixture: ComponentFixture<SelectInstitutionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectInstitutionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
