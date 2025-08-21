<script lang="ts">
  import { onMount } from 'svelte';
  import Editor from './Editor.svelte';
  import Preview from './Preview.svelte';
  import Toolbar from './Toolbar.svelte';
  
  let source = '@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml';
  let format: 'svg' | 'png' = 'svg';
  let width = '';
  let height = '';
  let title = '';
  let theme = '';
  let isRendering = false;
  let previewContent = '';
  let error = '';

  let debounceTimer: number;

  function handleSourceChange(newSource: string) {
    source = newSource;
    debouncedRender();
  }

  function debouncedRender() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderDiagram();
    }, 800);
  }

  async function renderDiagram() {
    if (!source.trim()) {
      previewContent = '';
      return;
    }

    isRendering = true;
    error = '';

    try {
      // In a real implementation, this would call the Forge resolver
      // For now, we'll simulate the rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (format === 'svg') {
        previewContent = `<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="100" fill="#f0f0f0" stroke="#ccc"/>
          <text x="100" y="50" text-anchor="middle" dy=".3em">Preview: ${source.length} chars</text>
        </svg>`;
      } else {
        previewContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Rendering failed';
    } finally {
      isRendering = false;
    }
  }

  function handleRender() {
    renderDiagram();
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      renderDiagram();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    renderDiagram();
    
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      clearTimeout(debounceTimer);
    };
  });
</script>

<div class="app">
  <Toolbar 
    bind:format 
    bind:width 
    bind:height 
    bind:title 
    bind:theme 
    {isRendering}
    on:render={handleRender}
  />
  
  <div class="content">
    <div class="editor-panel">
      <Editor 
        {source} 
        on:change={(e) => handleSourceChange(e.detail)}
      />
    </div>
    
    <div class="preview-panel">
      <Preview 
        content={previewContent}
        {format}
        {isRendering}
        {error}
        {width}
        {height}
        {title}
      />
    </div>
  </div>
</div>

<style>
  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #fafbfc;
  }

  .content {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .editor-panel,
  .preview-panel {
    flex: 1;
    min-width: 0;
  }

  .editor-panel {
    border-right: 1px solid #dfe1e6;
  }
</style>