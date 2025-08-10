// components/reports/ReportListScreen.js - CORREGIDO
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import reportService from '../../services/reportService'; // ✅ CORREGIDO: Sin llaves

// Helper para formatear cualquier valor de forma segura
const formatSafeValue = (value) => {
  if (value == null) return '';
  if (value instanceof Date) {
    return value.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// Helper específico para formatear fechas
const formatDate = (dateValue) => {
  try {
    if (!dateValue) return 'Sin fecha';
    
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return 'Fecha inválida';
      return dateValue.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue;
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return formatSafeValue(dateValue);
  } catch (error) {
    console.log('Error formatting date:', dateValue, error);
    return formatSafeValue(dateValue);
  }
};

const ReportListScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const statusColors = {
    'Resuelto': '#10B981',
    'En progreso': '#F59E0B', 
    'Pendiente': '#EF4444',
    'Revisando': '#8B5CF6',
    'Error': '#DC2626'
  };

  const categoryIcons = {
    'Limpieza': 'trash-outline',
    'Tráfico': 'car-outline',
    'Infraestructura': 'construct-outline',
    'Seguridad': 'shield-outline',
    'Alumbrado': 'bulb-outline',
    'Agua': 'water-outline',
    'General': 'document-outline',
    'Sistema': 'cog-outline',
    'Otros': 'ellipsis-horizontal-outline'
  };

  // ⭐ ESTO ES LO CLAVE: Se ejecuta cada vez que vuelves a esta pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ReportListScreen focused - Loading reports...');
      loadReports();
    }, [])
  );

  const loadReports = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log('📡 Fetching reports from server...');
      
      // ✅ VERIFICAR QUE REPORTSERVICE EXISTE
      if (!reportService || !reportService.getReports) {
        throw new Error('ReportService no está disponible');
      }

      const response = await reportService.getReports(isRefresh);
      
      console.log('📊 Server response:', {
        success: response.success,
        reportCount: response.reports?.length || 0,
        fromCache: response.fromCache
      });
      
      if (response.success) {
        // Normalizar los datos para compatibilidad
        const normalizedReports = (response.reports || []).map(report => ({
          ...report,
          id: formatSafeValue(report.id),
          title: formatSafeValue(report.title),
          description: formatSafeValue(report.description),
          category: formatSafeValue(report.category) || 'General',
          status: formatSafeValue(report.status) || 'Pendiente',
          location: formatSafeValue(report.location) || 'San Salvador, El Salvador',
          hasImage: Boolean(report.hasImage)
        }));

        setReports(normalizedReports);
        setStats(response.stats || null);
        
        console.log(`✅ Successfully loaded ${normalizedReports.length} reports`);
        
        if (response.fromCache) {
          console.log('📦 Data loaded from cache');
        }
        if (response.warning) {
          console.warn('⚠️ Warning:', response.warning);
        }
      } else {
        throw new Error(response.error || 'Error desconocido al cargar reportes');
      }
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      setError(error.message);
      
      if (!isRefresh && reports.length === 0) {
        Alert.alert(
          '❌ Error de conexión',
          `No se pudieron cargar los reportes: ${error.message}`,
          [
            { text: 'Reintentar', onPress: () => loadReports() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    loadReports(true);
  }, []);

  const handleReportPress = (report) => {
    console.log('📄 Opening report:', report.id);
    navigation.navigate('ReportDetail', { reportId: report.id });
  };

  const handleCreateReport = () => {
    console.log('➕ Navigating to CreateReport');
    navigation.navigate('CreateReport');
  };

  const getStatusColor = (status) => {
    return statusColors[formatSafeValue(status)] || '#6B7280';
  };

  const renderReportCard = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => handleReportPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Ionicons 
                name={categoryIcons[formatSafeValue(item.category)] || 'document-outline'} 
                size={16} 
                color={getStatusColor(item.status)} 
              />
            </View>
            <Text style={styles.categoryText}>{formatSafeValue(item.category)}</Text>
            {item.hasImage && (
              <View style={styles.imageIndicator}>
                <Ionicons name="image" size={14} color="#4B7BEC" />
              </View>
            )}
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{formatSafeValue(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.reportTitle} numberOfLines={2}>
          {formatSafeValue(item.title)}
        </Text>

        <Text style={styles.reportDescription} numberOfLines={3}>
          {formatSafeValue(item.description)}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.locationText} numberOfLines={1}>
              {formatSafeValue(item.location)}
            </Text>
          </View>
          
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.dateText}>
              {formatDate(item.date || item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.reportMeta}>
          <View style={styles.reportIdContainer}>
            <Ionicons name="finger-print-outline" size={12} color="#9CA3AF" />
            <Text style={styles.reportId}>#{formatSafeValue(item.id)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        {error ? (
          <Ionicons name="cloud-offline-outline" size={64} color="#D1D5DB" />
        ) : (
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {error ? 'Error de conexión' : 'No hay reportes'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {error 
          ? 'No se pudieron cargar los reportes. Verifica tu conexión e intenta de nuevo.'
          : 'Crea tu primer reporte para comenzar a mejorar tu comunidad.'
        }
      </Text>
      
      {error ? (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={() => loadReports()}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.emptyActionText}>Reintentar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleCreateReport}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyActionText}>Crear Reporte</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
        <LinearGradient
          colors={['#4B7BEC', '#3B82F6']}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
          <Text style={styles.loadingSubtext}>Conectando con la base de datos</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
      
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#4B7BEC', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Mis Reportes</Text>
            <Text style={styles.headerSubtitle}>
              {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.headerAction}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh-outline" 
              size={24} 
              color="#FFFFFF"
              style={refreshing ? styles.spinning : null}
            />
          </TouchableOpacity>
        </View>

        {/* Estadísticas en el header */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatSafeValue(stats.total) || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FFD700' }]}>{formatSafeValue(stats.pending) || 0}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#87CEEB' }]}>{formatSafeValue(stats.resolved) || 0}</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Banner de error si hay */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.errorBannerText}>
            Error de conexión - Mostrando datos guardados
          </Text>
          <TouchableOpacity onPress={() => loadReports()}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de reportes */}
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={item => formatSafeValue(item.id) || Math.random().toString()}
        contentContainerStyle={[
          styles.listContainer,
          reports.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4B7BEC']}
            tintColor="#4B7BEC"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreateReport}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4B7BEC', '#3B82F6']}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 20,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  imageIndicator: {
    marginLeft: 8,
    padding: 4,
    backgroundColor: '#F0F4FF',
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportId: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActionButton: {
    backgroundColor: '#4B7BEC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ReportListScreen;