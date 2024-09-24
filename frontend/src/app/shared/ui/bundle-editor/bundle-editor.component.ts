import {Component, computed, DestroyRef, EventEmitter, inject, input, Input, NO_ERRORS_SCHEMA, OnDestroy, OnInit, Output, signal} from '@angular/core';
import {ReactiveFormsModule} from "@angular/forms";
import {MonacoEditorModule} from "ngx-monaco-editor-v2";
import {FileFormType} from "../../../features/landing/state/save-bundle-form.service";
import {debounceTime} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NgIf} from "@angular/common";

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
  imports: [MonacoEditorModule, ReactiveFormsModule, NgIf],
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

  baseEditor = signal<Record<string, unknown>>({
    theme: 'vs-dark',
    language: 'plaintext',
    minimap: { enabled: false },
    lineNumbersMinChars:3,
    glyphMargin: false,
    lineDecorationsWidth: '0.5px',
  });

  readOnly = input<boolean>(false);

  @Input({ required: false })
  customControl!: FileFormType;

  @Output()
  remove: EventEmitter<number> = new EventEmitter<number>();

  editorOptions = computed(() => {
    const baseEditor = this.baseEditor();
    return {
      ...baseEditor,
      readOnly: this.readOnly()
    };
  });


  private changeLanguageFromFilename(filename: string | null){
    if (!filename) return;
    const split = filename.split('.')
    if(split.length > 1){
      const ext = `.${split[split.length - 1]}`;
      console.log(ext);
      this.baseEditor.update((prev) => ({ ...prev, language: extensionToLanguageMap[ext] || 'plaintext'}));
    }
  }
}
