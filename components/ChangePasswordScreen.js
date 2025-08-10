// components/ChangePasswordScreen.js - Con actualización automática del contexto
import React, { useState, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';

const ChangePasswordScreen = ({ navigation }) => {
  const { user, checkAuthStatus, updateUserContext } = useAuth(); // Agregar updateUserContext
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Estados para información personal
  const [personalData, setPersonalData] = useState({
    nombre: '',
    correo: '',
  });
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Estados para mostrar/ocultar contraseñas
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Inicializar datos del usuario
  useEffect(() => {
    if (user) {
      setPersonalData({
        nombre: user.nombre || user.name || '',
        correo: user.correo || user.email || '',
      });
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkAuthStatus();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePersonalDataChange = (field, value) => {
    setPersonalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordDataChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePersonalData = () => {
    if (!personalData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return false;
    }

    if (personalData.nombre.length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!personalData.correo.trim()) {
      Alert.alert('Error', 'El correo es requerido');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalData.correo)) {
      Alert.alert('Error', 'El formato del correo es inválido');
      return false;
    }

    return true;
  };

  const validatePasswordData = () => {
    if (!passwordData.currentPassword) {
      Alert.alert('Error', 'Ingresa tu contraseña actual');
      return false;
    }

    if (!passwordData.newPassword) {
      Alert.alert('Error', 'Ingresa una nueva contraseña');
      return false;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error', 'La nueva contraseña debe ser diferente a la actual');
      return false;
    }

    return true;
  };

  const updatePersonalInfo = async () => {
    if (!validatePersonalData()) return;

    // Verificar si hay cambios
    const hasChanges = 
      personalData.nombre !== (user.nombre || user.name) ||
      personalData.correo !== (user.correo || user.email);

    if (!hasChanges) {
      Alert.alert('Información', 'No hay cambios para guardar');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Updating personal info:', personalData);

      const response = await fetch(`${authService.baseUrl}/api/users/${user.id || user.idUsuario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: personalData.nombre.trim(),
          correo: personalData.correo.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ ACTUALIZAR EL CONTEXTO DE AUTENTICACIÓN INMEDIATAMENTE
        const updatedUser = {
          ...user,
          nombre: personalData.nombre.trim(),
          name: personalData.nombre.trim(), // Alias para compatibilidad
          correo: personalData.correo.trim(),
          email: personalData.correo.trim(), // Alias para compatibilidad
        };

        // Actualizar la sesión en AsyncStorage
        await authService.saveUserSession(updatedUser, user.token || 'current-token');
        
        // Actualizar el contexto si existe la función
        if (updateUserContext) {
          updateUserContext(updatedUser);
        }

        // También forzar actualización del contexto
        await checkAuthStatus();

        console.log('✅ User context updated:', updatedUser);

        Alert.alert(
          '✅ Información Actualizada',
          `Hola ${updatedUser.nombre}! Tu información ha sido actualizada exitosamente y ya es visible en toda la aplicación.`,
          [
            {
              text: 'Perfecto',
              onPress: () => {
                // Opcional: navegar de vuelta al perfil para ver los cambios
                console.log('🔄 Information updated successfully, context refreshed');
              }
            }
          ]
        );
      } else {
        throw new Error(data.error || 'Error actualizando información');
      }

    } catch (error) {
      console.error('❌ Error updating personal info:', error);
      
      let errorMessage = 'No se pudo actualizar la información';
      if (error.message.includes('ya está registrado') || error.message.includes('already exists')) {
        errorMessage = 'Este correo ya está siendo usado por otra cuenta';
      } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
        errorMessage = 'Problema de conexión. Verifica tu internet.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!validatePasswordData()) return;

    setIsLoading(true);
    try {
      console.log('🔄 Updating password for user:', user.id || user.idUsuario);

      const response = await fetch(`${authService.baseUrl}/api/users/${user.id || user.idUsuario}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          '✅ Contraseña Actualizada',
          'Tu contraseña ha sido cambiada exitosamente. Tu nueva contraseña ya está activa.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                // Limpiar campos de contraseña
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                setActiveTab('personal');
              }
            }
          ]
        );
      } else {
        throw new Error(data.error || 'Error cambiando contraseña');
      }

    } catch (error) {
      console.error('❌ Error updating password:', error);
      
      let errorMessage = 'No se pudo cambiar la contraseña';
      if (error.message.includes('incorrecta') || error.message.includes('invalid')) {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.message.includes('conexión') || error.message.includes('timeout')) {
        errorMessage = 'Problema de conexión. Verifica tu internet.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabButton = (tab, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? '#4B7BEC' : '#666'} 
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderPersonalInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <View style={styles.globe}>
            <View style={styles.globeInner}>
              <Text style={styles.globeText}>🌍</Text>
            </View>
          </View>
          <View style={styles.logoRing} />
        </View>
        <Text style={styles.appName}>MiCiudadSv</Text>
      </View>

      <Text style={styles.sectionTitle}>Información Personal</Text>
      <Text style={styles.sectionSubtitle}>
        Los cambios se aplicarán automáticamente en toda la aplicación
      </Text>

      {/* Nombre */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Nombre Completo</Text>
        <View style={styles.passwordContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            value={personalData.nombre}
            onChangeText={(value) => handlePersonalDataChange('nombre', value)}
            placeholder="Tu nombre completo"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Correo */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Correo Electrónico</Text>
        <View style={styles.passwordContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.passwordInput}
            value={personalData.correo}
            onChangeText={(value) => handlePersonalDataChange('correo', value)}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Información del usuario actual */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>📋 Información Actual:</Text>
        <Text style={styles.currentInfoText}>
          👤 Nombre: {user?.nombre || user?.name || 'No disponible'}
        </Text>
        <Text style={styles.currentInfoText}>
          📧 Email: {user?.correo || user?.email || 'No disponible'}
        </Text>
        <Text style={styles.currentInfoText}>
          🆔 ID: {user?.id || user?.idUsuario || 'No disponible'}
        </Text>
        
        {/* Mostrar vista previa de cambios */}
        {(personalData.nombre !== (user?.nombre || user?.name) || 
          personalData.correo !== (user?.correo || user?.email)) && (
          <View style={styles.previewChanges}>
            <Text style={styles.previewTitle}>🔄 Vista previa de cambios:</Text>
            <Text style={styles.previewText}>
              👤 Nuevo nombre: {personalData.nombre}
            </Text>
            <Text style={styles.previewText}>
              📧 Nuevo email: {personalData.correo}
            </Text>
          </View>
        )}
      </View>

      {/* Botón Actualizar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.disabledButton]}
          onPress={updatePersonalInfo}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Actualizando perfil...</Text>
            </View>
          ) : (
            <Text style={styles.updateButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPasswordTab = () => (
    <View style={styles.tabContent}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <View style={styles.globe}>
            <View style={styles.globeInner}>
              <Text style={styles.globeText}>🌍</Text>
            </View>
          </View>
          <View style={styles.logoRing} />
        </View>
        <Text style={styles.appName}>MiCiudadSv</Text>
      </View>

      <Text style={styles.sectionTitle}>¿Quieres Cambiar tu Contraseña?</Text>
      <Text style={styles.sectionSubtitle}>
        No te preocupes puedes actualizar tu contraseña de forma segura
      </Text>

      {/* Contraseña Actual */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contraseña Anterior</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={passwordData.currentPassword}
            onChangeText={(value) => handlePasswordDataChange('currentPassword', value)}
            placeholder="Ingresa tu contraseña actual"
            secureTextEntry={!showPasswords.current}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => togglePasswordVisibility('current')}
          >
            <Ionicons
              name={showPasswords.current ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nueva Contraseña */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Contraseña Nueva</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={passwordData.newPassword}
            onChangeText={(value) => handlePasswordDataChange('newPassword', value)}
            placeholder="Ingresa tu nueva contraseña"
            secureTextEntry={!showPasswords.new}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => togglePasswordVisibility('new')}
          >
            <Ionicons
              name={showPasswords.new ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmar Nueva Contraseña */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirmar Contraseña Nueva</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={passwordData.confirmPassword}
            onChangeText={(value) => handlePasswordDataChange('confirmPassword', value)}
            placeholder="Confirma tu nueva contraseña"
            secureTextEntry={!showPasswords.confirm}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => togglePasswordVisibility('confirm')}
          >
            <Ionicons
              name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Requisitos de Contraseña */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
        
        <View style={styles.requirement}>
          <Ionicons
            name={passwordData.newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={passwordData.newPassword.length >= 6 ? "#4CAF50" : "#999"}
          />
          <Text style={[
            styles.requirementText,
            passwordData.newPassword.length >= 6 && styles.requirementMet
          ]}>
            Al menos 6 caracteres
          </Text>
        </View>

        <View style={styles.requirement}>
          <Ionicons
            name={passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? "#4CAF50" : "#999"}
          />
          <Text style={[
            styles.requirementText,
            passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword && styles.requirementMet
          ]}>
            Diferente a la contraseña actual
          </Text>
        </View>

        <View style={styles.requirement}>
          <Ionicons
            name={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? "#4CAF50" : "#999"}
          />
          <Text style={[
            styles.requirementText,
            passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && styles.requirementMet
          ]}>
            Las contraseñas coinciden
          </Text>
        </View>
      </View>

      {/* Botón Cambiar Contraseña */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.disabledButton]}
          onPress={updatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Actualizando...</Text>
            </View>
          ) : (
            <Text style={styles.updateButtonText}>Actualizar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Perfil</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#999" : "#4B7BEC"} 
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton('personal', 'Información', 'person-outline')}
        {renderTabButton('password', 'Contraseña', 'lock-closed-outline')}
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'personal' ? renderPersonalInfoTab() : renderPasswordTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTabButton: {
    backgroundColor: '#F0F4FF',
    borderColor: '#4B7BEC',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: '#4B7BEC',
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoBackground: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globe: {
    width: 100,
    height: 100,
    backgroundColor: '#FFCC00',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  globeInner: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  globeText: {
    fontSize: 30,
  },
  logoRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#333',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    zIndex: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    height: 50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementsContainer: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#4CAF50',
  },
  currentInfoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  previewChanges: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B7BEC',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 12,
    color: '#4B7BEC',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
  },
  updateButton: {
    backgroundColor: '#333',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default ChangePasswordScreen;