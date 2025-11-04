import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './app/screens/LoginScreen';
import HomeScreen from './app/screens/HomeScreen';
import DeckScreen from './app/screens/DeckScreen';
import CheckInScreen from './app/screens/CheckInScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Deck: { deckId: string };
  CheckIn: { placeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Deck" component={DeckScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
