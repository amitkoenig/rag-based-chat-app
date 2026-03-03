import { ChangeDetectionStrategy, Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <h2 class="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <mat-icon class="text-indigo-500">folder_open</mat-icon>
        Knowledge Base
      </h2>
      
      <div 
        class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        tabindex="0"
        role="button"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)"
      >
        <input 
          type="file" 
          #fileInput 
          multiple 
          accept="application/pdf" 
          class="hidden" 
          (change)="onFileSelected($event)"
        />
        <mat-icon class="text-slate-400 mb-2 text-4xl w-10 h-10">cloud_upload</mat-icon>
        <p class="text-sm font-medium text-slate-700">Click or drag PDFs here</p>
        <p class="text-xs text-slate-500 mt-1">Max 10MB per file</p>
      </div>

      @if (files().length > 0) {
        <div class="mt-4 flex flex-col gap-2">
          @for (file of files(); track file.name) {
            <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span class="text-xs text-slate-700 truncate max-w-[150px]">{{ file.name }}</span>
              <button (click)="removeFile(file)" class="text-slate-400 hover:text-red-500">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">close</mat-icon>
              </button>
            </div>
          }
          
          <button 
            class="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            (click)="uploadFiles()"
            [disabled]="isUploading()"
          >
            @if (isUploading()) {
              <mat-icon class="animate-spin text-[18px] w-[18px] h-[18px]">refresh</mat-icon>
              Processing...
            } @else {
              <mat-icon class="text-[18px] w-[18px] h-[18px]">upload</mat-icon>
              Upload & Index
            }
          </button>
        </div>
      }

      @if (uploadMessage()) {
        <div class="mt-4 p-3 rounded-lg text-sm" [class.bg-green-50]="!isError()" [class.text-green-700]="!isError()" [class.bg-red-50]="isError()" [class.text-red-700]="isError()">
          {{ uploadMessage() }}
        </div>
      }
      
      <div class="mt-6 pt-6 border-t border-slate-100">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500">Indexed Chunks</span>
          <span class="font-medium text-slate-900">{{ stats() }}</span>
        </div>
        <button 
          class="mt-3 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
          (click)="clearKnowledgeBase()"
        >
          <mat-icon class="text-[16px] w-[16px] h-[16px]">delete_outline</mat-icon>
          Clear Knowledge Base
        </button>
      </div>
    </div>
  `
})
export class UploadComponent {
  files = signal<File[]>([]);
  isUploading = signal(false);
  uploadMessage = signal('');
  isError = signal(false);
  stats = signal(0);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchStats();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  addFiles(newFiles: File[]) {
    const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
    this.files.update(curr => [...curr, ...pdfFiles]);
    this.uploadMessage.set('');
  }

  removeFile(file: File) {
    this.files.update(curr => curr.filter(f => f !== file));
  }

  async uploadFiles() {
    if (this.files().length === 0) return;
    
    this.isUploading.set(true);
    this.uploadMessage.set('');
    this.isError.set(false);

    const formData = new FormData();
    for (const file of this.files()) {
      formData.append('files', file);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}. Response: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      
      this.uploadMessage.set(data.message);
      this.files.set([]);
      this.fetchStats();
    } catch (error: unknown) {
      this.isError.set(true);
      this.uploadMessage.set(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isUploading.set(false);
    }
  }

  async fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      this.stats.set(data.documentChunks);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  }

  async clearKnowledgeBase() {
    try {
      await fetch('/api/clear', { method: 'POST' });
      this.fetchStats();
      this.uploadMessage.set('Knowledge base cleared');
      this.isError.set(false);
      setTimeout(() => this.uploadMessage.set(''), 3000);
    } catch (e) {
      console.error('Failed to clear knowledge base', e);
    }
  }
}
