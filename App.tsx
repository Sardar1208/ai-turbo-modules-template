import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
// import TfjsScreen from './src/screens/TfjsScreen';
import JsiScreen from './src/screens/JsiScreen';
import ImageProcess from './src/screens/ImageProcess';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'AI Performance Benchmark' }}
        />
        {/* <Stack.Screen
          name="TfjsImplementation"
          component={TfjsScreen}
          options={{ title: 'Screen 1: Optimized JS' }}
        /> */}
        <Stack.Screen
          name="JsiImplementation"
          component={ImageProcess}
          options={{ title: 'Screen 2: JSI Native' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;