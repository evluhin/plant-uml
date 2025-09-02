import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, TextArea, Stack, Box } from '@forge/react';
import { view } from '@forge/bridge';

const ConfigApp = () => {
  const [source, setSource] = useState('@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml');

  useEffect(() => {
    view.getContext().then((ctx) => {
      const existingSource = ctx.extension.config?.source;
      if (existingSource) {
        setSource(existingSource);
      }
    });
  }, []);

  const handleSubmit = async () => {
    try {
      await view.submit({ config: { source: source } });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <Box padding="space.300">
      <Stack space="space.300">
        <Text weight="bold">Configure PlantUML Diagram</Text>
        <Text size="small" color="color.text.subtlest">
          Enter your PlantUML diagram source code below.
        </Text>
        
        <TextArea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="@startuml&#10;Alice -> Bob: Hello&#10;Bob -> Alice: Hi there&#10;@enduml"
          minimumRows={20}
          isMonospaced={true}
        />
        
        <Stack direction="horizontal" space="space.200" alignInline="start">
          <Button onClick={handleSubmit} appearance="primary">
            Save Configuration
          </Button>
          <Button onClick={() => view.close()}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<ConfigApp />);