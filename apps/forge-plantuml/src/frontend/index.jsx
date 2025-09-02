import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, Stack, Box, Image, useConfig } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const config = useConfig();
  const [diagramUrl, setDiagramUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const source = config?.source || '';

  console.log('App render - config:', config);
  console.log('App render - source:', source);

  useEffect(() => {
    console.log('useEffect triggered - source:', source);
    if (source) {
      setIsLoading(true);
      setError(null);
      console.log('Calling renderDiagram with source:', source.substring(0, 50) + '...');
      invoke('renderDiagram', { source })
        .then((result) => {
          console.log('renderDiagram result:', result);
          if (result.success) {
            console.log('Setting new diagramUrl, length:', result.diagramUrl.length);
            console.log('DiagramUrl preview:', result.diagramUrl.substring(0, 100) + '...');
            setDiagramUrl(result.diagramUrl);
          } else {
            setError(result.error);
          }
        })
        .catch((err) => {
          console.error('renderDiagram error:', err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [source]);

  if (isLoading) {
    return (
      <Box padding="space.300">
        <Text>Rendering diagram...</Text>
      </Box>
    );
  }

  if (!source) {
    return (
      <Box padding="space.300">
        <Stack space="space.200">
          <Text weight="bold">PlantUML Diagram</Text>
          <Text color="color.text.subtle">
            Click the edit button (⚙️) to configure your PlantUML diagram source code.
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space.300">
      <Stack space="space.200">
        {error ? (
          <Box padding="space.200" backgroundColor="color.background.danger" borderRadius="border.radius.200">
            <Text color="color.text.danger">Error: {error}</Text>
          </Box>
        ) : diagramUrl ? (
          <Box padding="space.200" backgroundColor="color.background.neutral.subtle" borderRadius="border.radius.200">
            <Box style={{ width: '100%', overflow: 'auto', textAlign: 'center' }}>
              <Image 
                key={diagramUrl} 
                src={diagramUrl} 
                alt="PlantUML Diagram" 
                style={{ width: '100%', maxWidth: '100%', height: 'auto' }} 
              />
            </Box>
          </Box>
        ) : (
          <Box padding="space.200" backgroundColor="color.background.neutral" borderRadius="border.radius.200">
            <Text color="color.text.subtle">Diagram will appear here after configuration.</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(<App />);