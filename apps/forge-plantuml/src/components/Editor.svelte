<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import * as monaco from 'monaco-editor';

  export let source: string;

  const dispatch = createEventDispatcher<{ change: string }>();

  let editorContainer: HTMLDivElement;
  let editor: monaco.editor.IStandaloneCodeEditor;

  onMount(() => {
    // Configure PlantUML language support
    monaco.languages.register({ id: 'plantuml' });
    
    monaco.languages.setMonarchTokensProvider('plantuml', {
      tokenizer: {
        root: [
          [/@start\w+/, 'keyword'],
          [/@end\w+/, 'keyword'],
          [/!.*$/, 'comment'],
          [/'.*$/, 'comment'],
          [/->|-->|<-|<--|<->|<-->/, 'operator'],
          [/\w+/, 'identifier'],
        ]
      }
    });

    editor = monaco.editor.create(editorContainer, {
      value: source,
      language: 'plantuml',
      theme: 'vs',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true
    });

    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      dispatch('change', newValue);
    });

    return () => {
      editor?.dispose();
    };
  });
</script>

<div class="editor-wrapper">
  <div class="editor-header">
    <h3>PlantUML Source</h3>
    <span class="shortcut">Ctrl/Cmd + Enter to render</span>
  </div>
  <div bind:this={editorContainer} class="editor-container"></div>
</div>

<style>
  .editor-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .editor-header {
    padding: 12px 16px;
    background: #f4f5f7;
    border-bottom: 1px solid #dfe1e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editor-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #172b4d;
  }

  .shortcut {
    font-size: 12px;
    color: #6b778c;
  }

  .editor-container {
    flex: 1;
    min-height: 0;
  }
</style>