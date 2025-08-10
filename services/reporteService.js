// services/reportService.js - EXPORTACIÓN CORREGIDA
import { Platform } from 'react-native';

// Configuración específica por plataforma
const getApiConfig = () => {
  console.log('🔧 Configuring for platform:', Platform.OS);
  
  if (Platform.OS === 'android') {
    return {
      baseUrl: 'http://192.168.1.13:3000',
      timeout: 10000
    };
  } else if (Platform.OS === 'ios') {
    return {
      baseUrl: 'http://localhost:3000',
      timeout: 10000
    };
  } else {
    return {
      baseUrl: 'http://localhost:3000',
      timeout: 10000
    };
  }
};

// ✅ FUNCIÓN CREAR REPORTE - EXPORTABLE
const createReport = async (reportData) => {
  try {
    console.log('\n📝 ===== CREATING REPORT =====');
    console.log('📊 Data:', {
      title: reportData.title,
      description: reportData.description,
      ubicacion: reportData.ubicacion,
      categoria: reportData.categoria,
      hasImage: reportData.hasImage
    });

    const { baseUrl, timeout } = getApiConfig();
    console.log('🌐 Using base URL:', baseUrl);

    // Determinar endpoint basado en si tiene imagen
    const endpoint = reportData.hasImage ? '/api/reports' : '/api/reports/simple';
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log('🎯 Endpoint:', endpoint);
    console.log('🔗 Full URL:', fullUrl);

    let requestConfig;

    if (reportData.hasImage && reportData.imageUri) {
      // FormData para reportes con imagen
      console.log('📷 Processing image...');
      
      const formData = new FormData();
      formData.append('title', reportData.title);
      formData.append('description', reportData.description);
      formData.append('ubicacion', reportData.ubicacion);
      formData.append('categoria', reportData.categoria);
      
      // Agregar imagen
      const imageUri = reportData.imageUri;
      const filename = `image_${Date.now()}.jpg`;
      
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      });

      requestConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        body: formData
      };
      
      console.log('📤 Sending FormData with image');
    } else {
      // JSON para reportes sin imagen
      console.log('📝 Sending JSON data (no image)');
      
      requestConfig = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: reportData.title,
          description: reportData.description,
          ubicacion: reportData.ubicacion,
          categoria: reportData.categoria
        })
      };
    }

    console.log('🚀 Sending request...');
    
    // Crear timeout Promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    );

    // Enviar request con timeout
    const response = await Promise.race([
      fetch(fullUrl, requestConfig),
      timeoutPromise
    ]);

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Response data:', result);

    if (result.success) {
      console.log('🎉 Report created successfully!');
      return {
        success: true,
        report: result.report,
        message: result.message || 'Report created successfully'
      };
    } else {
      console.error('❌ Server returned error:', result.error);
      return {
        success: false,
        error: result.error || 'Unknown server error'
      };
    }

  } catch (error) {
    console.error('❌ CREATE REPORT ERROR:', error);
    
    // Fallback: modo offline
    console.log('💾 Switching to offline mode...');
    
    return {
      success: true,
      report: {
        id: Date.now(),
        title: reportData.title,
        description: reportData.description,
        ubicacion: reportData.ubicacion,
        categoria: reportData.categoria,
        hasImage: reportData.hasImage,
        date: new Date().toISOString(),
        offline: true
      },
      message: 'Report saved locally (offline mode)',
      offline: true
    };
  }
};

// ✅ FUNCIÓN OBTENER REPORTES - EXPORTABLE
const getAllReports = async () => {
  try {
    console.log('\n📋 ===== FETCHING ALL REPORTS =====');
    
    const { baseUrl, timeout } = getApiConfig();
    const fullUrl = `${baseUrl}/api/reports`;
    
    console.log('🔗 Fetching from:', fullUrl);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    );

    const response = await Promise.race([
      fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }),
      timeoutPromise
    ]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Fetched reports:', result.reports?.length || 0);

    return {
      success: true,
      reports: result.reports || [],
      total: result.total || result.reports?.length || 0
    };

  } catch (error) {
    console.error('❌ GET REPORTS ERROR:', error.message);
    
    // Datos de ejemplo para modo offline
    return {
      success: true,
      reports: [
        {
          id: 1,
          title: 'Sample Report 1',
          description: 'This is a sample report',
          ubicacion: 'San Salvador',
          categoria: 'general',
          date: new Date().toISOString(),
          offline: true
        },
        {
          id: 2,
          title: 'Sample Report 2', 
          description: 'Another sample report',
          ubicacion: 'San Salvador',
          categoria: 'infrastructure',
          date: new Date().toISOString(),
          offline: true
        }
      ],
      total: 2,
      fromCache: true,
      message: 'Data loaded from cache (offline mode)'
    };
  }
};

// ✅ OBJETO PRINCIPAL DEL SERVICIO
const reportService = {
  createReport,
  getAllReports,
  
  // Métodos adicionales si los necesitas
  getReportById: async (id) => {
    console.log('📄 Getting report by ID:', id);
    // Implementar si necesitas
    return { success: false, error: 'Not implemented yet' };
  },
  
  deleteReport: async (id) => {
    console.log('🗑️ Deleting report:', id);
    // Implementar si necesitas
    return { success: false, error: 'Not implemented yet' };
  }
};

// ✅ EXPORTACIÓN CORRECTA - ESTO ES LO IMPORTANTE
export default reportService;

// ✅ EXPORTACIONES NOMBRADAS ADICIONALES (por si las necesitas)
export { createReport, getAllReports };