import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TracingDetailPage } from './tracing-detail.page';

describe('TracingDetailPage', () => {
  let component: TracingDetailPage;
  let fixture: ComponentFixture<TracingDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TracingDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
