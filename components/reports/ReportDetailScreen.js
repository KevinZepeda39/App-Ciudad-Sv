// components/reports/ReportDetailScreen.js - Corregida con manejo de errores
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { reportService } from '../../services/api';

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params || { reportId: '1' };
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  
  // Monitorear la conexión a internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected && !loading && !report) {
        // Si recuperamos la conexión y no tenemos datos, intentamos cargarlos
        fetchReportDetails();
      }
    });

    return () => unsubscribe();
  }, [loading, report]);
  
  // Cargar detalles del reporte al montar el componente
  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);
  
  // Función para obtener los detalles del reporte
  const fetchReportDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar si hay conexión a internet
      const networkState = await NetInfo.fetch();
      setIsConnected(networkState.isConnected);
      
      if (!networkState.isConnected) {
        console.log('Sin conexión a internet - usando datos almacenados si están disponibles');
      }
      
      console.log('Obteniendo detalles del reporte:', reportId);
      const response = await reportService.getReportById(reportId);
      
      if (response && response.success) {
        console.log('Detalles del reporte obtenidos:', response.data);
        setReport(response.data);
      } else {
        setError(response?.message || 'Error al obtener detalles del reporte');
      }
    } catch (error) {
      console.error('Error al obtener detalles del reporte:', error.message);
      setError('No se pudieron cargar los detalles del reporte. ' + 
        (isConnected ? 'Error en el servidor.' : 'Verifique su conexión a Internet.'));
      
      // Crear un reporte simulado para desarrollo
      if (__DEV__) {
        console.log('Usando datos simulados para ReportDetailScreen');
        setReport({
          id: reportId,
          title: `Reporte simulado ${reportId}`,
          description: 'Este es un reporte simulado detallado para desarrollo. Contiene información adicional para probar la visualización en la pantalla de detalles.',
          date: '15/05/2025',
          status: 'Pendiente',
          location: 'San Salvador, El Salvador',
          assignedTo: 'María Pérez',
          priority: 'Alta',
          category: 'Infraestructura'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Función para manejar la actualización al deslizar hacia abajo
  const onRefresh = () => {
    setRefreshing(true);
    fetchReportDetails();
  };
  
  // Renderizar mensaje de error
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons 
        name={isConnected ? "alert-circle-outline" : "wifi-off-outline"} 
        size={64} 
        color="#FF3B30" 
      />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchReportDetails}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Si está cargando, mostrar indicador
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BEC" />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  
  
  // Si hay un error, mostrar mensaje
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }
  
  // Si no hay reporte, mostrar mensaje
  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>No se encontró el reporte</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Renderizar detalles del reporte
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4B7BEC']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <Text style={styles.statusValue}>{report.status || 'Pendiente'}</Text>
          </View>
          
          {!isConnected && (
            <View style={styles.offlineBadge}>
              <Ionicons name="wifi-off-outline" size={12} color="#fff" />
              <Text style={styles.offlineText}>Modo sin conexión</Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#4B7BEC" />
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>{report.date || 'No disponible'}</Text>
          </View>
          
          {report.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#4B7BEC" />
              <Text style={styles.detailLabel}>Ubicación:</Text>
              <Text style={styles.detailValue}>{report.location}</Text>
            </View>
          )}
          
          {report.assignedTo && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="#4B7BEC" />
              <Text style={styles.detailLabel}>Asignado a:</Text>
              <Text style={styles.detailValue}>{report.assignedTo}</Text>
            </View>
          )}
          
          {report.priority && (
            <View style={styles.detailRow}>
              <Ionicons name="flag-outline" size={20} color="#4B7BEC" />
              <Text style={styles.detailLabel}>Prioridad:</Text>
              <Text style={styles.detailValue}>{report.priority}</Text>
            </View>
          )}
          
          {report.category && (
            <View style={styles.detailRow}>
              <Ionicons name="bookmark-outline" size={20} color="#4B7BEC" />
              <Text style={styles.detailLabel}>Categoría:</Text>
              <Text style={styles.detailValue}>{report.category}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              console.log('Volviendo a la lista de reportes');
              navigation.navigate('ReportsTab');
            }}
          >
            <Text style={styles.buttonText}>Volver a la lista</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              console.log('Volviendo al inicio');
              navigation.navigate('HomeTab');
            }}
          >
            <Text style={styles.secondaryButtonText}>Ir al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4B7BEC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 20,
    backgroundColor: '#4B7BEC',
    position: 'relative',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginRight: 5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  offlineBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    marginRight: 5,
    width: 80,
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4B7BEC',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4B7BEC',
  },
  secondaryButtonText: {
    color: '#4B7BEC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportDetailScreen;