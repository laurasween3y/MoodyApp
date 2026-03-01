import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Configuration } from './api';
import { AuthService } from './services/auth.service';
import { BrowserNotificationService } from './services/notification.service';
import { AchievementCatalogService } from './services/achievement-catalog.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn$: () => of(true),
            ensureSession: () => of(true),
            logout: () => {},
          },
        },
        {
          provide: BrowserNotificationService,
          useValue: {
            clearAll: () => {},
            getNotificationSettings: () => of({}),
            applySettings: () => {},
          },
        },
        {
          provide: AchievementCatalogService,
          useValue: {
            ensureLoaded: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders navigation links', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a')).map((a) => a.textContent?.trim());
    expect(links).toContain('Mood');
  });
});
