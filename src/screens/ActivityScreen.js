// src/screens/ActivityScreen.js - CORREGIDO ver git hub comprobación
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import reportService from '../../services/reportService'; // ✅ CORREGIDO: Sin llaves

// Definición de colores mejorados
const colors = {
  primary: '#4B7BEC',
  secondary: '#26D0CE',
  success: '#26D67C',
  warning: '#FFB84D',
  danger: '#FF6B6B',
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E9ECEF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const ActivityScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [viewedReports, setViewedReports] = useState(new Set());

  // Cargar reportes cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ActivityScreen focused - Loading reports...');
      loadUserReports();
    }, [])
  );

  // Cargar reportes del usuario desde la base de datos
  const loadUserReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📋 Cargando reportes del usuario desde MySQL...');
      
      // ✅ VERIFICAR QUE REPORTSERVICE EXISTE
      if (!reportService || !reportService.getReports) {
        throw new Error('ReportService no está disponible');
      }
      
      const response = await reportService.getReports();
      
      if (response.success) {
        const userReports = (response.reports || []).map((report, index) => ({
          ...report,
          id: report.id || index + 1,
          title: report.title || `Reporte ${index + 1}`,
          description: report.description || 'Sin descripción',
          lastViewed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: Math.floor(Math.random() * 10) + 1,
          status: report.status || 'Pendiente',
          category: report.category || 'General',
          createdAt: report.createdAt || new Date().toISOString(),
          isOwn: true // Por ahora, marcar todos como propios para permitir edición
        }));
        
        setReports(userReports);
        console.log(`✅ ${userReports.length} reportes cargados desde MySQL`);
        
        if (response.fromCache) {
          console.log('⚠️ Usando datos de respaldo - Sin conexión a base de datos');
        }
      } else {
        console.error('❌ Error en respuesta:', response.error);
        Alert.alert('Error', 'No se pudieron cargar los reportes');
      }
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      Alert.alert('Error', `Problema de conexión al cargar reportes: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserReports();
  }, [loadUserReports]);

  // Abrir modal para editar reporte
  const openEditModal = (report) => {
    if (!report.isOwn) {
      Alert.alert('No permitido', 'Solo puedes editar reportes que tú creaste');
      return;
    }
    
    setSelectedReport(report);
    setEditedTitle(report.title);
    setEditedDescription(report.description);
    setModalVisible(true);
  };

  // Actualizar reporte en la base de datos
  const updateReport = async () => {
    if (!editedTitle.trim() || !editedDescription.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setUpdating(true);
      console.log(`🔄 Actualizando reporte ${selectedReport.id} en MySQL...`);
      
      // ✅ VERIFICAR QUE REPORTSERVICE TIENE LA FUNCIÓN
      if (!reportService || !reportService.updateReport) {
        throw new Error('Función updateReport no disponible');
      }
      
      const response = await reportService.updateReport(selectedReport.id, {
        titulo: editedTitle.trim(), // Usar 'titulo' según tu base de datos
        descripcion: editedDescription.trim() // Usar 'descripcion' según tu base de datos
      });
      
      if (response.success) {
        // Actualizar el reporte en la lista local
        const updatedReports = reports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, title: editedTitle.trim(), description: editedDescription.trim() }
            : report
        );
        
        setReports(updatedReports);
        console.log('✅ Reporte actualizado exitosamente en MySQL');
        Alert.alert('Éxito', 'Reporte actualizado correctamente');
        setModalVisible(false);
      } else {
        Alert.alert('Error', response.error || 'Error al actualizar el reporte');
      }
    } catch (error) {
      console.error('❌ Error actualizando reporte:', error);
      Alert.alert('Error', `Problema de conexión al actualizar: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Eliminar reporte de la base de datos
  const deleteReport = (report) => {
    if (!report.isOwn) {
      Alert.alert('No permitido', 'Solo puedes eliminar reportes que tú creaste');
      return;
    }
    
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${report.title}"?\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Eliminando reporte ${report.id} de MySQL...`);
              
              // ✅ VERIFICAR QUE REPORTSERVICE TIENE LA FUNCIÓN
              if (!reportService || !reportService.deleteReport) {
                throw new Error('Función deleteReport no disponible');
              }
              
              const response = await reportService.deleteReport(report.id);
              
              if (response.success) {
                // Eliminar de la lista local
                const filteredReports = reports.filter(r => r.id !== report.id);
                setReports(filteredReports);
                
                console.log('✅ Reporte eliminado exitosamente de MySQL');
                Alert.alert('Éxito', 'Reporte eliminado correctamente');
              } else {
                Alert.alert('Error', response.error || 'Error al eliminar el reporte');
              }
            } catch (error) {
              console.error('❌ Error eliminando reporte:', error);
              Alert.alert('Error', `Problema de conexión al eliminar: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // Marcar reporte como visto
  const markAsViewed = (reportId) => {
    setViewedReports(prev => new Set([...prev, reportId]));
    // Solo marcar si la función existe
    if (reportService && reportService.markAsViewed) {
      reportService.markAsViewed(reportId);
    }
  };

  // Obtener icono según el tipo de actividad
  const getActivityInfo = (report) => {
    if (report.isOwn) {
      return {
        icon: 'create-outline',
        type: 'Creado por ti',
        color: colors.primary,
        bgColor: 'rgba(75, 123, 236, 0.1)'
      };
    } else {
      return {
        icon: 'eye-outline',
        type: 'Visto por ti',
        color: colors.secondary,
        bgColor: 'rgba(38, 208, 206, 0.1)'
      };
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Sin fecha';
      
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.log('Error formatting date:', dateString, error);
      return 'Sin fecha';
    }
  };

  const renderReportItem = ({ item }) => {
    const activityInfo = getActivityInfo(item);
    
    return (
      <View style={styles.reportCard}>
        <TouchableOpacity
          style={styles.reportHeader}
          onPress={() => {
            markAsViewed(item.id);
            navigation.navigate('ReportDetail', { reportId: item.id });
          }}
        >
          <View style={[styles.iconContainer, { backgroundColor: activityInfo.bgColor }]}>
            <Ionicons 
              name={activityInfo.icon} 
              size={24} 
              color={activityInfo.color} 
            />
          </View>
          
          <View style={styles.reportContent}>
            <View style={styles.reportTitle}>
              <Text style={styles.titleText} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.statusBadge, { 
                  backgroundColor: item.status === 'Resuelto' ? colors.success : 
                                  item.status === 'En progreso' ? colors.warning : colors.textSecondary 
                }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                {item.hasImage && (
                  <View style={styles.imageBadge}>
                    <Ionicons name="image" size={12} color={colors.primary} />
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.activityType}>{activityInfo.type}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            
            <View style={styles.reportFooter}>
              <Text style={styles.dateText}>
                {item.isOwn ? `Creado ${formatDate(item.createdAt)}` : `Visto ${formatDate(item.lastViewed)}`}
              </Text>
              {!item.isOwn && (
                <Text style={styles.viewCount}>
                  👁️ {item.viewCount} {item.viewCount === 1 ? 'vez' : 'veces'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Botones de acción solo para reportes propios */}
        {item.isOwn && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                Editar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteReport(item)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Separar reportes por tipo
  const ownReports = reports.filter(r => r.isOwn);
  const viewedReportsData = reports.filter(r => !r.isOwn);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando actividad...</Text>
          <Text style={styles.loadingSubtext}>Conectando con MySQL...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Actividad</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ownReports.length}</Text>
          <Text style={styles.statLabel}>Reportes creados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{viewedReportsData.length}</Text>
          <Text style={styles.statLabel}>Reportes vistos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total actividad</Text>
        </View>
      </View>
      
      {reports.length > 0 ? (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No hay actividad reciente</Text>
          <Text style={styles.emptySubtext}>
            Tu actividad aparecerá aquí cuando crees o veas reportes
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateReport')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear primer reporte</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal para editar reporte */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Reporte</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Título</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="Título del reporte"
                  maxLength={100}
                />
                <Text style={styles.charCount}>{editedTitle.length}/100</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Descripción detallada"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.charCount}>{editedDescription.length}/500</Text>
              </View>

              <View style={styles.warningContainer}>
                <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
                <Text style={styles.warningText}>
                  Los cambios se guardarán en la base de datos MySQL
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateReport}
                disabled={updating || !editedTitle.trim() || !editedDescription.trim()}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar en BD</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
  },
  reportCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  imageBadge: {
    backgroundColor: 'rgba(75, 123, 236, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activityType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  viewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  editButton: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  deleteButton: {},
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ActivityScreen;