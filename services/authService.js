// services/authService.js - VERSIÓN CORREGIDA PARA CELULAR
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
  // IP CORREGIDA para dispositivo físico
  baseUrl: 'http://192.168.1.13:3000',
  
  // FUNCIÓN DE LOGIN CORREGIDA
  async login(email, password) {
    try {
      console.log('🔐 === LOGIN ATTEMPT ===');
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password ? password.length : 0);
      console.log('🔗 POST', `${this.baseUrl}/api/auth/login`);

      // Validación de campos
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Crear timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Crear fetch promise
      const fetchPromise = fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
      });

      // Race entre fetch y timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Verificar si la respuesta es OK
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ HTTP Error', response.status + ':', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Parsear respuesta JSON
      const data = await response.json();
      console.log('✅ Login response:', data);

      if (data.success && data.user) {
        // Guardar sesión
        await this.saveUserSession(data.user, data.token);
        console.log('💾 Session saved for user:', data.user.nombre);
        return data;
      } else {
        throw new Error(data.error || 'Respuesta inválida del servidor');
      }

    } catch (error) {
      console.log('❌ LOGIN ERROR:', error.message);
      
      // Manejo de errores específicos
      if (error.message === 'Request timeout') {
        throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      } else if (error.message.includes('JSON')) {
        throw new Error('Error de comunicación con el servidor.');
      } else {
        throw new Error(error.message || 'Error inesperado al iniciar sesión');
      }
    }
  },

  // FUNCIÓN DE REGISTRO CORREGIDA
  async register(nombre, email, password) {
    try {
      console.log('📝 === REGISTER ATTEMPT ===');
      console.log('👤 Name:', nombre);
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password ? password.length : 0);
      console.log('🔗 POST', `${this.baseUrl}/api/auth/register`);

      // Validación de campos
      if (!nombre || !email || !password) {
        throw new Error('Todos los campos son requeridos');
      }

      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido');
      }

      // Crear timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // Crear fetch promise
      const fetchPromise = fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password: password
        }),
      });

      // Race entre fetch y timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ HTTP Error', response.status + ':', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${errorText}` };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Register response:', data);

      if (data.success && data.user) {
        console.log('🎉 Registration successful for:', data.user.nombre);
        return data;
      } else {
        throw new Error(data.error || 'Error en el registro');
      }

    } catch (error) {
      console.log('❌ REGISTER ERROR:', error.message);
      
      // Manejo de errores específicos
      if (error.message === 'Request timeout') {
        throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
      } else {
        throw new Error(error.message || 'Error inesperado en el registro');
      }
    }
  },

  // GUARDAR SESIÓN DE USUARIO
  async saveUserSession(user, token) {
    try {
      const sessionData = {
        user: user,
        token: token,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
      console.log('💾 User session saved successfully');
    } catch (error) {
      console.error('❌ Error saving session:', error);
    }
  },

  // OBTENER SESIÓN GUARDADA
  async getUserSession() {
    try {
      console.log('🔍 Checking authentication status...');
      const sessionData = await AsyncStorage.getItem('userSession');
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        console.log('✅ User session found:', session.user.nombre);
        return session;
      } else {
        console.log('❌ No user session found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }
  },

  // CERRAR SESIÓN
  async logout() {
    try {
      await AsyncStorage.removeItem('userSession');
      console.log('✅ User session cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing session:', error);
      return false;
    }
  },

  // TEST DE CONECTIVIDAD
  async testConnection() {
    try {
      console.log('🔌 Testing server connection...');
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      const fetchPromise = fetch(`${this.baseUrl}/api/auth/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server connection OK:', data.message);
        return true;
      } else {
        console.log('❌ Server connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
  }
};

export default authService;