// services/communityService.js - Versión completa y corregida
import { Platform } from 'react-native';

// URL del backend
const getApiUrl = () => {
  if (__DEV__) {
    // En desarrollo - cambiar por tu IP local
    return 'http://192.168.1.13:3000/api';
  } else {
    // En producción
    return 'https://tu-api.com/api';
  }
};

const API_BASE_URL = getApiUrl();

console.log('🔗 Community API URL:', API_BASE_URL);

// Función helper para manejar respuestas de la API
const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data;
};

// Función helper para peticiones con timeout
const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const communityService = {
  // Obtener todas las comunidades
  getAllCommunities: async () => {
    try {
      console.log('📡 Obteniendo todas las comunidades...');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await handleApiResponse(response);
      console.log('✅ Comunidades cargadas:', data.data.length);
      
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en getAllCommunities:', error);
      
      // Datos de respaldo en caso de error
      const fallbackData = [
        {
          id: 1,
          name: 'Seguridad Ciudadana',
          description: 'Comunidad para reportar problemas de seguridad en el barrio',
          memberCount: 1234,
          isJoined: false,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Medio Ambiente',
          description: 'Cuidemos nuestro planeta juntos, reportes ambientales',
          memberCount: 567,
          isJoined: true,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Reportes Alta Vista',
          description: 'Comunidad del barrio Alta Vista - Chat activo',
          memberCount: 316,
          isJoined: false,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Los Comestibles SV',
          description: 'Comparte y descubre lugares de comida en El Salvador',
          memberCount: 542,
          isJoined: true,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Deportes y Recreación',
          description: 'Organiza eventos deportivos y actividades recreativas',
          memberCount: 189,
          isJoined: false,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        }
      ];
      
      console.log('🔄 Usando datos de respaldo');
      return {
        success: true,
        data: fallbackData,
        message: 'Datos de respaldo (sin conexión)'
      };
    }
  },

  // Obtener comunidades del usuario
  getUserCommunities: async () => {
    try {
      console.log('📡 Obteniendo comunidades del usuario...');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await handleApiResponse(response);
      console.log('✅ Comunidades del usuario cargadas:', data.data.length);
      
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en getUserCommunities:', error);
      
      // Datos de respaldo
      const fallbackData = [
        {
          id: 2,
          name: 'Medio Ambiente',
          description: 'Cuidemos nuestro planeta juntos',
          memberCount: 567,
          isJoined: true,
          isAdmin: false,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Los Comestibles SV',
          description: 'Comparte y descubre lugares de comida en El Salvador',
          memberCount: 542,
          isJoined: true,
          isAdmin: false,
          imagen: null,
          fechaCreacion: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        data: fallbackData,
        message: 'Datos de respaldo (sin conexión)'
      };
    }
  },

  // Unirse a una comunidad
  joinCommunity: async (communityId) => {
    try {
      console.log('📡 Uniéndose a comunidad:', communityId);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'join', 
          communityId: parseInt(communityId) 
        }),
      });

      const data = await handleApiResponse(response);
      console.log('✅ Se unió a la comunidad exitosamente');
      
      return {
        success: true,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en joinCommunity:', error);
      return {
        success: true,
        message: 'Te has unido a la comunidad (offline)'
      };
    }
  },

  // Salir de una comunidad
  leaveCommunity: async (communityId) => {
    try {
      console.log('📡 Saliendo de comunidad:', communityId);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'leave', 
          communityId: parseInt(communityId) 
        }),
      });

      const data = await handleApiResponse(response);
      console.log('✅ Salió de la comunidad exitosamente');
      
      return {
        success: true,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en leaveCommunity:', error);
      return {
        success: true,
        message: 'Has salido de la comunidad (offline)'
      };
    }
  },

  createCommunity: async (communityData) => {
  try {
    console.log('📡 Creando comunidad:', communityData);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: communityData.name,
        description: communityData.description,
        category: communityData.category || 'general',
        tags: communityData.tags || ''
      }),
    });

    const data = await handleApiResponse(response);
    console.log('✅ Comunidad creada exitosamente:', data.data);
    
    return {
      success: true,
      data: data.data,
      message: data.message
    };
    
  } catch (error) {
    console.error('❌ Error en createCommunity:', error);
    
    const newCommunity = {
      id: Date.now(),
      name: communityData.name,
      description: communityData.description,
      category: communityData.category || 'general',
      tags: communityData.tags || '',
      memberCount: 1,
      isJoined: true,
      isAdmin: true,
      imagen: null,
      fechaCreacion: new Date().toISOString()
    };
    
    return { 
      success: true, 
      data: newCommunity,
      message: 'Comunidad creada (offline)' 
    };
  }
},

  // Obtener detalles de una comunidad
  getCommunityDetails: async (communityId) => {
    try {
      console.log('📡 Obteniendo detalles de comunidad:', communityId);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/${communityId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await handleApiResponse(response);
      console.log('✅ Detalles de comunidad obtenidos');
      
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en getCommunityDetails:', error);
      
      // Datos de respaldo
      const mockCommunity = {
        id: parseInt(communityId),
        name: 'Comunidad Local',
        description: 'Descripción de respaldo para modo offline',
        memberCount: 100,
        isJoined: true,
        isAdmin: false,
        imagen: null,
        creadorNombre: 'Usuario Local',
        fechaCreacion: new Date().toISOString()
      };
      
      return { 
        success: true, 
        data: mockCommunity,
        message: 'Datos de respaldo (sin conexión)'
      };
    }
  },

  // Obtener mensajes del chat
  getCommunityMessages: async (communityId, page = 1, limit = 50) => {
    try {
      console.log(`📡 Obteniendo mensajes de comunidad ${communityId}, página ${page}`);
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/communities/${communityId}/messages?page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await handleApiResponse(response);
      console.log(`✅ Obtenidos ${data.data.length} mensajes`);
      
      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en getCommunityMessages:', error);
      
      // Mensajes de respaldo
      const fallbackMessages = [
        {
          id: 1,
          text: '¡Bienvenido al chat! Este es un mensaje de bienvenida automático.',
          userName: 'Sistema',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
          isOwn: false,
          userId: 0,
          imagenes: []
        },
        {
          id: 2,
          text: 'Aquí pueden reportar cualquier situación que consideren importante para la comunidad.',
          userName: 'Sistema',
          timestamp: new Date(Date.now() - 3000000).toISOString(), // Hace 50 min
          isOwn: false,
          userId: 0,
          imagenes: []
        },
        {
          id: 3,
          text: '¡Hola! Me acabo de unir a esta comunidad. Espero poder contribuir.',
          userName: 'Usuario Local',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // Hace 30 min
          isOwn: true,
          userId: 1,
          imagenes: []
        },
        {
          id: 4,
          text: 'Este es un mensaje de prueba mientras no hay conexión a internet.',
          userName: 'Tú',
          timestamp: new Date(Date.now() - 300000).toISOString(), // Hace 5 min
          isOwn: true,
          userId: 1,
          imagenes: []
        }
      ];
      
      return {
        success: true,
        data: fallbackMessages,
        pagination: { page: 1, limit: 50, hasMore: false },
        message: 'Mensajes de respaldo (sin conexión)'
      };
    }
  },

  // Enviar mensaje
  sendMessage: async (communityId, messageText) => {
    try {
      console.log('📡 Enviando mensaje:', messageText);
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/${communityId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageText
        }),
      });

      const data = await handleApiResponse(response);
      console.log('✅ Mensaje enviado exitosamente');
      
      return {
        success: true,
        data: data.data,
        message: data.message
      };
      
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      
      // Mensaje de respaldo
      const fallbackMessage = {
        id: Date.now(),
        text: messageText,
        userName: 'Tú',
        timestamp: new Date().toISOString(),
        isOwn: true,
        userId: 1,
        imagenes: []
      };
      
      return { 
        success: true, 
        data: fallbackMessage,
        message: 'Mensaje enviado (offline)'
      };
    }
  },

  // Función de test para verificar conectividad
  testConnection: async () => {
    try {
      console.log('🔍 Probando conexión con API de comunidades...');
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/communities/test/connection`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Test de conexión exitoso:', data);
        return { success: true, data };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Test de conexión falló:', error);
      return { success: false, error: error.message };
    }
  },

  // Buscar comunidades
  searchCommunities: async (query) => {
    try {
      console.log('📡 Buscando comunidades:', query);
      
      // Por ahora, obtener todas y filtrar localmente
      // En el futuro se puede crear un endpoint específico de búsqueda
      const result = await communityService.getAllCommunities();
      
      if (result.success) {
        const filteredCommunities = result.data.filter(community =>
          community.name.toLowerCase().includes(query.toLowerCase()) ||
          community.description.toLowerCase().includes(query.toLowerCase())
        );
        
        return {
          success: true,
          data: filteredCommunities,
          message: `Encontradas ${filteredCommunities.length} comunidades`
        };
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en searchCommunities:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Validar datos de comunidad antes de enviar
  validateCommunityData: (communityData) => {
    const errors = [];
    
    if (!communityData.name || !communityData.name.trim()) {
      errors.push('El nombre de la comunidad es requerido');
    }
    
    if (communityData.name && communityData.name.length > 50) {
      errors.push('El nombre no puede superar los 50 caracteres');
    }
    
    if (!communityData.description || !communityData.description.trim()) {
      errors.push('La descripción es requerida');
    }
    
    if (communityData.description && communityData.description.length > 200) {
      errors.push('La descripción no puede superar los 200 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validar mensaje antes de enviar
  validateMessage: (messageText) => {
    const errors = [];
    
    if (!messageText || !messageText.trim()) {
      errors.push('El mensaje no puede estar vacío');
    }
    
    if (messageText && messageText.length > 500) {
      errors.push('El mensaje no puede superar los 500 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Formatear datos de comunidad para la UI
  formatCommunityData: (rawData) => {
    return {
      id: rawData.id || rawData.idComunidad,
      name: rawData.name || rawData.nombre,
      description: rawData.description || rawData.descripcion,
      memberCount: rawData.memberCount || 0,
      isJoined: rawData.isJoined || false,
      isAdmin: rawData.isAdmin || rawData.esAdministrador || false,
      imagen: rawData.imagen,
      fechaCreacion: rawData.fechaCreacion,
      creadorNombre: rawData.creadorNombre
    };
  },

  // Formatear datos de mensaje para la UI
  formatMessageData: (rawData, currentUserId = 1) => {
    return {
      id: rawData.id || rawData.idMensaje,
      text: rawData.text || rawData.contenido,
      userName: rawData.userName || rawData.nombre || 'Usuario',
      timestamp: rawData.timestamp || rawData.fechaEnvio,
      isOwn: rawData.isOwn || rawData.userId === currentUserId,
      userId: rawData.userId || rawData.idUsuario,
      imagenes: rawData.imagenes || []
    };
  }
};