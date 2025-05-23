import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './components/Navigation'; // Import your Navigation component
export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
