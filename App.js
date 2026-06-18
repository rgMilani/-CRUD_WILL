import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import LoginScreen from './screens/LoginScreen';
import CadastroScreen from './screens/CadastroScreen';
import HomeScreen from './screens/HomeScreen';
import PerfilScreen from './screens/PerfilScreen';
import ProdutosScreen from './screens/ProdutosScreen';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Perfil" component={PerfilScreen} />
      <Stack.Screen name="Produtos" component={ProdutosScreen} />
    </Stack.Navigator>
  );
}

function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Navigation />
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}
