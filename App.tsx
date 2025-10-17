import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/contextos/AuthContext';
import { NotificacaoProvider } from './src/contextos/NotificacaoContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { DarkTheme, Colors } from './src/estilos/theme';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importar as telas
import TelaInicio from './src/telas/TelaInicio';
import TelaTransacoes from './src/telas/TelaTransacoes';
import TelaMetas from './src/telas/TelaMetas';
import TelaEducacao from './src/telas/TelaEducacao';
import TelaPerfil from './src/telas/TelaPerfil';
import TelaRelatorios from './src/telas/TelaRelatorios';
import TelaAuth from './src/telas/TelaAuth';
import TelaCarteiras from './src/telas/TelaCarteiras';
import TelaDetalheLicao from './src/telas/TelaDetalheLicao';

// Tipagem para a navegação
export type RootStackParamList = {
  HomeTabs: undefined;
  DetalheLicao: { licaoId: string };
  Carteiras: undefined;
  Auth: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let nomeIcone: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Início') {
            nomeIcone = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transações') {
            nomeIcone = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Metas') {
            nomeIcone = focused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Relatórios') {
            nomeIcone = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Educação') {
            nomeIcone = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Perfil') {
            nomeIcone = focused ? 'person' : 'person-outline';
          } else {
            nomeIcone = 'help-outline';
          }

          return <Ionicons name={nomeIcone} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Início" component={TelaInicio} />
      <Tab.Screen name="Transações" component={TelaTransacoes} />
      <Tab.Screen name="Metas" component={TelaMetas} />
      <Tab.Screen name="Relatórios" component={TelaRelatorios} />
      <Tab.Screen name="Educação" component={TelaEducacao} />
      <Tab.Screen name="Perfil" component={TelaPerfil} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
    const { usuario, carregando } = useAuth();
  
    if (carregando) {
      return (
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
  
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name="HomeTabs" component={AppTabs} />
            <Stack.Screen 
              name="DetalheLicao" 
              component={TelaDetalheLicao}
            />
            <Stack.Screen name="Carteiras" component={TelaCarteiras} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={TelaAuth} />
        )}
      </Stack.Navigator>
    );
  }

export default function App() {
  return (
    <AuthProvider>
      <NotificacaoProvider>
        <NavigationContainer theme={DarkTheme}>
          <AppNavigator />
        </NavigationContainer>
      </NotificacaoProvider>
    </AuthProvider>
  );
}


const estilos = StyleSheet.create({
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});