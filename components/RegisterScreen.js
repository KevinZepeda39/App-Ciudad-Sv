// components/RegisterScreen.js - VERSIÓN COMPLETA CORREGIDA
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es requerido';
        if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.trim().length > 50) return 'El nombre no puede superar los 50 caracteres';
        return null;

      case 'email':
        if (!value.trim()) return 'El email es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Formato de email inválido';
        return null;

      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        if (value.length > 50) return 'La contraseña no puede superar los 50 caracteres';
        return null;

      case 'confirmPassword':
        if (!value) return 'Confirma tu contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        return null;

      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validar todos los campos
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '#E0E0E0' };
    if (password.length < 6) return { strength: 25, text: 'Muy débil', color: '#FF6B6B' };
    if (password.length < 8) return { strength: 50, text: 'Débil', color: '#FFB347' };
    
    let score = 50;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    
    if (score < 70) return { strength: 60, text: 'Regular', color: '#FFA726' };
    if (score < 90) return { strength: 80, text: 'Buena', color: '#66BB6A' };
    return { strength: 100, text: 'Excelente', color: '#4ECDC4' };
  };

  // FUNCIÓN HANDLEREGISTER CORREGIDA
  const handleRegister = async () => {
    if (loading) return;

    // Validar formulario
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Register attempt for:', formData.email.trim());

      // Llamar al servicio de registro
      const result = await authService.register(
        formData.nombre.trim(),
        formData.email.trim(),
        formData.password
      );

      console.log('✅ Registration successful:', result);

      // CORRECCIÓN: Pasar las credenciales correctamente al login
      Alert.alert(
        '🎉 Registro Exitoso',
        `¡Bienvenido ${result.user.nombre}!\n\nTu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.`,
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => {
              console.log('📧 Navigating to login with email:', formData.email.trim());
              console.log('🔑 Navigating to login with password length:', formData.password.length);
              
              // NAVEGACIÓN CORREGIDA - Pasar ambas credenciales
              navigation.navigate('Login', {
                prefilledEmail: formData.email.trim(),
                prefilledPassword: formData.password, // ✅ ESTO ES CRÍTICO
                message: '¡Cuenta creada exitosamente!'
              });
            }
          }
        ],
        { cancelable: false }
      );

    } catch (error) {
      console.log('❌ Registration failed:', error.message);

      // Mostrar error específico al usuario
      let errorTitle = 'Error de Registro';
      let errorMessage = 'Error al registrar usuario';

      if (error.message.includes('ya está registrado') || error.message.includes('already exists')) {
        errorTitle = 'Email ya registrado';
        errorMessage = 'Este email ya está registrado. Intenta con otro email o inicia sesión.';
      } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
        errorTitle = 'Problema de conexión';
        errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('servidor')) {
        errorTitle = 'Error del servidor';
        errorMessage = 'Error del servidor. Intenta más tarde.';
      } else if (error.message.includes('formato') || error.message.includes('inválido')) {
        errorTitle = 'Datos inválidos';
        errorMessage = 'Verifica que la información ingresada sea correcta.';
      } else {
        errorMessage = error.message || 'Error inesperado en el registro';
      }

      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'OK' },
          ...(error.message.includes('ya está registrado') ? [{
            text: 'Ir a Login',
            onPress: () => navigation.navigate('Login', { 
              prefilledEmail: formData.email.trim(),
              prefilledPassword: formData.password // ✅ AGREGAR ESTO TAMBIÉN
            })
          }] : [])
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login');
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              
              <Text style={styles.title}>Crear Cuenta</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              <Text style={styles.subtitle}>
                Únete a Mi Ciudad SV y reporta problemas en tu comunidad
              </Text>

              {/* Input Nombre */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.nombre && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={errors.nombre ? "#FF6B6B" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(value) => updateFormData('nombre', value)}
                    placeholder="Ej: Juan Pérez"
                    placeholderTextColor="#999"
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!loading}
                    maxLength={50}
                  />
                  {formData.nombre.length > 0 && (
                    <View style={styles.characterCount}>
                      <Text style={styles.characterCountText}>
                        {formData.nombre.length}/50
                      </Text>
                    </View>
                  )}
                </View>
                {errors.nombre && (
                  <Text style={styles.errorText}>{errors.nombre}</Text>
                )}
              </View>

              {/* Input Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.email && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={errors.email ? "#FF6B6B" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    placeholder="tu@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  {formData.email.length > 0 && (
                    <Ionicons 
                      name={errors.email ? "close-circle" : "checkmark-circle"} 
                      size={20} 
                      color={errors.email ? "#FF6B6B" : "#4ECDC4"} 
                    />
                  )}
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Input Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.password && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={errors.password ? "#FF6B6B" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    maxLength={50}
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
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Indicador de fortaleza de contraseña */}
              {formData.password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthHeader}>
                    <Text style={styles.passwordStrengthLabel}>Seguridad:</Text>
                    <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.text}
                    </Text>
                  </View>
                  <View style={styles.passwordStrengthBar}>
                    <View 
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.passwordTips}>
                    <Text style={styles.passwordTipText}>
                      • Usa al menos 8 caracteres para mayor seguridad
                    </Text>
                    <Text style={styles.passwordTipText}>
                      • Combina letras, números y símbolos
                    </Text>
                  </View>
                </View>
              )}

              {/* Input Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar contraseña *</Text>
                <View style={[
                  styles.inputWrapper,
                  errors.confirmPassword && styles.inputWrapperError
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={errors.confirmPassword ? "#FF6B6B" : "#666"} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    placeholder="Repite tu contraseña"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    maxLength={50}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {formData.confirmPassword.length > 0 && (
                    <Ionicons 
                      name={errors.confirmPassword ? "close-circle" : "checkmark-circle"} 
                      size={20} 
                      color={errors.confirmPassword ? "#FF6B6B" : "#4ECDC4"} 
                      style={styles.matchIcon}
                    />
                  )}
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* DEBUG INFO - Solo en desarrollo */}
              {__DEV__ && (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>🔧 Debug Info:</Text>
                  <Text style={styles.debugText}>
                    📧 Email: "{formData.email}" (length: {formData.email.length})
                  </Text>
                  <Text style={styles.debugText}>
                    🔑 Password: {"*".repeat(formData.password.length)} (length: {formData.password.length})
                  </Text>
                  <Text style={styles.debugText}>
                    🔒 Confirm: {"*".repeat(formData.confirmPassword.length)} (length: {formData.confirmPassword.length})
                  </Text>
                  <Text style={styles.debugText}>
                    ✅ Match: {formData.password === formData.confirmPassword ? 'YES' : 'NO'}
                  </Text>
                </View>
              )}

              {/* Botón Register */}
              <TouchableOpacity
                style={[
                  styles.registerButton, 
                  loading && styles.registerButtonDisabled,
                  Object.keys(errors).length === 0 && 
                  formData.nombre && formData.email && formData.password && formData.confirmPassword
                    ? styles.registerButtonActive : {}
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.registerButtonText}>Creando cuenta...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Términos y condiciones */}
              <View style={styles.termsContainer}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#4B7BEC" />
                <Text style={styles.termsText}>
                  Al crear una cuenta, aceptas nuestros{' '}
                  <Text style={styles.termsLink}>Términos de Servicio</Text>
                  {' '}y{' '}
                  <Text style={styles.termsLink}>Política de Privacidad</Text>
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Link a login */}
              <TouchableOpacity 
                style={styles.loginContainer}
                onPress={handleLoginNavigation}
                disabled={loading}
              >
                <Ionicons name="log-in-outline" size={20} color="#4B7BEC" />
                <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                <Text style={styles.loginLink}>Inicia sesión</Text>
              </TouchableOpacity>

              {/* Demo info */}
              {__DEV__ && (
                <View style={styles.demoContainer}>
                  <Ionicons name="information-circle-outline" size={16} color="#4B7BEC" />
                  <Text style={styles.demoText}>
                    Modo desarrollo: También puedes usar lucia@example.com / password123
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
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
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
  inputWrapperError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
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
  matchIcon: {
    marginLeft: 8,
  },
  characterCount: {
    marginLeft: 8,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordStrengthContainer: {
    marginTop: -12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordTips: {
    marginTop: 4,
  },
  passwordTipText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  debugContainer: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#666',
    lineHeight: 16,
  },
  registerButton: {
    backgroundColor: '#B0B0B0',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerButtonActive: {
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
  registerButtonDisabled: {
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
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  termsLink: {
    color: '#4B7BEC',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#4B7BEC',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loginLink: {
    fontSize: 14,
    color: '#4B7BEC',
    fontWeight: '600',
  },
  demoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B7BEC',
  },
  demoText: {
    fontSize: 12,
    color: '#4B7BEC',
    marginLeft: 8,
    flex: 1,
  },
});

export default RegisterScreen;