import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Button, Stack, Box, Image, useConfig, Inline, Tooltip, Pressable, xcss } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const config = useConfig();
  const [diagramUrl, setDiagramUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);


  const source = config?.source || '';

  useEffect(() => {
    if (source) {
      setIsLoading(true);
      setError(null);
      invoke('renderDiagram', { source })
        .then((result) => {
          if (result.success) {
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

  const handleRefresh = async () => {
    if (!source) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      const result = await invoke('refreshDiagram', { source });
      if (result.success) {
        setDiagramUrl(result.diagramUrl);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('refreshDiagram error:', err);
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

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
            Click the edit button to configure your PlantUML diagram source code.
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Box padding="space.300">
      <Stack space="space.200">
        {error ? (
          <Stack space="space.150">
            <Inline space="space.100" alignInline="end">
              <Button 
                onClick={handleRefresh}
                appearance="primary"
                size="compact"
                isLoading={isRefreshing}
              >
                {isRefreshing ? 'Retrying...' : 'Retry'}
              </Button>
            </Inline>
            <Box padding="space.200" backgroundColor="color.background.danger" borderRadius="border.radius.200">
              <Text color="color.text.danger">Error: {error}</Text>
            </Box>
          </Stack>
        ) : diagramUrl ? (
          <Box 
            backgroundColor="color.background.neutral.subtle" 
            borderRadius="border.radius.200"
            padding="space.200"
          >
            <Inline alignInline="end">
              <Button
                onClick={handleRefresh}
                appearance="subtle"
                isLoading={isRefreshing}
                size="compact"
                iconBefore="refresh"
              />
            </Inline>
            <Box style={{ textAlign: 'center' }}>
              <Image 
                key={diagramUrl} 
                src={diagramUrl} 
                alt="PlantUML Diagram" 
                style={{ 
                  width: '100%', 
                  maxWidth: '100%', 
                  height: 'auto'
                }}
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