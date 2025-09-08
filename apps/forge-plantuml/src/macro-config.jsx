import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, TextArea, Stack, Box, Heading, Inline, Checkbox } from '@forge/react';
import { view } from '@forge/bridge';

const ConfigApp = () => {
  const [source, setSource] = useState('@startuml\nAlice -> Bob: Hello\nBob -> Alice: Hi there\n@enduml');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetCache, setResetCache] = useState(false);

  useEffect(() => {
    view.getContext().then((ctx) => {
      const existingSource = ctx.extension.config?.source;
      if (existingSource) {
        setSource(existingSource);
      }
    });
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await view.submit({ config: { source: source, resetCache: resetCache } });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
      setResetCache(false); // Reset checkbox after submit
    }
  };

  const handleCancel = () => {
    view.close();
  };

  const exampleDiagrams = [
    {
      name: 'Sequence Diagram',
      code: '@startuml\nAlice -> Bob: Authentication Request\nBob --> Alice: Authentication Response\n\nAlice -> Bob: Another authentication Request\nAlice <-- Bob: Another authentication Response\n@enduml'
    },
    {
      name: 'Class Diagram',
      code: '@startuml\nclass User {\n  +String name\n  +String email\n  +login()\n  +logout()\n}\n\nclass Admin {\n  +manageUsers()\n}\n\nUser <|-- Admin\n@enduml'
    },
    {
      name: 'Activity Diagram',
      code: '@startuml\nstart\n:User opens app;\nif (User logged in?) then (yes)\n  :Show dashboard;\nelse (no)\n  :Show login screen;\n  :User enters credentials;\n  :Validate credentials;\nendif\nstop\n@enduml'
    }
  ];

  const insertExample = (code) => {
    setSource(code);
  };

  return (
    <Stack space="space.200">
      {/* Header */}
      <Box paddingInline="space.200" paddingBlockEnd="space.100">
        <Stack space="space.050">
          <Heading size="medium">PlantUML Editor</Heading>
        </Stack>
      </Box>

      {/* Editor */}
      <Box paddingInline="space.200">
        <Text size="small" color="color.text.subtle">
          Edit your diagram source code
        </Text>
        <TextArea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="@startuml&#10;Alice -> Bob: Hello World&#10;Bob --> Alice: Hi there!&#10;@enduml"
          minimumRows={15}
          isMonospaced={true}
          resize="vertical"
        />
      </Box>

      {/* Reset Cache Option */}
      <Box paddingInline="space.200">
        <Stack space="space.050">
          <Checkbox
            isChecked={resetCache}
            onChange={(e) => setResetCache(e.target.checked)}
            label="Reset cache"
          />
          <Text size="small" color="color.text.subtle">
            Check this only if the diagram appears broken or outdated
          </Text>
        </Stack>
      </Box>

      {/* Actions */}
      <Box padding="space.200" paddingBlockStart="space.150">
        <Inline space="space.150" alignInline="end">
          <Button 
            onClick={handleCancel} 
            appearance="subtle"
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            appearance="primary"
            isLoading={isSubmitting}
          >
            Save
          </Button>
        </Inline>
      </Box>
    </Stack>
  );
};

ForgeReconciler.render(<ConfigApp />);