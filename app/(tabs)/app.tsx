import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
// import LoginScreen from './LoginScreen';
// import CreateAccountScreen from './CreateAccountScreen';
import CheckInScreen from './CheckInScreen';
import DeckScreen from './DeckScreen';
import HomeScreen from './HomeScreen';

export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  Home: undefined;
  Deck: { deckId: string };
  CheckIn: { placeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="CreateAccount" component={CreateAccountScreen} options={{ title: 'Create Account' }} /> */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Deck" component={DeckScreen} />
        <Stack.Screen name="CheckIn" component={CheckInScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
