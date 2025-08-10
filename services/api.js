// services/api.js - Actualizado para manejar reportes con imágenes (continuación)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';

// Configura la URL base de la API
const API_URL = __DEV__ 
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api' // Para emulador Android
    : 'http://localhost:5000/api' // Para iOS simulator
  : 'https://api.miciudadsv.com/api'; // Producción

console.log('API URL configurada como:', API_URL);

// Crea una instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // 20 segundos de timeout para permitir subida de imágenes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de autenticación a las solicitudes
api.interceptors.request.use(
  async (config) => {
    try {
      // Verificar conexión a internet antes de la solicitud
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        // Rechazar la solicitud si no hay conexión a internet
        return Promise.reject(new Error('No internet connection'));
      }

      // Ajustar los headers dependiendo del tipo de solicitud
      if (config.data instanceof FormData) {
        // Si es FormData (subida de archivos), usar content-type correcto
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error en interceptor de solicitud:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('Error en solicitud Axios:', error.message);
    
    // Verificar si es un error de red
    if (error.message === 'Network Error' || error.message === 'No internet connection') {
      console.log('Detectado error de red - usando datos simulados');
      
      // Si estamos en desarrollo, simular respuestas para pruebas
      if (__DEV__) {
        const url = error.config.url || '';
        const method = error.config.method || '';
        
        // Simular diferentes respuestas según la URL y método
        if (url.includes('/reports') && method === 'get' && !url.includes('/reports/')) {
          // Lista de reportes
          return Promise.resolve({
            data: {
              success: true,
              data: mockData.reports
            }
          });
        } else if (url.includes('/reports/') && method === 'get') {
          // Detalles de un reporte específico
          const reportId = url.split('/').pop();
          return Promise.resolve({
            data: {
              success: true,
              data: mockData.reportDetails[reportId] || mockData.reportDetails['1']
            }
          });
        } else if (url.includes('/reports') && method === 'post') {
          // Creación de reporte simulado
          return Promise.resolve({
            data: {
              success: true,
              message: 'Reporte creado exitosamente (simulado)',
              data: {
                idReporte: Date.now().toString(),
                titulo: error.config.data instanceof FormData 
                  ? error.config.data.get('titulo') 
                  : 'Reporte simulado',
                descripcion: error.config.data instanceof FormData 
                  ? error.config.data.get('descripcion') 
                  : 'Descripción simulada',
                fechaCreacion: new Date().toISOString()
              }
            }
          });
        } else if (url.includes('/auth/login')) {
          // Login simulado
          return Promise.resolve({
            data: {
              success: true,
              token: 'fake-token-123456',
              user: {
                id: '1',
                name: 'Usuario de Prueba',
                email: 'usuario@example.com'
              }
            }
          });
        } else if (url.includes('/auth/register')) {
          // Registro simulado
          return Promise.resolve({
            data: {
              success: true,
              message: 'Usuario registrado con éxito'
            }
          });
        }
      }
    }
    
    // Si es un error de autenticación (401)
    if (error.response && error.response.status === 401) {
      // Limpiar sesión
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
      
      // Alertar al usuario
      Alert.alert(
        'Sesión expirada',
        'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
      );
    }
    
    return Promise.reject(error);
  }
);

// Datos simulados para modo offline/desarrollo
const mockData = {
  reports: [
    {
      id: '1',
      titulo: 'Basura acumulada en la calle',
      descripcion: 'Hay basura acumulada desde hace varios días y nadie la recoge',
      fecha: '15/05/2025',
      estado: 'Pendiente',
      imagenUrl: 'https://via.placeholder.com/300'
    },
    {
      id: '2',
      titulo: 'Bache peligroso',
      descripcion: 'Hay un bache grande que está causando accidentes',
      fecha: '10/05/2025',
      estado: 'En revisión',
      imagenUrl: 'https://via.placeholder.com/300'
    },
    {
      id: '3',
      titulo: 'Semáforo no funciona',
      descripcion: 'El semáforo de la esquina no funciona desde ayer',
      fecha: '05/05/2025',
      estado: 'Completado',
      imagenUrl: null
    }
  ],
  reportDetails: {
    '1': {
      id: '1',
      titulo: 'Basura acumulada en la calle',
      descripcion: 'Hay basura acumulada desde hace varios días y nadie la recoge. El mal olor ya es insoportable y está atrayendo animales y moscas.',
      fecha: '15/05/2025',
      estado: 'Pendiente',
      ubicacion: 'San Salvador, El Salvador',
      asignadoA: 'Departamento de Aseo',
      imagenUrl: 'https://via.placeholder.com/300'
    },
    '2': {
      id: '2',
      titulo: 'Bache peligroso',
      descripcion: 'Hay un bache grande que está causando accidentes. Ya han ocurrido varios percances y es urgente que se repare.',
      fecha: '10/05/2025',
      estado: 'En revisión',
      ubicacion: 'Santa Tecla, La Libertad',
      asignadoA: 'Obras Públicas',
      imagenUrl: 'https://via.placeholder.com/300'
    },
    '3': {
      id: '3',
      titulo: 'Semáforo no funciona',
      descripcion: 'El semáforo de la esquina no funciona desde ayer, causando problemas de tráfico y situaciones peligrosas.',
      fecha: '05/05/2025',
      estado: 'Completado',
      ubicacion: 'Soyapango, San Salvador',
      asignadoA: 'Departamento de Tránsito',
      imagenUrl: null
    }
  }
};

// Funciones de servicio para reportes
export const reportService = {
  // Comprobar estado de conexión
  checkConnection: async () => {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected;
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      return false;
    }
  },
  
  // Obtener todos los reportes
  getReports: async () => {
    try {
      console.log('Obteniendo reportes desde:', API_URL + '/reports');
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Error al obtener reportes:', error.message);
      
      // En desarrollo, retornar datos simulados
      if (__DEV__) {
        console.log('Usando datos simulados para reportes');
        return {
          success: true,
          data: mockData.reports
        };
      }
      
      throw error;
    }
  },
  
  // Obtener un reporte por ID
  getReportById: async (id) => {
    try {
      console.log('Obteniendo detalles del reporte:', id);
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener reporte ${id}:`, error.message);
      
      // En desarrollo, retornar datos simulados
      if (__DEV__) {
        console.log('Usando datos simulados para detalles del reporte');
        return {
          success: true,
          data: mockData.reportDetails[id] || mockData.reportDetails['1']
        };
      }
      
      throw error;
    }
  },
  
  // Crear un nuevo reporte (con soporte para FormData e imágenes)
  createReport: async (reportData) => {
    try {
      console.log('Creando nuevo reporte...');
      
      // Si reportData no es FormData, convertirlo
      let finalData = reportData;
      if (!(reportData instanceof FormData)) {
        finalData = new FormData();
        Object.keys(reportData).forEach(key => {
          finalData.append(key, reportData[key]);
        });
      }
      
      // Log para depuración
      if (__DEV__) {
        if (finalData instanceof FormData) {
          console.log('Enviando FormData con los siguientes campos:');
          for (const pair of finalData.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
          }
        } else {
          console.log('Enviando datos:', finalData);
        }
      }
      
      const response = await api.post('/reports', finalData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear reporte:', error.message);
      
      // En desarrollo, simular respuesta exitosa
      if (__DEV__) {
        console.log('Simulando creación exitosa de reporte en desarrollo');
        
        let titulo = 'Reporte simulado';
        let descripcion = 'Descripción simulada';
        
        // Intentar extraer título y descripción si es FormData
        if (reportData instanceof FormData) {
          titulo = reportData.get('titulo') || titulo;
          descripcion = reportData.get('descripcion') || descripcion;
        } else {
          titulo = reportData.titulo || titulo;
          descripcion = reportData.descripcion || descripcion;
        }
        
        return {
          success: true,
          message: 'Reporte creado exitosamente (simulado)',
          data: {
            idReporte: Date.now().toString(),
            titulo,
            descripcion,
            fechaCreacion: new Date().toISOString(),
            imagenUrl: 'https://via.placeholder.com/300'
          }
        };
      }
      
      throw error;
    }
  },
  
  // Actualizar un reporte
  updateReport: async (id, reportData) => {
    try {
      // Si reportData no es FormData, convertirlo si contiene una imagen
      let finalData = reportData;
      if (!(reportData instanceof FormData) && reportData.imagen) {
        finalData = new FormData();
        Object.keys(reportData).forEach(key => {
          if (key === 'imagen') {
            const imageUri = Platform.OS === 'ios' ? reportData.imagen.uri.replace('file://', '') : reportData.imagen.uri;
            const filename = reportData.imagen.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            finalData.append('imagen', {
              uri: imageUri,
              name: filename,
              type
            });
          } else {
            finalData.append(key, reportData[key]);
          }
        });
        
        const response = await api.put(`/reports/${id}`, finalData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Si no hay imagen o ya es FormData, enviar normalmente
        const response = await api.put(`/reports/${id}`, finalData);
        return response.data;
      }
    } catch (error) {
      console.error(`Error al actualizar reporte ${id}:`, error.message);
      
      // En desarrollo, simular respuesta exitosa
      if (__DEV__) {
        return {
          success: true,
          message: 'Reporte actualizado exitosamente (simulado)',
          data: {
            id,
            ...reportData,
            updatedAt: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  },
  
  // Eliminar un reporte
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar reporte ${id}:`, error.message);
      
      // En desarrollo, simular respuesta exitosa
      if (__DEV__) {
        return {
          success: true,
          message: 'Reporte eliminado exitosamente (simulado)'
        };
      }
      
      throw error;
    }
  },
  
  // Guardar reporte localmente (para modo offline)
  saveReportLocally: async (reportData) => {
    try {
      // Obtener reportes guardados previamente
      const storedReports = await AsyncStorage.getItem('offlineReports');
      let offlineReports = storedReports ? JSON.parse(storedReports) : [];
      
      // Crear un ID temporal para el reporte
      const tempReport = {
        id: `temp_${Date.now()}`,
        ...reportData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Guardar imagen si existe
      if (reportData.imagen) {
        // Aquí podrías implementar una lógica para guardar la imagen localmente
        // Por simplicidad, solo guardamos la URI de la imagen
        tempReport.imagenLocalUri = reportData.imagen.uri;
      }
      
      // Añadir a la lista de reportes pendientes
      offlineReports.push(tempReport);
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('offlineReports', JSON.stringify(offlineReports));
      
      return {
        success: true,
        message: 'Reporte guardado localmente',
        data: tempReport
      };
    } catch (error) {
      console.error('Error al guardar reporte localmente:', error);
      throw error;
    }
  },
  
  // Sincronizar reportes guardados localmente
  syncOfflineReports: async () => {
    try {
      // Verificar conexión
      const isConnected = await reportService.checkConnection();
      if (!isConnected) {
        return {
          success: false,
          message: 'No hay conexión a Internet'
        };
      }
      
      // Obtener reportes guardados localmente
      const storedReports = await AsyncStorage.getItem('offlineReports');
      if (!storedReports) {
        return {
          success: true,
          message: 'No hay reportes pendientes de sincronización'
        };
      }
      
      const offlineReports = JSON.parse(storedReports);
      if (offlineReports.length === 0) {
        return {
          success: true,
          message: 'No hay reportes pendientes de sincronización'
        };
      }
      
      // Sincronizar cada reporte
      const results = [];
      for (const report of offlineReports) {
        try {
          // Crear FormData para el reporte
          const reportData = new FormData();
          Object.keys(report).forEach(key => {
            if (key === 'imagenLocalUri' && report[key]) {
              const imageUri = Platform.OS === 'ios' ? report[key].replace('file://', '') : report[key];
              const filename = report[key].split('/').pop();
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : 'image/jpeg';
              
              reportData.append('imagen', {
                uri: imageUri,
                name: filename,
                type
              });
            } else if (key !== 'id' && key !== 'status' && key !== 'createdAt') {
              reportData.append(key, report[key]);
            }
          });
          
          // Enviar al servidor
          const response = await api.post('/reports', reportData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          results.push({
            tempId: report.id,
            success: true,
            serverId: response.data.data.idReporte
          });
        } catch (error) {
          results.push({
            tempId: report.id,
            success: false,
            error: error.message
          });
        }
      }
      
      // Eliminar los reportes sincronizados exitosamente
      const remainingReports = offlineReports.filter(report => 
        !results.find(r => r.tempId === report.id && r.success)
      );
      
      await AsyncStorage.setItem('offlineReports', JSON.stringify(remainingReports));
      
      return {
        success: true,
        message: `Sincronizados ${results.filter(r => r.success).length} de ${offlineReports.length} reportes`,
        results,
        pendingCount: remainingReports.length
      };
    } catch (error) {
      console.error('Error al sincronizar reportes:', error);
      throw error;
    }
  }
};

export default api;