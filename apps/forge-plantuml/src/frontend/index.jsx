import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, TextArea, Stack, Box } from '@forge/react';
import { view } from '@forge/bridge';

const App = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [source, setSource] = useState('@startuml\nAlice -> Bob: Hello\n@enduml');
  const [context, setContext] = useState(null);

  useEffect(() => {
    view.getContext().then(setContext);
  }, []);

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Save to storage and render diagram
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <Stack space="space.200">
        <Text>Edit PlantUML Diagram</Text>
        <TextArea
          value={source}
          onChange={setSource}
          placeholder="Enter PlantUML source code..."
          rows={10}
        />
        <Stack direction="horizontal" space="space.100">
          <Button appearance="primary" onClick={handleSave}>
            Save
          </Button>
          <Button onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack space="space.200">
      <Box padding="space.200" backgroundColor="color.background.neutral">
        <Text>PlantUML Diagram (Preview)</Text>
        <Text size="small">Source: {source.substring(0, 50)}...</Text>
      </Box>
      <Button onClick={handleEdit}>
        Edit Diagram
      </Button>
    </Stack>
  );
};

ForgeReconciler.render(<App />);