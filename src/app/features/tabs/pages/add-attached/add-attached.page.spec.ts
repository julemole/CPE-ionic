import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAttachedPage } from './add-attached.page';

describe('AddAttachedPage', () => {
  let component: AddAttachedPage;
  let fixture: ComponentFixture<AddAttachedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddAttachedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
