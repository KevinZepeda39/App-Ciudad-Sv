// components/WelcomeScreen.js - Versión corregida sin dependencia de colors
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.imageContainer}>
        {/* Comentamos las imágenes por ahora, ya que aún no las tienes
        <Image
          source={require('../assets/images/welcome-illustration.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/plant.png')}
          style={styles.plantImage}
          resizeMode="contain"
        />
        */}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Bienvenido a Mi Ciudad SV</Text>
        <Text style={styles.subtitle}>
          Explora e infórmate de todo lo que está en nuestra área y sube tus preocupaciones
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Inicio de Sesión</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Reemplazando colors.white
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  plantImage: {
    position: 'absolute',
    bottom: 0,
    right: 30,
    width: 50,
    height: 80,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666666', // Reemplazando colors.text.tertiary
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#4B7BEC', // Reemplazando colors.primary
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000', // Reemplazando colors.black
  },
  registerButton: {
    backgroundColor: '#000000', // Reemplazando colors.black
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF', // Reemplazando colors.white
  },
});

export default WelcomeScreen;