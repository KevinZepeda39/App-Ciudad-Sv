// components/CommunitiesScreen.js - Versión mejorada y funcional
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { communityService } from '../services/communityService';

const CommunitiesScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Estados principales
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);

  // Estado para crear nueva comunidad
const [newCommunity, setNewCommunity] = useState({
  name: '',
  description: '',
  category: 'general',
  tags: '',
});

  // Estados para mejorar UX
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const tabs = [
    { key: 'all', label: 'Todas', icon: 'grid-outline' },
    { key: 'joined', label: 'Mis Comunidades', icon: 'people-outline' },
    { key: 'available', label: 'Disponibles', icon: 'star-outline' },
  ];

  const categories = [
  { value: 'general', label: 'General' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'otros', label: 'Otros' },
  { value: 'paz', label: 'Paz' },
];

  useEffect(() => {
    loadCommunities();
    testConnection();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [selectedTab, searchQuery, communities]);

  const testConnection = async () => {
    try {
      const result = await communityService.testConnection();
      setIsOnline(result.success);
    } catch (error) {
      setIsOnline(false);
    }
  };

  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      let result;
      
      if (selectedTab === 'joined') {
        result = await communityService.getUserCommunities();
      } else {
        result = await communityService.getAllCommunities();
      }

      if (result.success) {
        setCommunities(result.data);
        setLastUpdate(new Date());
        console.log('✅ Comunidades cargadas:', result.data.length);
      } else {
        console.error('Error cargando comunidades:', result.error);
        Alert.alert('Error', result.error || 'No se pudieron cargar las comunidades');
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      Alert.alert('Error', 'Error de conexión. Se muestran datos locales.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await testConnection();
    await loadCommunities();
    setRefreshing(false);
  };

  const filterCommunities = () => {
    let filtered = [...communities];

    // Filtrar por tab
    if (selectedTab === 'joined') {
      filtered = filtered.filter(community => community.isJoined);
    } else if (selectedTab === 'available') {
      filtered = filtered.filter(community => !community.isJoined);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(community =>
        community.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCommunities(filtered);
  };

  const formatMemberCount = (count) => {
    if (!count) return '0 miembros';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k miembros`;
    }
    return `${count} miembros`;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const toggleJoinCommunity = async (community) => {
    try {
      // Mostrar loading inmediatamente en la UI
      setCommunities(prev =>
        prev.map(c =>
          c.id === community.id
            ? { ...c, isLoading: true }
            : c
        )
      );

      let result;
      
      if (community.isJoined) {
        result = await communityService.leaveCommunity(community.id);
      } else {
        result = await communityService.joinCommunity(community.id);
      }

      if (result.success) {
        // Actualizar el estado local
        setCommunities(prev =>
          prev.map(c =>
            c.id === community.id
              ? { 
                  ...c, 
                  isJoined: !c.isJoined,
                  memberCount: c.isJoined ? Math.max(0, c.memberCount - 1) : c.memberCount + 1,
                  isLoading: false
                }
              : c
          )
        );
        
        Alert.alert('✅ Éxito', result.message);
      } else {
        // Revertir loading en caso de error
        setCommunities(prev =>
          prev.map(c =>
            c.id === community.id
              ? { ...c, isLoading: false }
              : c
          )
        );
        Alert.alert('❌ Error', result.error || 'No se pudo completar la acción');
      }
    } catch (error) {
      console.error('Error toggling community membership:', error);
      // Revertir loading
      setCommunities(prev =>
        prev.map(c =>
          c.id === community.id
            ? { ...c, isLoading: false }
            : c
        )
      );
      Alert.alert('❌ Error', 'Error de conexión');
    }
  };

// BUSCAR LA FUNCIÓN handleCreateCommunity Y REEMPLAZARLA POR:
const handleCreateCommunity = async () => {
  if (!newCommunity.name.trim()) {
    Alert.alert('❌ Error', 'Por favor ingresa un nombre para la comunidad');
    return;
  }

  if (!newCommunity.description.trim()) {
    Alert.alert('❌ Error', 'Por favor ingresa una descripción');
    return;
  }

  if (newCommunity.name.length > 50) {
    Alert.alert('❌ Error', 'El nombre no puede superar los 50 caracteres');
    return;
  }

  if (newCommunity.description.length > 200) {
    Alert.alert('❌ Error', 'La descripción no puede superar los 200 caracteres');
    return;
  }

  setIsCreatingCommunity(true);
  
  try {
    const result = await communityService.createCommunity({
      name: newCommunity.name.trim(),
      description: newCommunity.description.trim(),
      category: newCommunity.category,
      tags: newCommunity.tags.trim(),
    });
    
    if (result.success) {
      setCommunities(prev => [result.data, ...prev]);
      
      Alert.alert(
        '🎉 ¡Éxito!',
        '¡Comunidad creada exitosamente! Ya eres miembro y administrador.',
        [
          {
            text: 'Ver Chat',
            onPress: () => {
              setShowCreateModal(false);
              setNewCommunity({ name: '', description: '', category: 'general', tags: '' });
              navigation.navigate('CommunityDetail', { 
                communityId: result.data.id,
                communityName: result.data.name 
              });
            }
          },
          {
            text: 'OK',
            onPress: () => {
              setShowCreateModal(false);
              setNewCommunity({ name: '', description: '', category: 'general', tags: '' });
              loadCommunities();
            }
          }
        ]
      );
    } else {
      Alert.alert('❌ Error', result.error || 'No se pudo crear la comunidad');
    }
  } catch (error) {
    console.error('Error creating community:', error);
    Alert.alert('❌ Error', 'Error de conexión al crear la comunidad');
  } finally {
    setIsCreatingCommunity(false);
  }
};

  const renderCommunityItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.communityCard}
      onPress={() => {
        if (item.isJoined) {
          navigation.navigate('CommunityDetail', { 
            communityId: item.id,
            communityName: item.name 
          });
        } else {
          Alert.alert(
            item.name,
            `${item.description}\n\nCreada el: ${formatDate(item.fechaCreacion)}\n${formatMemberCount(item.memberCount)}`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Unirse', 
                onPress: () => toggleJoinCommunity(item)
              }
            ]
          );
        }
      }}
      activeOpacity={0.7}
      disabled={item.isLoading}
    >
      <View style={styles.communityInfo}>
        <View style={[
          styles.communityImageContainer,
          item.isLoading && styles.communityImageLoading
        ]}>
          {item.isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : item.imagen ? (
            <Image source={{ uri: item.imagen }} style={styles.communityImage} />
          ) : (
            <Text style={styles.communityEmoji}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>
        
        <View style={styles.communityDetails}>
          <View style={styles.communityHeader}>
            <Text style={styles.communityName} numberOfLines={1}>
              {item.name || 'Sin nombre'}
            </Text>
            {item.isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description || 'Sin descripción'}
          </Text>
          
          <View style={styles.communityMeta}>
            <Text style={styles.communityMembers}>
              {formatMemberCount(item.memberCount)}
            </Text>
            <Text style={styles.communityDate}>
              • {formatDate(item.fechaCreacion)}
            </Text>
          </View>
          
          {item.isJoined && (
            <Text style={styles.tapToEnterText}>
              Toca para entrar al chat
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.joinButton,
          item.isJoined && styles.joinedButton,
          item.isLoading && styles.joinButtonLoading
        ]}
        onPress={(e) => {
          e.stopPropagation();
          toggleJoinCommunity(item);
        }}
        disabled={item.isLoading}
      >
        {item.isLoading ? (
          <ActivityIndicator size="small" color={item.isJoined ? "#4B7BEC" : "#FFFFFF"} />
        ) : (
          <Text style={[
            styles.joinButtonText,
            item.isJoined && styles.joinedButtonText
          ]}>
            {item.isJoined ? 'Unido' : 'Unirse'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderTab = (tab) => (
    <TouchableOpacity
      key={tab.key}
      style={[
        styles.tabButton,
        selectedTab === tab.key && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab.key)}
    >
      <Ionicons
        name={tab.icon}
        size={20}
        color={selectedTab === tab.key ? '#4B7BEC' : '#666'}
      />
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab.key && styles.tabButtonTextActive
      ]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={selectedTab === 'joined' ? "people-outline" : "search-outline"} 
        size={80} 
        color="#CCC" 
      />
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'joined' 
          ? 'No te has unido a ninguna comunidad'
          : searchQuery
            ? 'No se encontraron comunidades'
            : 'No hay comunidades disponibles'
        }
      </Text>
      <Text style={styles.emptyStateMessage}>
        {selectedTab === 'joined'
          ? 'Explora y únete a comunidades que te interesen'
          : searchQuery
            ? 'Intenta con una búsqueda diferente'
            : 'Las nuevas comunidades aparecerán aquí'
        }
      </Text>
      {selectedTab !== 'joined' && !searchQuery && (
        <TouchableOpacity 
          style={styles.createFirstButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createFirstButtonText}>Crear mi primera comunidad</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderConnectionStatus = () => {
    if (isOnline) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="wifi-outline" size={16} color="#FF3B30" />
        <Text style={styles.offlineText}>Sin conexión - Modo offline</Text>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderConnectionStatus()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BEC" />
          <Text style={styles.loadingText}>Cargando comunidades...</Text>
          {!isOnline && (
            <Text style={styles.loadingSubtext}>Verificando conexión...</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderConnectionStatus()}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Comunidades</Text>
          {lastUpdate && (
            <Text style={styles.headerSubtitle}>
              Actualizado: {lastUpdate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.createHeaderButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar comunidades..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsContent}>
            {tabs.map(renderTab)}
          </View>
        </ScrollView>
      </View>

      {/* Communities List */}
      <FlatList
        data={filteredCommunities}
        renderItem={renderCommunityItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          filteredCommunities.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#4B7BEC']}
            tintColor="#4B7BEC"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      {/* Floating Create Button */}
      {selectedTab !== 'joined' && (
        <TouchableOpacity 
          style={styles.floatingCreateButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Crear Comunidad</Text>
            <View style={{ width: 40 }} />
          </View>

        <ScrollView style={styles.modalContent}>
  <View style={styles.formContainer}>
    
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Nombre de la comunidad *</Text>
      <TextInput
        style={styles.input}
        value={newCommunity.name}
        onChangeText={(text) => setNewCommunity(prev => ({ ...prev, name: text }))}
        placeholder="Ej: Vecinos de San Benito"
        maxLength={50}
      />
      <Text style={[
        styles.characterCount,
        newCommunity.name.length > 45 && styles.characterCountWarning
      ]}>
        {newCommunity.name.length}/50
      </Text>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Descripción *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={newCommunity.description}
        onChangeText={(text) => setNewCommunity(prev => ({ ...prev, description: text }))}
        placeholder="Describe de qué trata esta comunidad..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={200}
      />
      <Text style={[
        styles.characterCount,
        newCommunity.description.length > 180 && styles.characterCountWarning
      ]}>
        {newCommunity.description.length}/200
      </Text>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Categoría *</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryButton,
              newCommunity.category === cat.value && styles.categoryButtonActive
            ]}
            onPress={() => setNewCommunity(prev => ({ ...prev, category: cat.value }))}
          >
            <Text style={[
              styles.categoryButtonText,
              newCommunity.category === cat.value && styles.categoryButtonTextActive
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Tags (opcional)</Text>
      <TextInput
        style={styles.input}
        value={newCommunity.tags}
        onChangeText={(text) => setNewCommunity(prev => ({ ...prev, tags: text }))}
        placeholder="Ej: seguridad, barrio, vecinos"
        maxLength={100}
      />
      <Text style={styles.characterCount}>
        {newCommunity.tags.length}/100
      </Text>
    </View>

    <View style={styles.infoContainer}>
      <Ionicons name="information-circle-outline" size={20} color="#4B7BEC" />
      <Text style={styles.infoText}>
        Al crear una comunidad, automáticamente te conviertes en miembro y administrador. 
        Otros usuarios podrán unirse libremente y participar en el chat.
      </Text>
    </View>
  </View>
</ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[
                styles.createButton, 
                isCreatingCommunity && styles.disabledButton,
                (!newCommunity.name.trim() || !newCommunity.description.trim()) && styles.disabledButton
              ]}
              onPress={handleCreateCommunity}
              disabled={isCreatingCommunity || !newCommunity.name.trim() || !newCommunity.description.trim()}
            >
              {isCreatingCommunity ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Creando...</Text>
                </View>
              ) : (
                <Text style={styles.createButtonText}>Crear Comunidad</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // AL FINAL DEL StyleSheet.create({...}), ANTES DE });
categoryContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 8,
},
categoryButton: {
  backgroundColor: '#F5F5F5',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  marginRight: 8,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#E0E0E0',
},
categoryButtonActive: {
  backgroundColor: '#4B7BEC',
  borderColor: '#4B7BEC',
},
categoryButtonText: {
  fontSize: 14,
  color: '#666',
  fontWeight: '500',
},
categoryButtonTextActive: {
  color: '#FFFFFF',
  fontWeight: '600',
},
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  offlineIndicator: {
    backgroundColor: '#FFF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  createHeaderButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B7BEC',
    borderRadius: 20,
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  tabButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4B7BEC',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#4B7BEC',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyListContainer: {
    flex: 1,
  },
  communityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4B7BEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  communityImageLoading: {
    backgroundColor: '#A0A0A0',
  },
  communityImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  communityEmoji: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  communityDetails: {
    flex: 1,
  },
  communityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  adminText: {
    fontSize: 10,
    color: '#FF8F00',
    fontWeight: '600',
    marginLeft: 2,
  },
  communityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  communityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityMembers: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  communityDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  tapToEnterText: {
    fontSize: 12,
    color: '#4B7BEC',
    fontStyle: 'italic',
    marginTop: 4,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#4B7BEC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  joinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4B7BEC',
  },
  joinButtonLoading: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinedButtonText: {
    color: '#4B7BEC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#4B7BEC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingCreateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B7BEC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  characterCountWarning: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4B7BEC',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  createButton: {
    backgroundColor: '#4B7BEC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CommunitiesScreen;