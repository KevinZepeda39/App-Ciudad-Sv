// src/screens/reports/ReportDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definición de colores
const colors = {
  primary: '#4B7BEC',
  secondary: '#1E90FF',
  background: '#F5F5F5',
  text: '#333333',
};

// Datos de ejemplo para los detalles del reporte
const SAMPLE_REPORT = {
  id: '1',
  title: 'Reporte de Emergencia',
  description: 'Descripción detallada del reporte de emergencia. Este reporte contiene información importante sobre una situación que requiere atención inmediata.',
  date: '15/05/2025',
  time: '14:30',
  location: 'Avenida Principal #123',
  status: 'Completado',
  assignee: 'Juan Pérez',
};

const ReportDetailScreen = ({ route, navigation }) => {
  // En una aplicación real, usarías el ID para buscar los detalles del reporte
  const { reportId } = route.params || { reportId: '1' };
  const report = SAMPLE_REPORT; // En una app real, buscarías el reporte por ID
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <Text style={styles.statusValue}>{report.status}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>{report.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{report.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Ubicación:</Text>
            <Text style={styles.detailValue}>{report.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.detailLabel}>Asignado a:</Text>
            <Text style={styles.detailValue}>{report.assignee}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
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
    color: colors.text,
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
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReportDetailScreen;