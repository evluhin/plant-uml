<script lang="ts">
  export let content: string;
  export let format: 'svg' | 'png';
  export let isRendering: boolean;
  export let error: string;
  export let width: string;
  export let height: string;
  export let title: string;

  $: previewStyle = [
    width ? `width: ${width}px` : '',
    height ? `height: ${height}px` : ''
  ].filter(Boolean).join('; ');
</script>

<div class="preview-wrapper">
  <div class="preview-header">
    <h3>Preview</h3>
    {#if isRendering}
      <div class="spinner">Rendering...</div>
    {/if}
  </div>
  
  <div class="preview-content">
    {#if error}
      <div class="error">
        <strong>Error:</strong> {error}
      </div>
    {:else if isRendering}
      <div class="loading">
        <div class="spinner-icon"></div>
        <p>Rendering diagram...</p>
      </div>
    {:else if content}
      <div class="diagram-container">
        {#if title}
          <h4 class="diagram-title">{title}</h4>
        {/if}
        
        {#if format === 'svg'}
          <div class="svg-container" style={previewStyle}>
            {@html content}
          </div>
        {:else}
          <img 
            src={content} 
            alt="PlantUML Diagram" 
            style={previewStyle}
            class="png-image"
          />
        {/if}
      </div>
    {:else}
      <div class="empty">
        <p>Enter PlantUML source code to see preview</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .preview-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
  }

  .preview-header {
    padding: 12px 16px;
    background: #f4f5f7;
    border-bottom: 1px solid #dfe1e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #172b4d;
  }

  .spinner {
    font-size: 12px;
    color: #0052cc;
  }

  .preview-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error {
    padding: 16px;
    background: #ffebe6;
    border: 1px solid #ff8f73;
    border-radius: 4px;
    color: #bf2600;
  }

  .loading {
    text-align: center;
    color: #6b778c;
  }

  .spinner-icon {
    width: 24px;
    height: 24px;
    border: 2px solid #dfe1e6;
    border-top: 2px solid #0052cc;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty {
    text-align: center;
    color: #6b778c;
  }

  .diagram-container {
    max-width: 100%;
    max-height: 100%;
  }

  .diagram-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #172b4d;
    text-align: center;
  }

  .svg-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .png-image {
    max-width: 100%;
    height: auto;
  }
</style>