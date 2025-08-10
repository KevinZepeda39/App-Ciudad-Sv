// components/reports/ReportSuccessScreen.js - Versión mejorada con animaciones
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Share,
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

const ReportSuccessScreen = ({ navigation, route }) => {
  const [isConnected, setIsConnected] = React.useState(true);
  const reportData = route.params?.reportData || null;
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  
  // Monitorear la conexión a internet
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Iniciar animaciones cuando se monta el componente
  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
    
    // Animación de pulso para el icono de éxito
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
  }, []);
  
  // Compartir el reporte
  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡He reportado un problema: ${reportData?.titulo || 'Nuevo reporte'}! Ayuda a tu comunidad descargando la aplicación Mi Ciudad SV.`,
        title: 'Reporte enviado con Mi Ciudad SV'
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };
  
  // Componente de confetti animado
  const ConfettiItem = ({ delay, color, size }) => {
    const confettiItemAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const animation = Animated.loop(
        Animated.timing(confettiItemAnim, {
          toValue: 1,
          duration: 3000,
          delay: delay,
          useNativeDriver: true,
        })
      );
      animation.start();
    }, []);
    
    return (
      <Animated.View
        style={[
          styles.confettiItem,
          {
            backgroundColor: color,
            width: size,
            height: size,
            transform: [
              {
                translateY: confettiItemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-height, height],
                }),
              },
              {
                rotate: confettiItemAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
            opacity: confettiItemAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1, 0],
            }),
          },
        ]}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Confetti de fondo */}
      <View style={styles.confettiContainer}>
        {[...Array(10)].map((_, index) => (
          <ConfettiItem
            key={index}
            delay={index * 200}
            color={['#4CD964', '#007AFF', '#FF9500', '#FF3B30', '#5856D6'][index % 5]}
            size={Math.random() * 10 + 5}
          />
        ))}
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.successContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successIcon,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="checkmark-circle" size={80} color="#4CD964" />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>¡Reporte enviado!</Text>
          <Text style={styles.subtitle}>Tu reporte está siendo procesado</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <View style={[styles.statusDot, styles.statusDotCompleted]} />
          </View>
          
          <Text style={styles.statusText}>
            Ya está disponible en tu lista de reportes
          </Text>
        </Animated.View>
        
        {reportData && (
          <Animated.View
            style={[
              styles.reportCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color="#4B7BEC" />
              <Text style={styles.cardTitle}>Resumen del Reporte</Text>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="alert-circle" size={16} color="#4B7BEC" />
                </View>
                <Text style={styles.infoText}>{reportData.titulo}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location" size={16} color="#4B7BEC" />
                </View>
                <Text style={styles.infoText}>
                  {reportData.ubicacion || 'Ubicación no especificada'}
                </Text>
              </View>
              
              {reportData.imagen && (
                <View style={styles.imagePreview}>
                  <Image 
                    source={{ uri: reportData.imagen.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}
        
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ReportsTab')}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              <Ionicons name="list" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Ver mis reportes</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social" size={20} color="#4B7BEC" />
            <Text style={styles.secondaryButtonText}>Compartir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.tertiaryButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.helpCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.helpHeader}>
            <Ionicons name="heart" size={24} color="#FF3B30" />
            <Text style={styles.helpTitle}>¡Gracias por tu contribución!</Text>
          </View>
          <Text style={styles.helpText}>
            Tu participación es clave para construir una mejor ciudad para todos. 
            Juntos hacemos la diferencia.
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Reporte enviado</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>💪</Text>
              <Text style={styles.statLabel}>Haciendo la diferencia</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiItem: {
    position: 'absolute',
    left: Math.random() * width,
    borderRadius: 50,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CD964',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#86868B',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E7',
    marginHorizontal: 4,
  },
  statusDotActive: {
    backgroundColor: '#FF9500',
  },
  statusDotCompleted: {
    backgroundColor: '#4CD964',
  },
  statusText: {
    fontSize: 14,
    color: '#4CD964',
    fontWeight: '600',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1D1D1F',
    flex: 1,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    backgroundColor: '#4B7BEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#4B7BEC',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4B7BEC',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: '#86868B',
    fontSize: 16,
    fontWeight: '500',
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginLeft: 12,
  },
  helpText: {
    fontSize: 15,
    color: '#86868B',
    lineHeight: 22,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B7BEC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#86868B',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F2F2F7',
  },
});

export default ReportSuccessScreen;