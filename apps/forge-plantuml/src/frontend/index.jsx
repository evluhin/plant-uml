import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, TextArea, Stack, Box, Image } from '@forge/react';
import { view, invoke } from '@forge/bridge';

const App = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState('@startuml\nAlice -> Bob: Hello\nBob -> Charlie: World\nCharlie -> Alice: !\n@enduml');
  const [editingSource, setEditingSource] = useState('');
  const [diagramUrl, setDiagramUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const textarea = document.getElementById('plantuml-editor');
      const sourceToRender = textarea ? textarea.value : editingSource;
      const result = await invoke('renderDiagram', { source: sourceToRender });
      if (result.success) {
        setSource(sourceToRender);
        setDiagramUrl(result.diagramUrl);
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to render diagram');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditingSource(source);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <Box padding="space.300">
        <Stack space="space.300">
          <Text weight="bold">Edit PlantUML Diagram</Text>
          <TextArea
            defaultValue={editingSource}
            placeholder="@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml"
            minimumRows={15}
            isMonospaced={true}
            name="source"
            id="plantuml-editor"
          />
          {error && (
            <Box padding="space.200" backgroundColor="color.background.danger" borderRadius="border.radius.200">
              <Text color="color.text.danger">{error}</Text>
            </Box>
          )}
          <Stack direction="horizontal" space="space.200" alignInline="start">
            <Button appearance="primary" onClick={handleSave} isLoading={isLoading}>
              {isLoading ? 'Rendering...' : 'Save & Preview'}
            </Button>
            <Button onClick={() => setIsEditing(false)} isDisabled={isLoading}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space.300">
      <Stack space="space.200">
        <Box padding="space.300" backgroundColor="color.background.neutral.subtle" borderRadius="border.radius.200">
          <Stack space="space.100">
            <Text weight="bold">PlantUML Diagram</Text>
            <Text size="small" color="color.text.subtlest">
              {source.split('\n').length} lines • Click edit to modify
            </Text>
          </Stack>
        </Box>
        {diagramUrl ? (
          <Box padding="space.200" backgroundColor="color.background.neutral.subtle" borderRadius="border.radius.200">
            <Box style={{ width: '100%', overflow: 'auto', textAlign: 'center' }}>
              <Image src={diagramUrl} alt="PlantUML Diagram" style={{ width: '100%', maxWidth: '100%', height: 'auto' }} />
            </Box>
          </Box>
        ) : (
          <Box padding="space.200" backgroundColor="color.background.neutral" borderRadius="border.radius.200">
            <Text color="color.text.subtle">No diagram rendered yet. Click edit to create one.</Text>
          </Box>
        )}
        <Button appearance="primary" onClick={handleEdit}>
          Edit Diagram
        </Button>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App />);