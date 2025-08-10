// hooks/useAuth.js - VERSIÓN CORREGIDA
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Crear el contexto de autenticación
const AuthContext = createContext({});

// Provider del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar sesión al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const session = await authService.getUserSession();
      
      if (session && session.user) {
        console.log('✅ User session found:', session.user.nombre);
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        console.log('❌ No user session found');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log(isAuthenticated ? '✅ User is authenticated' : '❌ User is not authenticated');
    }
  };

  // FUNCIÓN LOGIN CORREGIDA - CRÍTICA
  const login = async (email, password) => {
    try {
      console.log('🔐 === useAuth.login called ===');
      console.log('📧 Email received:', email);
      console.log('🔑 Password received:', password ? 'YES' : 'NO');
      console.log('🔑 Password length:', password ? password.length : 0);

      // Validación en el hook
      if (!email) {
        throw new Error('Email es requerido');
      }

      if (!password) {
        throw new Error('Contraseña es requerida');
      }

      // LLAMADA CORREGIDA - Pasar ambos parámetros explícitamente
      console.log('📞 Calling authService.login with:', email, password ? `[${password.length} chars]` : 'NO PASSWORD');
      
      const result = await authService.login(email, password);
      
      console.log('✅ Login successful in useAuth:', result);

      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        console.log('🎉 User authenticated successfully:', result.user.nombre);
        return result;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.log('❌ Login failed in useAuth:', error.message);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Forzar logout local aunque falle el servidor
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default { AuthProvider, useAuth };