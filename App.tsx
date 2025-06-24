import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ImageProcess from './src/screens/ImageProcess';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="image_classification"
        screenOptions={{
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen
          name="image_classification"
          component={ImageProcess}
          options={{ title: 'Screen 2: Image classification', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;