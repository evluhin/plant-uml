<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let format: 'svg' | 'png';
  export let width: string;
  export let height: string;
  export let title: string;
  export let theme: string;
  export let isRendering: boolean;

  const dispatch = createEventDispatcher<{ render: void }>();

  const themes = [
    { value: '', label: 'Default' },
    { value: 'plain', label: 'Plain' },
    { value: 'monochrome', label: 'Monochrome' },
    { value: 'bluegray', label: 'Blue Gray' }
  ];

  function handleRender() {
    dispatch('render');
  }
</script>

<div class="toolbar">
  <div class="toolbar-section">
    <label class="field">
      <span>Format:</span>
      <select bind:value={format}>
        <option value="svg">SVG</option>
        <option value="png">PNG</option>
      </select>
    </label>

    <label class="field">
      <span>Width:</span>
      <input type="text" bind:value={width} placeholder="auto" />
    </label>

    <label class="field">
      <span>Height:</span>
      <input type="text" bind:value={height} placeholder="auto" />
    </label>

    <label class="field">
      <span>Theme:</span>
      <select bind:value={theme}>
        {#each themes as themeOption}
          <option value={themeOption.value}>{themeOption.label}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="toolbar-section">
    <label class="field field-wide">
      <span>Title:</span>
      <input type="text" bind:value={title} placeholder="Optional diagram title" />
    </label>

    <button 
      class="render-btn" 
      on:click={handleRender}
      disabled={isRendering}
    >
      {isRendering ? 'Rendering...' : 'Render'}
    </button>
  </div>
</div>

<style>
  .toolbar {
    padding: 12px 16px;
    background: #f4f5f7;
    border-bottom: 1px solid #dfe1e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #172b4d;
  }

  .field-wide {
    min-width: 200px;
  }

  .field span {
    font-weight: 500;
    white-space: nowrap;
  }

  .field input,
  .field select {
    padding: 4px 8px;
    border: 1px solid #dfe1e6;
    border-radius: 3px;
    font-size: 12px;
    background: white;
  }

  .field input {
    width: 60px;
  }

  .field-wide input {
    width: 150px;
  }

  .render-btn {
    padding: 6px 12px;
    background: #0052cc;
    color: white;
    border: none;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .render-btn:hover:not(:disabled) {
    background: #0065ff;
  }

  .render-btn:disabled {
    background: #a5adba;
    cursor: not-allowed;
  }
</style>