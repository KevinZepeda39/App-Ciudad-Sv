// components/CommunityDetailScreen.js - Chat funcional de comunidad
import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { communityService } from '../services/communityService';

const CommunityDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { communityId, communityName } = route.params;
  
  // Estados principales
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [communityDetails, setCommunityDetails] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs
  const flatListRef = useRef(null);
  const textInputRef = useRef(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadCommunityDetails();
    loadMessages();
  }, []);

  useEffect(() => {
    // Configurar el título de navegación
    navigation.setOptions({
      title: communityName || 'Chat',
    });
  }, [navigation, communityName]);

  const loadCommunityDetails = async () => {
    try {
      const result = await communityService.getCommunityDetails(communityId);
      if (result.success) {
        setCommunityDetails(result.data);
      }
    } catch (error) {
      console.error('Error loading community details:', error);
    }
  };

  const loadMessages = async (page = 1, refresh = false) => {
    try {
      if (page === 1 && !refresh) {
        setIsLoading(true);
      }
      
      const result = await communityService.getCommunityMessages(communityId, page, 30);
      
      if (result.success) {
        const newMessages = result.data;
        
        if (page === 1) {
          setMessages(newMessages);
        } else {
          // Agregar mensajes más antiguos al inicio
          setMessages(prevMessages => [...newMessages, ...prevMessages]);
        }
        
        setHasMoreMessages(result.pagination?.hasMore || false);
        setIsOnline(true);
      } else {
        console.error('Error loading messages:', result.error);
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadMessages(nextPage);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadMessages(1, true);
    setRefreshing(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Por favor escribe un mensaje');
      return;
    }

    if (newMessage.length > 500) {
      Alert.alert('Error', 'El mensaje es demasiado largo (máximo 500 caracteres)');
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Crear mensaje temporal para mostrar inmediatamente
    const tempMessage = {
      id: Date.now(),
      text: messageText,
      userName: user?.name || 'Tú',
      timestamp: new Date().toISOString(),
      isOwn: true,
      userId: user?.id || 1,
      imagenes: [],
      isTemporary: true
    };

    // Agregar mensaje temporal al final de la lista
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Hacer scroll al final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await communityService.sendMessage(communityId, messageText);
      
      if (result.success) {
        // Reemplazar mensaje temporal con el real
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessage.id 
              ? { ...result.data, isOwn: true }
              : msg
          )
        );
        setIsOnline(true);
      } else {
        // Marcar mensaje como fallido
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, isFailed: true }
              : msg
          )
        );
        Alert.alert('Error', result.error || 'No se pudo enviar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Marcar como offline
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, isOffline: true }
            : msg
        )
      );
      setIsOnline(false);
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // Si es hoy
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // Si es esta semana
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('es-ES', { 
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Si es más antiguo
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Ahora';
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.isOwn || item.userId === (user?.id || 1);
    
    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
          item.isFailed && styles.failedMessageBubble,
          item.isOffline && styles.offlineMessageBubble
        ]}>
          {!isOwn && (
            <Text style={styles.userName}>{item.userName || 'Usuario'}</Text>
          )}
          
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isOwn ? styles.ownTimestamp : styles.otherTimestamp
            ]}>
              {formatTimestamp(item.timestamp)}
            </Text>
            
            {isOwn && (
              <View style={styles.messageStatus}>
                {item.isTemporary && (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
                {item.isFailed && (
                  <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                )}
                {item.isOffline && (
                  <Ionicons name="time-outline" size={14} color="#FFA500" />
                )}
                {!item.isTemporary && !item.isFailed && !item.isOffline && (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderLoadMoreButton = () => {
    if (!hasMoreMessages) return null;
    
    return (
      <TouchableOpacity 
        style={styles.loadMoreButton}
        onPress={loadMoreMessages}
        disabled={isLoadingMore}
      >
        {isLoadingMore ? (
          <ActivityIndicator size="small" color="#4B7BEC" />
        ) : (
          <Text style={styles.loadMoreText}>Cargar mensajes anteriores</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#CCC" />
      <Text style={styles.emptyStateTitle}>¡Inicia la conversación!</Text>
      <Text style={styles.emptyStateMessage}>
        Sé el primero en enviar un mensaje a esta comunidad
      </Text>
    </View>
  );

  const renderConnectionStatus = () => {
    if (isOnline) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Ionicons name="wifi-outline" size={16} color="#FF3B30" />
        <Text style={styles.offlineText}>Sin conexión</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BEC" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4B7BEC" />
      {renderConnectionStatus()}
      
      {/* Community Info Header */}
      {communityDetails && (
        <View style={styles.communityInfoHeader}>
          <View style={styles.communityInfo}>
            <Text style={styles.communityMemberCount}>
              {communityDetails.memberCount} miembros
            </Text>
            {communityDetails.isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyMessagesList
          ]}
          ListHeaderComponent={renderLoadMoreButton}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4B7BEC']}
              tintColor="#4B7BEC"
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || isSending) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
          {newMessage.length > 450 && (
            <Text style={styles.characterWarning}>
              {newMessage.length}/500 caracteres
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  offlineIndicator: {
    backgroundColor: '#FFF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  communityInfoHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityMemberCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  adminText: {
    fontSize: 12,
    color: '#FF8F00',
    fontWeight: '600',
    marginLeft: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyMessagesList: {
    flex: 1,
  },
  loadMoreButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 32,
  },
  loadMoreText: {
    color: '#4B7BEC',
    fontSize: 14,
    fontWeight: '500',
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
  },
  messageContainer: {
    marginVertical: 2,
    paddingHorizontal: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownMessageBubble: {
    backgroundColor: '#4B7BEC',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  failedMessageBubble: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF6B6B',
  },
  offlineMessageBubble: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFA500',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownTimestamp: {
    color: '#E3F2FD',
  },
  otherTimestamp: {
    color: '#999',
  },
  messageStatus: {
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 120,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#4B7BEC',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#4B7BEC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
    elevation: 0,
  },
  characterWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default CommunityDetailScreen;