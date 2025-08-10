// components/reports/CreateReportScreen.js - DISEÑO ANTERIOR CON FUNCIONALIDAD CORREGIDA
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import reportService from '../../services/reportService';

const { width, height } = Dimensions.get('window');

// Color definitions - diseño anterior
const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#64748b',
  accent: '#f59e0b',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  white: '#ffffff',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
};

// Categories for reports
const categories = [
  { id: 'infrastructure', label: 'Infrastructure', icon: 'construct', color: colors.primary },
  { id: 'security', label: 'Security', icon: 'shield', color: colors.danger },
  { id: 'cleaning', label: 'Cleaning', icon: 'leaf', color: colors.success },
  { id: 'lighting', label: 'Lighting', icon: 'bulb', color: colors.warning },
  { id: 'transportation', label: 'Transportation', icon: 'car', color: colors.info },
  { id: 'general', label: 'General', icon: 'chatbubble', color: colors.secondary },
];

export default function CreateReportScreen({ navigation }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'general'
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referencias para los inputs
  const titleRef = React.useRef(null);
  const descriptionRef = React.useRef(null);
  const locationRef = React.useRef(null);

  // Validation function
  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const reportData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ubicacion: formData.location.trim(),
        categoria: formData.category,
        hasImage: !!selectedImage,
        imageUri: selectedImage?.uri
      };

      console.log('\n📊 Form data before sending:');
      console.log('  title:', reportData.title);
      console.log('  description:', reportData.description);  
      console.log('  ubicacion:', reportData.ubicacion);
      console.log('  categoria:', reportData.categoria);
      console.log('  hasImage:', reportData.hasImage);

      const result = await reportService.createReport(reportData);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Report created successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({ title: '', description: '', location: '', category: 'general' });
                setSelectedImage(null);
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('Reports');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'Failed to create report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image selection
  const handleSelectImage = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() }
      ]
    );
  };

  const openCamera = async () => {
    try {
      console.log('📸 Opening camera...');
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📋 Camera permission status:', permissionResult.status);
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required', 
          'Camera permission is required to take photos. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      console.log('✅ Camera permission granted, launching camera...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📷 Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('✅ Photo taken:', result.assets[0].uri);
        setSelectedImage(result.assets[0]);
        Alert.alert('Success', 'Photo captured successfully!');
      } else {
        console.log('❌ Camera canceled or failed');
      }
    } catch (error) {
      console.error('❌ Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      console.log('🖼️ Opening gallery...');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📋 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Gallery permission is required to select images. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      console.log('✅ Permission granted, launching gallery...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      console.log('📷 Gallery result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('✅ Image selected:', result.assets[0].uri);
        setSelectedImage(result.assets[0]);
        Alert.alert('Success', 'Image selected successfully!');
      } else {
        console.log('❌ Gallery selection canceled or failed');
      }
    } catch (error) {
      console.error('❌ Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    Alert.alert('Removed', 'Image removed successfully');
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - diseño anterior */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Report</Text>
        
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              <Ionicons name="document-text" size={16} color={colors.primary} />
              {' '}Title *
            </Text>
            <TextInput
              ref={titleRef}
              style={styles.textInput}
              placeholder="Brief title for your report..."
              placeholderTextColor={colors.gray400}
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              maxLength={100}
              returnKeyType="done"
              blurOnSubmit={true}
              autoFocus={false}
              autoCorrect={false}
              autoCapitalize="sentences"
              enablesReturnKeyAutomatically={false}
              keyboardType="default"
              editable={true}
              selectTextOnFocus={true}
              underlineColorAndroid="transparent"
            />
            <Text style={styles.charCount}>{formData.title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              <Ionicons name="list" size={16} color={colors.primary} />
              {' '}Description *
            </Text>
            <TextInput
              ref={descriptionRef}
              style={[styles.textInput, styles.textArea]}
              placeholder="Detailed description of the issue..."
              placeholderTextColor={colors.gray400}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
              returnKeyType="default"
              blurOnSubmit={true}
              autoFocus={false}
              autoCorrect={true}
              autoCapitalize="sentences"
              enablesReturnKeyAutomatically={false}
              scrollEnabled={true}
              editable={true}
              selectTextOnFocus={true}
              underlineColorAndroid="transparent"
            />
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
          </View>

          {/* Location Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location" size={16} color={colors.primary} />
              {' '}Location *
            </Text>
            <TextInput
              ref={locationRef}
              style={styles.textInput}
              placeholder="Street, neighborhood, or landmark..."
              placeholderTextColor={colors.gray400}
              value={formData.location}
              onChangeText={(text) => updateFormData('location', text)}
              maxLength={200}
              returnKeyType="done"
              blurOnSubmit={true}
              autoFocus={false}
              autoCorrect={false}
              autoCapitalize="words"
              enablesReturnKeyAutomatically={false}
              keyboardType="default"
              editable={true}
              selectTextOnFocus={true}
              underlineColorAndroid="transparent"
            />
            <Text style={styles.charCount}>{formData.location.length}/200</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              <Ionicons name="apps" size={16} color={colors.primary} />
              {' '}Category *
            </Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.id && styles.categoryItemSelected
                  ]}
                  onPress={() => updateFormData('category', category.id)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons 
                      name={category.icon} 
                      size={20} 
                      color={colors.white} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryText,
                    formData.category === category.id && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Image Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              {' '}Photo (Optional)
            </Text>
            
            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={28} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImage}
              >
                <Ionicons name="camera-outline" size={40} color={colors.gray400} />
                <Text style={styles.addImageText}>Add Photo</Text>
                <Text style={styles.addImageSubtext}>Tap to select from gallery or camera</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitContent}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.submitText}>Creating Report...</Text>
              </View>
            ) : (
              <View style={styles.submitContent}>
                <Ionicons name="send" size={20} color={colors.white} />
                <Text style={styles.submitText}>Create Report</Text>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  
  // Header - diseño anterior
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginRight: 40, // Compensar el botón de back
  },
  headerPlaceholder: {
    width: 40,
  },

  // Keyboard and scroll
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Input sections - diseño anterior
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.gray800,
    minHeight: 50,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  charCount: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'right',
    marginTop: 5,
  },

  // Categories - diseño anterior
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  categoryItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Image selection - diseño anterior
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: colors.gray200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 14,
  },
  addImageButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray600,
    marginTop: 10,
  },
  addImageSubtext: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 5,
    textAlign: 'center',
  },

  // Submit button - diseño anterior
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});