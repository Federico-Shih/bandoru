import {Component, DestroyRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {MonacoEditorModule} from "ngx-monaco-editor-v2";
import {FileFormType} from "../../../features/landing/state/save-bundle-form.service";
import {languages} from "monaco-editor";
import {debounceTime, Subscription} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

const extensionToLanguageMap: { [key: string]: string } = {
  '.abap': 'abap',
  '.cls': 'apex',
  '.azcli': 'azcli',
  '.bat': 'bat',
  '.bicep': 'bicep',
  '.c': 'c',
  '.clj': 'clojure',
  '.coffee': 'coffeescript',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.css': 'css',
  '.dart': 'dart',
  '.dockerfile': 'dockerfile',
  '.ecl': 'ecl',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.fs': 'fsharp',
  '.go': 'go',
  '.graphql': 'graphql',
  '.hbs': 'handlebars',
  '.hcl': 'hcl',
  '.html': 'html',
  '.ini': 'ini',
  '.java': 'java',
  '.js': 'javascript',
  '.json': 'json',
  '.jl': 'julia',
  '.kt': 'kotlin',
  '.less': 'less',
  '.lua': 'lua',
  '.md': 'markdown',
  '.m': 'objective-c',
  '.pas': 'pascal',
  '.pl': 'perl',
  '.php': 'php',
  '.ps1': 'powershell',
  '.py': 'python',
  '.r': 'r',
  '.rb': 'ruby',
  '.rs': 'rust',
  '.sass': 'scss',
  '.scss': 'scss',
  '.sh': 'shell',
  '.sol': 'solidity',
  '.sql': 'sql',
  '.swift': 'swift',
  '.ts': 'typescript',
  '.vb': 'vb',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

@Component({
  selector: 'app-bundle-editor',
  standalone: true,
  imports: [MonacoEditorModule, ReactiveFormsModule],
  templateUrl: './bundle-editor.component.html',
  styleUrl: './bundle-editor.component.scss',
})
export class BundleEditorComponent implements OnInit {
  destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.customControl?.controls?.fileName?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(500)).subscribe({
      next: (filename) => this.changeLanguageFromFilename(filename),
    });
  }

  editorOptions$ = signal<Record<string, unknown>>({theme: 'vs-dark', language: 'plaintext', minimap: { enabled: false }, lineNumbersMinChars:3 ,glyphMargin: false,lineDecorationsWidth: '0.5px', });


  @Input({ required: true })
  customControl!: FileFormType;

  @Output()
  remove: EventEmitter<number> = new EventEmitter<number>();



  private changeLanguageFromFilename(filename: string | null){
    if (!filename) return;
    const split = filename.split('.')
    if(split.length > 1){
      const ext = `.${split[split.length - 1]}`;
      console.log(ext);
      this.editorOptions$.update((prev) => ({ ...prev, language: extensionToLanguageMap[ext] || 'plaintext'}));
    }
  }
}
