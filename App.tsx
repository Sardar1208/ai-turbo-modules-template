import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
// import TfjsScreen from './src/screens/TfjsScreen';
// import ObjectDetectionScreen from './src/screens/ObjectDetectionScreen';
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
        <Stack.Screen
          name="image_classification"
          component={ImageProcess}
          options={{ title: 'Screen 2: Image classification', headerShown: false }}
        />
        {/* <Stack.Screen
          name="object_detection"
          component={ObjectDetectionScreen}
          options={{ title: 'Screen 3: Object detection' }}
        /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;