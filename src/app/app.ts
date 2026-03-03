import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ChatComponent} from './chat.component';
import {UploadComponent} from './upload.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [ChatComponent, UploadComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">RAG Assistant</h1>
        </div>
      </header>
      
      <main class="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside class="lg:col-span-1 flex flex-col gap-6">
          <app-upload></app-upload>
        </aside>
        
        <section class="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
          <app-chat></app-chat>
        </section>
      </main>
    </div>
  `,
})
export class App {}
