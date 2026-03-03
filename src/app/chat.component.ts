import { ChangeDetectionStrategy, Component, signal, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: { fileName: string; chunkIndex: number; text: string }[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white">
      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6" #scrollContainer>
        @if (messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center text-slate-500">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <mat-icon class="text-slate-400 text-3xl w-8 h-8">chat_bubble_outline</mat-icon>
            </div>
            <h3 class="text-lg font-medium text-slate-900 mb-2">Welcome to RAG Assistant</h3>
            <p class="max-w-md text-sm">Upload PDF documents to the knowledge base, then ask questions. I will answer strictly based on the provided documents.</p>
          </div>
        }

        @for (msg of messages(); track $index) {
          <div class="flex gap-4" [class.flex-row-reverse]="msg.role === 'user'">
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                 [class.bg-indigo-600]="msg.role === 'user'"
                 [class.bg-emerald-500]="msg.role === 'model'">
              @if (msg.role === 'user') {
                <mat-icon class="text-white text-[18px] w-[18px] h-[18px]">person</mat-icon>
              } @else {
                <mat-icon class="text-white text-[18px] w-[18px] h-[18px]">smart_toy</mat-icon>
              }
            </div>
            
            <!-- Message Bubble -->
            <div class="flex flex-col gap-2 max-w-[80%]">
              <div class="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                   [class.bg-indigo-600]="msg.role === 'user'"
                   [class.text-white]="msg.role === 'user'"
                   [class.bg-slate-100]="msg.role === 'model'"
                   [class.text-slate-800]="msg.role === 'model'"
                   [class.rounded-tr-sm]="msg.role === 'user'"
                   [class.rounded-tl-sm]="msg.role === 'model'">
                {{ msg.content }}
              </div>
              
              <!-- Sources -->
              @if (msg.sources && msg.sources.length > 0) {
                <div class="flex flex-wrap gap-2 mt-1">
                  @for (source of msg.sources; track source.chunkIndex) {
                    <div class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600 max-w-full" title="{{source.text}}">
                      <mat-icon class="text-[14px] w-[14px] h-[14px] text-slate-400">description</mat-icon>
                      <span class="truncate max-w-[150px]">{{ source.fileName }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
        
        @if (isLoading()) {
          <div class="flex gap-4">
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <mat-icon class="text-white text-[18px] w-[18px] h-[18px]">smart_toy</mat-icon>
            </div>
            <div class="px-4 py-3 rounded-2xl bg-slate-100 rounded-tl-sm flex items-center gap-2">
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-white border-t border-slate-200">
        <form (ngSubmit)="sendMessage()" class="relative flex items-center">
          <input 
            type="text" 
            [(ngModel)]="currentQuery" 
            name="query"
            placeholder="Ask a question about your documents..." 
            class="w-full bg-slate-50 border border-slate-300 rounded-full pl-6 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            [disabled]="isLoading()"
            autocomplete="off"
          />
          <button 
            type="submit" 
            class="absolute right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="!currentQuery.trim() || isLoading()"
          >
            <mat-icon class="text-[20px] w-[20px] h-[20px]">send</mat-icon>
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private cdr = inject(ChangeDetectorRef);
  
  messages = signal<ChatMessage[]>([]);
  currentQuery = '';
  isLoading = signal(false);

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch {
      // Ignore
    }
  }

  async sendMessage() {
    const query = this.currentQuery.trim();
    if (!query || this.isLoading()) return;

    const history = this.messages().map(m => ({ role: m.role, content: m.content }));
    
    this.messages.update(m => [...m, { role: 'user', content: query }]);
    this.currentQuery = '';
    this.isLoading.set(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }

      const data = await response.json();
      console.log('Chat response:', data);

      if (data.success && data.answer) {
        this.messages.update(m => [
          ...m,
          {
            role: 'model',
            content: data.answer,
            sources: data.sources || []
          }
        ]);
      } else {
        throw new Error(data.error || 'No response from server');
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.messages.update(m => [
        ...m,
        {
          role: 'model',
          content: error instanceof Error ? error.message : 'Sorry, an error occurred while processing your request.',
          sources: []
        }
      ]);
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }
}

