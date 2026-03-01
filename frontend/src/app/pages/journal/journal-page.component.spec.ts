import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { convertToParamMap, Router } from '@angular/router';
import { JournalPageComponent } from './journal-page.component';
import { JournalService } from '../../services/journal.service';
import { ActivatedRoute } from '@angular/router';

describe('JournalPageComponent', () => {
  let journalService: jasmine.SpyObj<JournalService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    journalService = jasmine.createSpyObj('JournalService', [
      'getJournals',
      'createJournal',
      'updateJournal',
      'deleteJournal',
      'getEntries',
      'deleteEntry',
      'uploadCover',
    ]);
    journalService.getJournals.and.returnValue(of([]));
    journalService.getEntries.and.returnValue(of([]));
    journalService.createJournal.and.returnValue(of({
      id: 1,
      title: 'Journal',
      description: null,
      cover_url: null,
    } as any));

    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [JournalPageComponent],
      providers: [
        { provide: JournalService, useValue: journalService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
  });

  it('does not create journal when title is empty', async () => {
    const fixture = TestBed.createComponent(JournalPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.journalTitle = '';
    await component.createJournal();

    expect(journalService.createJournal).not.toHaveBeenCalled();
  });

  it('sets error when create journal fails', async () => {
    journalService.createJournal.and.returnValue(
      throwError(() => ({ error: { message: 'Failed to create journal' } }))
    );

    const fixture = TestBed.createComponent(JournalPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.journalTitle = 'Journal';
    await component.createJournal();

    expect(component.error).toBe('Failed to create journal');
  });

  it('sets error when delete journal fails', async () => {
    journalService.deleteJournal.and.returnValue(
      throwError(() => ({ error: { message: 'Failed to delete journal' } }))
    );

    const fixture = TestBed.createComponent(JournalPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.journals = [{ id: 1, title: 'Journal', description: null, cover_url: null } as any];

    spyOn(window, 'confirm').and.returnValue(true);
    await component.deleteJournal(component.journals[0]);

    expect(component.error).toBe('Failed to delete journal');
  });

  it('selectJournal sets selectedJournalId and loads entries', async () => {
    const fixture = TestBed.createComponent(JournalPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.journals = [{ id: 1, title: 'Journal', description: null, cover_url: null } as any];
    const loadSpy = spyOn(component, 'loadEntries').and.returnValue(Promise.resolve());

    await component.selectJournal(1);

    expect(component.selectedJournalId).toBe(1);
    expect(loadSpy).toHaveBeenCalled();
  });
});
