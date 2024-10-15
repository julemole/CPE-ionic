import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttachedPage } from './attached.page';

describe('AttachedPage', () => {
  let component: AttachedPage;
  let fixture: ComponentFixture<AttachedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttachedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
