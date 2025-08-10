// components/HomeScreen.js - Diseño mejorado y moderno
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Monitorear la conexión a internet
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleReportPress = async () => {
    console.log('Botón Enter Report presionado');
    
    if (!isConnected) {
      Alert.alert(
        'Sin conexión a Internet',
        'Es posible que algunas funciones no estén disponibles sin conexión.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar de todos modos', 
            onPress: () => navigateToCreateReport() 
          }
        ]
      );
      return;
    }
    
    navigateToCreateReport();
  };
  
  const navigateToCreateReport = () => {
    setIsLoading(true);
    
    try {
      console.log('Navegando a CreateReport desde HomeScreen');
      navigation.navigate('CreateReport');
    } catch (error) {
      console.error('Error de navegación:', error);
      Alert.alert('Error', 'No se pudo navegar a la pantalla de reportes');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  const navigateToReports = () => {
    console.log('Navegando a ReportsTab desde HomeScreen');
    try {
      navigation.navigate('ReportsTab');
    } catch (error) {
      console.error('Error navegando a ReportsTab:', error);
      Alert.alert('Error', 'No se pudo acceder a la sección de reportes');
    }
  };

  const navigateToActivity = () => {
    console.log('Navegando a ActivityTab desde HomeScreen');
    try {
      navigation.navigate('ActivityTab');
    } catch (error) {
      console.error('Error navegando a ActivityTab:', error);
      Alert.alert('Error', 'No se pudo acceder a la sección de actividad');
    }
  };

  const navigateToCommunities = () => {
    console.log('Navegando a Communities desde HomeScreen');
    navigation.navigate('Communities');
  };

  // Datos de las acciones con iconos y colores personalizados
  const actions = [
    {
      id: 'create-report',
      title: 'Crear Reporte',
      description: 'Reporta problemas en tu comunidad',
      icon: 'document-text',
      color: '#FF6B35',
      lightColor: '#FFF0EC',
      onPress: handleReportPress,
      disabled: isLoading
    },
    {
      id: 'view-reports',
      title: 'Ver Reportes',
      description: 'Accede a tus reportes y edítalos',
      icon: 'list',
      color: '#4B7BEC',
      lightColor: '#F0F4FF',
      onPress: navigateToReports
    },
    {
      id: 'activity',
      title: 'Actividad',
      description: 'Revisa tu actividad reciente',
      icon: 'analytics',
      color: '#26D0CE',
      lightColor: '#F0FFFE',
      onPress: navigateToActivity
    },
    {
      id: 'communities',
      title: 'Comunidades',
      description: 'Únete y participa con otros',
      icon: 'people',
      color: '#A55EEA',
      lightColor: '#F8F4FF',
      onPress: navigateToCommunities
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const renderActionCard = (action) => (
    <TouchableOpacity 
      key={action.id}
      style={[styles.actionCard, { backgroundColor: action.lightColor }]}
      onPress={action.onPress}
      activeOpacity={0.8}
      disabled={action.disabled}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
        {action.id === 'create-report' && isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name={action.icon} size={24} color="#FFFFFF" />
        )}
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDescription}>{action.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={action.color} />
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Offline Banner */}
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Ionicons name="wifi-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>Sin conexión a Internet</Text>
          </View>
        )}
        
        {/* Header con gradiente */}
        <LinearGradient
          colors={['#4B7BEC', '#26D0CE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Reportes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* CTA Principal */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.primaryCTA}
            onPress={handleReportPress}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <View style={styles.ctaContent}>
                <View style={styles.ctaLeft}>
                  <Text style={styles.ctaTitle}>🚨 Reportar Problema</Text>
                  <Text style={styles.ctaSubtitle}>Tu voz puede salvar vidas</Text>
                </View>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="add-circle" size={32} color="#FFFFFF" />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Acciones principales */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          {actions.slice(1).map(renderActionCard)}
        </View>
        
        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>💡 Tips Rápidos</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipText}>
              Toma fotos claras y descriptivas para que tu reporte sea más efectivo
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="location" size={20} color="#FF6B35" />
            <Text style={styles.tipText}>
              Incluye la ubicación exacta para una respuesta más rápida
            </Text>
          </View>
        </View>
        
        {/* Footer de desarrollo */}
        {__DEV__ && (
          <View style={styles.devInfo}>
            <View style={styles.devBadge}>
              <Ionicons name="code-slash" size={16} color="#4B7BEC" />
              <Text style={styles.devInfoText}>Modo Desarrollo</Text>
            </View>
            <Text style={styles.devInfoVersion}>Mi Ciudad SV v1.0.0-beta</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  offlineBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 25,
  },
  primaryCTA: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaGradient: {
    borderRadius: 16,
    padding: 20,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeft: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  tipsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 12,
    lineHeight: 20,
  },
  devInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  devBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  devInfoText: {
    fontSize: 12,
    color: '#4B7BEC',
    fontWeight: '600',
    marginLeft: 6,
  },
  devInfoVersion: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;