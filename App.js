// App.js - Componente principal de la aplicación
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

// Contexto de autenticación
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pantallas de autenticación
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';

// Pantallas principales
import HomeScreen from './components/HomeScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Pantallas de reportes - USANDO SOLO COMPONENTS/REPORTS (que sí existen)
import ReportListScreen from './components/reports/ReportListScreen';
import CreateReportScreen from './components/reports/CreateReportScreen';
import ReportDetailScreen from './components/reports/ReportDetailScreen';
import ReportSuccessScreen from './components/reports/ReportSuccessScreen';

// Otras pantallas
import ChangePasswordScreen from './components/ChangePasswordScreen';
import CommunitiesScreen from './components/CommunitiesScreen';
import CommunityDetailScreen from './components/CommunityDetailScreen';

// Crear navegadores
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ignorar advertencias específicas de desarrollo
LogBox.ignoreLogs([
  'Warning: ...',
  'AsyncStorage has been extracted from react-native',
]);

// Pantalla de carga mientras se verifica la autenticación
const LoadingScreen = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  }}>
    <ActivityIndicator size="large" color="#4B7BEC" />
    <Text style={{
      marginTop: 16,
      fontSize: 16,
      color: '#666666',
      fontWeight: '500',
    }}>Verificando sesión...</Text>
  </View>
);

// Componente para mostrar advertencia cuando no hay conexión
function OfflineNotice() {
  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={{
      backgroundColor: '#FF3B30',
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    }}>
      <Ionicons name="wifi-outline" size={16} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
        Sin conexión a Internet
      </Text>
    </View>
  );
}

// Stack de reportes
const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportsList" component={ReportListScreen} />
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen}
      options={{ 
        headerShown: true,
        title: 'Detalle del Reporte',
        headerStyle: { backgroundColor: '#4B7BEC' },
        headerTintColor: '#fff',
      }}
    />
    <Stack.Screen 
      name="ReportSuccess" 
      component={ReportSuccessScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Tabs principales (cuando está logueado)
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'HomeTab':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'ActivityTab':
            iconName = focused ? 'analytics' : 'analytics-outline';
            break;
          case 'ReportsTab':
            iconName = focused ? 'document-text' : 'document-text-outline';
            break;
          case 'ProfileTab':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'circle';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4B7BEC',
      tabBarInactiveTintColor: 'gray',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
    })}
  >
    <Tab.Screen 
      name="HomeTab" 
      component={HomeScreen}
      options={{ tabBarLabel: 'Inicio' }}
    />
    <Tab.Screen 
      name="ActivityTab" 
      component={ActivityScreen}
      options={{ tabBarLabel: 'Actividad' }}
    />
    <Tab.Screen 
      name="ReportsTab" 
      component={ReportsStack}
      options={{ tabBarLabel: 'Reportes' }}
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ProfileScreen}
      options={{ tabBarLabel: 'Perfil' }}
    />
  </Tab.Navigator>
);

// Stack Navigator principal (cuando está logueado)
const MainStack = () => (
  <Stack.Navigator>
    {/* Tab Navigator es una pantalla del Stack principal */}
    <Stack.Screen 
      name="Main" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    
    {/* Pantallas modales/overlay que se abren encima del Tab Navigator */}
    <Stack.Screen 
      name="CreateReport" 
      component={CreateReportScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal', // Modal en iOS
      }}
    />
    
    <Stack.Screen 
      name="ReportDetail" 
      component={ReportDetailScreen} 
      options={{ 
        headerShown: true, 
        title: 'Detalle del Reporte',
        headerStyle: { backgroundColor: '#4B7BEC' },
        headerTintColor: '#fff',
      }}
    />
    
    <Stack.Screen 
      name="ReportSuccess" 
      component={ReportSuccessScreen} 
      options={{ 
        headerShown: false,
        gestureEnabled: false, // Evitar deslizar para cerrar
      }}
    />
    
    <Stack.Screen 
      name="ChangePassword" 
      component={ChangePasswordScreen} 
      options={{ 
        headerShown: false,
        presentation: 'modal',
      }}
    />
    
    <Stack.Screen 
      name="Communities" 
      component={CommunitiesScreen} 
      options={{ headerShown: false }}
    />
    
    <Stack.Screen 
      name="CommunityDetail" 
      component={CommunityDetailScreen} 
      options={({ route }) => ({
        headerShown: true,
        title: route.params?.communityName || 'Chat',
        headerStyle: { backgroundColor: '#4B7BEC' },
        headerTintColor: '#fff',
      })}
    />
  </Stack.Navigator>
);

// Stack de autenticación (cuando no está logueado)
const AuthStack = () => (
  <Stack.Navigator 
    initialRouteName="Welcome"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Componente principal App Content
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <OfflineNotice />
      
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Componente principal App con AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}