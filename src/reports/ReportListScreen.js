// src/screens/reports/ReportListScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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

// Datos de ejemplo para la lista de reportes
const SAMPLE_REPORTS = [
  {
    id: '1',
    title: 'Reporte 1',
    date: '15/05/2025',
    status: 'Completado'
  },
  {
    id: '2',
    title: 'Reporte 2',
    date: '10/05/2025',
    status: 'En revisión'
  },
  {
    id: '3',
    title: 'Reporte 3',
    date: '05/05/2025',
    status: 'Pendiente'
  },
];

const ReportListScreen = ({ navigation }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
    >
      <View style={styles.reportContent}>
        <Text style={styles.reportTitle}>{item.title}</Text>
        <Text style={styles.reportDate}>Fecha: {item.date}</Text>
        <Text style={styles.reportStatus}>Estado: {item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Reportes</Text>
      </View>
      
      {SAMPLE_REPORTS.length > 0 ? (
        <FlatList
          data={SAMPLE_REPORTS}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes reportes</Text>
          <Text style={styles.emptySubtext}>
            Los reportes que crees aparecerán aquí
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('CreateReport')}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContainer: {
    padding: 15,
  },
  reportItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  reportStatus: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default ReportListScreen;