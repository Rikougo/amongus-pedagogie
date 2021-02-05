import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigpanComponent } from './configpan.component';

describe('ConfigpanComponent', () => {
  let component: ConfigpanComponent;
  let fixture: ComponentFixture<ConfigpanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigpanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigpanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
