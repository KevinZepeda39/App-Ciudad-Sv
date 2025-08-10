// services/reportService.js - CORREGIDO COMPLETO
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.13:3000'; // Tu IP del servidor

class ReportService {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  // ✅ FUNCIÓN GETREPORTS - LA QUE FALTABA
  async getReports() {
    try {
      console.log('📡 Fetching reports from server...');
      console.log('🔗 URL:', `${this.baseUrl}/api/reports`);

      const response = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 segundos
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Reports fetched successfully:', data.count || 0, 'reports');

      // Retornar los reportes en el formato esperado
      return {
        success: true,
        reports: data.reports || [],
        count: data.count || 0
      };

    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      
      // Retornar datos de respaldo en caso de error
      return {
        success: false,
        error: error.message,
        reports: [
          {
            id: 'offline-1',
            title: 'Sin conexión al servidor',
            description: 'No se pudieron cargar los reportes desde el servidor.',
            status: 'Error',
            date: new Date().toISOString(),
            location: 'Local',
            category: 'Sistema',
            hasImage: false
          }
        ],
        count: 1
      };
    }
  }

  // ✅ CREAR NUEVO REPORTE
  async createReport(reportData) {
    try {
      console.log('📝 Creating new report...');
      console.log('🔗 URL:', `${this.baseUrl}/api/reports`);

      // Crear FormData para enviar imagen si existe
      const formData = new FormData();
      formData.append('title', reportData.title);
      formData.append('description', reportData.description);
      formData.append('ubicacion', reportData.ubicacion || 'San Salvador, El Salvador');
      formData.append('categoria', reportData.categoria || 'general');

      // Agregar imagen si existe
      if (reportData.image) {
        formData.append('image', {
          uri: reportData.image.uri,
          type: reportData.image.type || 'image/jpeg',
          name: reportData.image.fileName || 'report-image.jpg',
        });
      }

      const response = await fetch(`${this.baseUrl}/api/reports`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000, // 15 segundos para subir imágenes
      });

      console.log('📡 Create response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log('✅ Report created successfully:', data.report?.id);

      return {
        success: true,
        report: data.report,
        message: data.message
      };

    } catch (error) {
      console.error('❌ Error creating report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ OBTENER REPORTE POR ID
  async getReportById(id) {
    try {
      console.log('📄 Fetching report by ID:', id);

      const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Report fetched by ID successfully');

      return {
        success: true,
        report: data.report
      };

    } catch (error) {
      console.error('❌ Error fetching report by ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ACTUALIZAR REPORTE
  async updateReport(id, updates) {
    try {
      console.log('🔄 Updating report:', id);

      const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Report updated successfully');

      return {
        success: true,
        report: data.report,
        message: data.message
      };

    } catch (error) {
      console.error('❌ Error updating report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ ELIMINAR REPORTE
  async deleteReport(id) {
    try {
      console.log('🗑️ Deleting report:', id);

      const response = await fetch(`${this.baseUrl}/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Report deleted successfully');

      return {
        success: true,
        message: data.message
      };

    } catch (error) {
      console.error('❌ Error deleting report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ OBTENER ESTADÍSTICAS
  async getStats() {
    try {
      console.log('📊 Fetching report statistics...');

      const response = await fetch(`${this.baseUrl}/api/reports/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Stats fetched successfully');

      return {
        success: true,
        stats: data.stats
      };

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      return {
        success: false,
        error: error.message,
        stats: {
          total: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          resolutionRate: 0,
          recentCount: 0
        }
      };
    }
  }

  // ✅ FUNCIÓN DE TEST DE CONEXIÓN
  async testConnection() {
    try {
      console.log('🔍 Testing report service connection...');

      const response = await fetch(`${this.baseUrl}/api/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      const data = await response.json();
      console.log('✅ Report service connection test successful');

      return {
        success: true,
        message: 'Connection successful',
        serverInfo: data
      };

    } catch (error) {
      console.error('❌ Report service connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
const reportService = new ReportService();

export default reportService;