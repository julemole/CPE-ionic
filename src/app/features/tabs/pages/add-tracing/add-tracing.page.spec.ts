import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTracingPage } from './add-tracing.page';

describe('AddTracingPage', () => {
  let component: AddTracingPage;
  let fixture: ComponentFixture<AddTracingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTracingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
