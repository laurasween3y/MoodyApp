import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { JournalEntry, JournalService } from '../../services/journal.service';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/notification.service';
import { buildAchievementToast, extractAwarded } from '../../utils/achievement-utils';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss']
})
export class EntryDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;
  @ViewChild('drawingCanvas') drawingCanvas?: ElementRef<HTMLCanvasElement>;
  journalId!: number;
  entryId?: number;
  entryTitle = '';
  entryDate = new Date().toISOString().slice(0, 10);
  editor?: Editor;
  editorReady = false;
  selectedBackground = 'lined';
  fontFamily = 'Inter';
  fontSize = 16;
  textColor = '#111827';
  highlightColor = '#fef08a';
  currentHeading = 0;
  showDrawing = false;
  isDrawing = false;
  drawCtx?: CanvasRenderingContext2D;
  lastPoint: { x: number; y: number } | null = null;
  loading = false;
  error?: string;
  isCreate = false;
  private shouldLoadEntry = false;

  readonly backgrounds = [
    { value: 'blank', label: 'Blank' },
    { value: 'lined', label: 'Lined' },
    { value: 'grid', label: 'Grid' },
    { value: 'dots', label: 'Dots' },
  ];

  readonly fontFamilies = [
    'Inter',
    'Georgia',
    'Times New Roman',
    'Arial',
    'Helvetica',
    'Courier New',
    'Fira Code',
  ];

  readonly fontSizes = [12, 14, 16, 18, 20, 22, 24];

  readonly headings = [
    { label: 'Paragraph', level: 0 },
    { label: 'H1', level: 1 },
    { label: 'H2', level: 2 },
    { label: 'H3', level: 3 },
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private journalService: JournalService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.journalId = Number(this.route.snapshot.paramMap.get('journalId'));
    const entryParam = this.route.snapshot.paramMap.get('entryId');
    this.isCreate = entryParam === 'new' || entryParam === null;
    if (!this.isCreate && entryParam) {
      this.entryId = Number(entryParam);
    }

    if (!this.journalId || Number.isNaN(this.journalId)) {
      this.error = 'Journal not found';
      this.router.navigate(['/journal']);
      return;
    }
    this.verifyJournal();
    this.shouldLoadEntry = !!this.entryId;
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorHost.nativeElement,
      editable: true,
      autofocus: true,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        TextStyle,
        Color.configure({ types: ['textStyle'] }),
        Highlight,
        FontFamily,
        Image.configure({ inline: false, allowBase64: true }),
        Placeholder.configure({ placeholder: 'Write your thoughts…' }),
      ],
      content: null,
    });

    // Defer ready flag to avoid ExpressionChanged errors
    Promise.resolve().then(() => (this.editorReady = true));

    // Apply default style to new docs
    this.applyFontSettings();

    if (this.shouldLoadEntry) {
      setTimeout(() => this.loadEntry(), 0);
    }
  }

  private async verifyJournal() {
    try {
      await firstValueFrom(this.journalService.getJournal(this.journalId));
    } catch (err) {
      this.error = 'Journal not found';
      this.router.navigate(['/journal']);
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  async loadEntry() {
    if (!this.entryId) return;
    this.loading = true;
    this.error = undefined;
    try {
      const entry = await firstValueFrom(this.journalService.getEntry(this.journalId, this.entryId));
      this.entryTitle = entry.title || '';
      this.entryDate = entry.entry_date;
      this.selectedBackground = entry.background || 'lined';
      this.fontFamily = entry.font_family || 'Inter';
      this.fontSize = entry.font_size || 16;

      if (this.editor) {
        if (entry.content_json) {
          this.editor.commands.setContent(entry.content_json);
        }
        this.applyFontSettings();
      }
    } catch (err) {
      this.error = 'Failed to load entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async saveEntry() {
    const isEmpty = !this.editor || this.editor.getText().trim().length === 0;
    if (isEmpty) {
      this.error = 'Content is required';
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      if (!this.editor) {
        this.error = 'Editor not ready';
        return;
      }
      const payload = {
        title: this.entryTitle || null,
        content_json: this.editor.getJSON(),
        background: this.selectedBackground,
        font_family: this.fontFamily,
        font_size: this.fontSize,
        entry_date: this.entryDate,
      };
      if (this.isCreate) {
        const created = await firstValueFrom(this.journalService.createEntry(this.journalId, payload));
        this.notifyAwards(extractAwarded(created));
      } else if (this.entryId) {
        await firstValueFrom(this.journalService.updateEntry(this.journalId, this.entryId, payload));
      }
      this.goBack();
    } catch (err) {
      this.error = this.isCreate ? 'Failed to create entry' : 'Failed to save entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async deleteEntry() {
    if (this.isCreate || !this.entryId) {
      this.goBack();
      return;
    }
    if (!confirm('Delete this entry?')) return;
    this.loading = true;
    try {
      await firstValueFrom(this.journalService.deleteEntry(this.journalId, this.entryId));
      this.goBack();
    } catch (err) {
      this.error = 'Failed to delete entry';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/journal', this.journalId]);
  }

  private notifyAwards(awarded: string[] | undefined) {
    if (!awarded?.length) return;
    awarded.forEach((key) => this.notifications.show(buildAchievementToast(key)));
  }

  // Toolbar actions
  toggleBold() {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic() {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleUnderline() {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  setHeading(level: 0 | 1 | 2 | 3) {
    const chain = this.editor?.chain().focus();
    if (!chain) return;
    this.currentHeading = level;
    level === 0 ? chain.setParagraph().run() : chain.toggleHeading({ level }).run();
  }

  toggleBullet() {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrdered() {
    this.editor?.chain().focus().toggleOrderedList().run();
  }


  setFontFamily(family: string) {
    this.fontFamily = family;
    this.applyFontSettings();
  }

  setFontSize(size: number) {
    this.fontSize = size;
    this.applyFontSettings();
  }

  setColor(color: string) {
    this.textColor = color;
    this.editor?.chain().focus().setColor(color).run();
  }

  setHighlight(color: string) {
    this.highlightColor = color;
    this.editor?.chain().focus().toggleHighlight({ color }).run();
  }


  undo() {
    this.editor?.chain().focus().undo().run();
  }

  redo() {
    this.editor?.chain().focus().redo().run();
  }

  onBackgroundChange(value: string) {
    this.selectedBackground = value;
  }

  insertImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      if (!this.editor) return;
      const endPos = this.editor.state.doc.content.size;
      this.editor
        .chain()
        .focus()
        .setTextSelection(endPos)
        .insertContent({ type: 'image', attrs: { src } })
        .run();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  toggleDrawing() {
    this.showDrawing = !this.showDrawing;
    if (this.showDrawing) {
      setTimeout(() => this.initCanvas(), 0);
    }
  }

  initCanvas() {
    if (!this.drawingCanvas) return;
    const canvas = this.drawingCanvas.nativeElement;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = 300;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.drawCtx = ctx;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  @HostListener('window:resize')
  onResize() {
    if (this.showDrawing) {
      this.initCanvas();
    }
  }

  startDraw(event: PointerEvent) {
    if (!this.drawCtx || !this.drawingCanvas) return;
    this.isDrawing = true;
    this.drawingCanvas.nativeElement.setPointerCapture(event.pointerId);
    const { x, y } = this.canvasPoint(event);
    this.drawCtx.beginPath();
    this.drawCtx.moveTo(x, y);
    this.lastPoint = { x, y };
  }

  draw(event: PointerEvent) {
    if (!this.isDrawing || !this.drawCtx || !this.lastPoint) return;
    const { x, y } = this.canvasPoint(event);
    this.drawCtx.beginPath();
    this.drawCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.drawCtx.lineTo(x, y);
    this.drawCtx.stroke();
    this.lastPoint = { x, y };
  }

  endDraw(event: PointerEvent) {
    if (!this.drawCtx || !this.drawingCanvas) return;
    this.isDrawing = false;
    this.lastPoint = null;
    this.drawingCanvas.nativeElement.releasePointerCapture(event.pointerId);
  }

  clearDrawing() {
    if (!this.drawCtx || !this.drawingCanvas) return;
    const canvas = this.drawingCanvas.nativeElement;
    this.drawCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  saveDrawingToEditor() {
    if (!this.drawingCanvas || !this.editor) return;
    const dataUrl = this.drawingCanvas.nativeElement.toDataURL('image/png');
    const endPos = this.editor.state.doc.content.size;
    this.editor
      .chain()
      .focus()
      .setTextSelection(endPos)
      .insertContent({ type: 'image', attrs: { src: dataUrl } })
      .run();
    this.showDrawing = false;
  }

  private canvasPoint(event: PointerEvent) {
    if (!this.drawingCanvas) return { x: 0, y: 0 };
    const rect = this.drawingCanvas.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private applyFontSettings() {
    if (!this.editor) return;
    const size = `${this.fontSize}px`;
    const lineHeightPx = Math.round(this.fontSize * 1.75);
    const gridSizePx = Math.round(this.fontSize * 1.5);
    const dotSizePx = gridSizePx;
    const baselinePx = Math.round(this.fontSize * 0.85); // slightly lower so text sits closer to lower guide
    this.editor
      .chain()
      .focus()
      .setFontFamily(this.fontFamily)
      .setMark('textStyle', { fontSize: size })
      .run();

    // Also set base styles so the whole doc inherits the chosen font/size
    const host = this.editorHost?.nativeElement;
    if (host) {
      host.style.fontFamily = this.fontFamily;
      host.style.fontSize = size;
      const shell = host.parentElement as HTMLElement | null;
      if (shell) {
        shell.style.setProperty('--journal-line', `${lineHeightPx}px`);
        shell.style.setProperty('--journal-grid', `${gridSizePx}px`);
        shell.style.setProperty('--journal-dots', `${dotSizePx}px`);
        shell.style.setProperty('--journal-font-size', size);
        shell.style.setProperty('--journal-baseline', `${baselinePx}px`);
      }
    }
  }  
}
