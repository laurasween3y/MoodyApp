import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JournalService } from './journal.service';
import { Configuration } from '../api';

describe('JournalService', () => {
  let service: JournalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Configuration, useValue: new Configuration({ basePath: 'http://localhost' }) }],
    });
    service = TestBed.inject(JournalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('create entry', () => {
    service.createEntry(1, { title: 'Entry', content_json: { blocks: [] } }).subscribe((entry) => {
      expect(entry.title).toBe('Entry');
      expect(entry.journal_id).toBe(1);
    });

    const req = httpMock.expectOne('http://localhost/journals/1/entries');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 10,
      journal_id: 1,
      title: 'Entry',
      content_json: { blocks: [] },
      entry_date: '2026-03-01',
      awarded: [],
    });
  });

  it('edit entry', () => {
    service.updateEntry(1, 10, { title: 'Updated' }).subscribe((entry) => {
      expect(entry.title).toBe('Updated');
    });

    const req = httpMock.expectOne('http://localhost/journals/1/entries/10');
    expect(req.request.method).toBe('PATCH');
    req.flush({
      id: 10,
      journal_id: 1,
      title: 'Updated',
      content_json: { blocks: [] },
      entry_date: '2026-03-01',
      awarded: [],
    });
  });

  it('error handling', () => {
    service.createEntry(1, { title: 'Bad', content_json: { blocks: [] } }).subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('http://localhost/journals/1/entries');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Error' });
  });
});
