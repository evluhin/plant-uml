import React from 'react';
import ForgeReconciler, { Text } from '@forge/react';

const App = () => {
  return (
    <Text>Hello World from PlantUML Macro!</Text>
  );
};

ForgeReconciler.render(<App />);