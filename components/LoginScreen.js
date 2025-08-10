// components/LoginScreen.js - CORREGIDO para recibir credenciales del registro
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Obtener parámetros del registro si vienen
  useEffect(() => {
    // Si viene del registro, usar esas credenciales
    if (route?.params?.prefilledEmail) {
      setEmail(route.params.prefilledEmail);
      console.log('📧 Email from registration:', route.params.prefilledEmail);
    }
    
    if (route?.params?.prefilledPassword) {
      setPassword(route.params.prefilledPassword);
      console.log('🔑 Password from registration received');
    }
    
    // Si no hay credenciales del registro, usar las de demo
    if (!route?.params?.prefilledEmail && __DEV__) {
      setEmail('lucia@example.com');
      setPassword('password123');
    }

    // Mostrar mensaje de éxito si viene del registro
    if (route?.params?.message) {
      Alert.alert('¡Éxito!', route.params.message);
    }
  }, [route?.params]);

  const handleLogin = async () => {
    if (loading) return;

    // LOG PARA DEBUG
    console.log('🔍 === LOGIN DEBUG ===');
    console.log('📧 Email value:', email);
    console.log('🔑 Password value:', password);
    console.log('📧 Email length:', email ? email.length : 0);
    console.log('🔑 Password length:', password ? password.length : 0);
    console.log('📧 Email trimmed:', email ? email.trim() : 'EMPTY');

    // Validaciones básicas CON LOGS
    if (!email || !email.trim()) {
      console.log('❌ Email validation failed - empty email');
      Alert.alert('Error', 'Por favor ingresa tu email');
      return;
    }

    if (!password || !password.trim()) {
      console.log('❌ Password validation failed - empty password');
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('❌ Email format validation failed');
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Login attempt for:', email.trim());
      console.log('🔑 Password length:', password.length);
      
      // Llamar al hook de login CON VALORES EXPLÍCITOS
      const result = await login(email.trim(), password);
      
      console.log('🎉 Login successful:', result);
      console.log('🎉 Login successful, navigating to main app...');
      
      // La navegación la maneja automáticamente useAuth
      // al actualizar el estado de autenticación
      
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      console.log('❌ Login error:', error);
      
      // Mostrar error específico al usuario
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message.includes('Credenciales inválidas')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
        errorMessage = 'Problema de conexión. Verifica tu internet y que el servidor esté funcionando.';
      } else if (error.message.includes('servidor')) {
        errorMessage = 'Error del servidor. Intenta más tarde.';
      } else {
        errorMessage = error.message || 'Error inesperado al iniciar sesión';
      }
      
      Alert.alert(
        'Error de Login', 
        errorMessage,
        [
          { text: 'OK' },
          {
            text: 'Usar credenciales demo',
            onPress: () => {
              setEmail('lucia@example.com');
              setPassword('password123');
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNavigation = () => {
    navigation.navigate('Register');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              
              <Text style={styles.title}>Iniciar Sesión</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              <Text style={styles.subtitle}>
                Ingresa a tu cuenta para continuar
              </Text>

              {/* Mensaje si viene del registro */}
              {route?.params?.prefilledEmail && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                  <Text style={styles.successText}>
                    ¡Cuenta creada! Ahora inicia sesión
                  </Text>
                </View>
              )}

              {/* Input Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color="#666" 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      console.log('📧 Email changed to:', text);
                    }}
                    placeholder="tu@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {email.length > 0 && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color="#4ECDC4" 
                    />
                  )}
                </View>
              </View>

              {/* Input Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color="#666" 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      console.log('🔑 Password changed, length:', text.length);
                    }}
                    placeholder="Tu contraseña"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {password.length > 0 && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color="#4ECDC4" 
                      style={styles.checkIcon}
                    />
                  )}
                </View>
              </View>

              {/* DEBUG INFO - Solo en desarrollo */}
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugText}>
                    📧 Email: "{email}" (length: {email.length})
                  </Text>
                  <Text style={styles.debugText}>
                    🔑 Password: {"*".repeat(password.length)} (length: {password.length})
                  </Text>
                </View>
              )}

              {/* Botón Login */}
              <TouchableOpacity
                style={[
                  styles.loginButton, 
                  loading && styles.loginButtonDisabled,
                  (email.trim().length > 0 && password.length > 0) && styles.loginButtonActive
                ]}
                onPress={handleLogin}
                disabled={loading || !email.trim() || !password}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loginButtonText}>Iniciando sesión...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Credenciales de prueba */}
              {__DEV__ && (
                <View style={styles.demoContainer}>
                  <Text style={styles.demoTitle}>Credenciales de prueba:</Text>
                  <Text style={styles.demoText}>Email: lucia@example.com</Text>
                  <Text style={styles.demoText}>Password: password123</Text>
                  <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => {
                      setEmail('lucia@example.com');
                      setPassword('password123');
                      console.log('🎮 Demo credentials loaded');
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.demoButtonText}>Usar credenciales demo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Link a registro */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity 
                  onPress={handleRegisterNavigation}
                  disabled={loading}
                >
                  <Text style={styles.registerLink}>Regístrate aquí</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FFF4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  successText: {
    fontSize: 14,
    color: '#4ECDC4',
    marginLeft: 8,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  checkIcon: {
    marginLeft: 8,
  },
  debugContainer: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#B0B0B0',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginButtonActive: {
    backgroundColor: '#4B7BEC',
    shadowColor: '#4B7BEC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  demoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B7BEC',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B7BEC',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  demoButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#4B7BEC',
    borderRadius: 6,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#4B7BEC',
    fontWeight: '600',
  },
});

export default LoginScreen;