import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import CurvedHeader from '../../components/CurvedHeader';

const ChatSupportScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! Welcome to Customer Support. How can I help you today?',
      sender: 'support',
      timestamp: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      text: 'I need help with my ride booking',
      sender: 'user',
      timestamp: new Date(Date.now() - 240000),
    },
    {
      id: '3',
      text: 'I\'d be happy to help! Could you please provide your booking ID or tell me more about the issue?',
      sender: 'support',
      timestamp: new Date(Date.now() - 180000),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const supportResponses = {
    booking: "I'll help you with your booking. Please share your booking ID and I'll look into it right away.",
    payment: "For payment-related issues, please check your transaction history. If the amount is debited, it will be refunded within 3-5 business days.",
    driver: "I understand your concern about the driver. Please share the ride details and I'll escalate this to our team.",
    cancellation: "I'll help you cancel the ride. Please note that cancellation charges may apply based on the timing.",
    refund: "Refunds typically take 3-5 business days to reflect in your account. Let me check the status for you.",
    default: "Thank you for reaching out. I'll assist you with your query. Could you please provide more details?",
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getAutoResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('booking') || lowerMsg.includes('ride')) {
      return supportResponses.booking;
    } else if (lowerMsg.includes('payment') || lowerMsg.includes('money') || lowerMsg.includes('paid')) {
      return supportResponses.payment;
    } else if (lowerMsg.includes('driver') || lowerMsg.includes('rude') || lowerMsg.includes('behavior')) {
      return supportResponses.driver;
    } else if (lowerMsg.includes('cancel') || lowerMsg.includes('cancellation')) {
      return supportResponses.cancellation;
    } else if (lowerMsg.includes('refund') || lowerMsg.includes('return')) {
      return supportResponses.refund;
    } else {
      return supportResponses.default;
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    // Show typing indicator
    setIsTyping(true);

    // Simulate support response after delay
    setTimeout(() => {
      const autoResponse = getAutoResponse(userMessage.text);
      const supportMessage = {
        id: (Date.now() + 1).toString(),
        text: autoResponse,
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
      scrollToBottom();
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickReply = (reply) => {
    setInputText(reply);
  };

  const renderMessage = ({ item }) => {
    const isSupport = item.sender === 'support';
    
    return (
      <View style={[
        styles.messageContainer,
        isSupport ? styles.supportMessageContainer : styles.userMessageContainer,
      ]}>
        {isSupport && (
          <View style={styles.supportAvatar}>
            <Icon name="headset" size={20} color="#FF1493" />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isSupport ? styles.supportBubble : styles.userBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isSupport ? styles.supportText : styles.userText,
          ]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.supportMessageContainer]}>
        <View style={styles.supportAvatar}>
          <Icon name="headset" size={20} color="#FF1493" />
        </View>
        <View style={[styles.messageBubble, styles.supportBubble]}>
          <View style={styles.typingContainer}>
            <View style={styles.typingDot} />
            <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
            <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
          </View>
        </View>
      </View>
    );
  };

  const quickReplies = [
    { id: '1', text: 'Booking Issue', icon: 'calendar' },
    { id: '2', text: 'Payment Problem', icon: 'card' },
    { id: '3', text: 'Driver Issue', icon: 'person' },
    { id: '4', text: 'Cancel Ride', icon: 'close-circle' },
    { id: '5', text: 'Refund Status', icon: 'refresh' },
    { id: '6', text: 'General Query', icon: 'chatbubble' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      
      {/* Header */}
      <CurvedHeader
        title="Customer Support"
        navigation={navigation}
        showBack
        right={(
          <TouchableOpacity style={styles.menuButton}>
          <Icon name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Quick Replies */}
        <View style={styles.quickRepliesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesScroll}
          >
            {quickReplies.map((reply) => (
              <TouchableOpacity
                key={reply.id}
                style={styles.quickReplyButton}
                onPress={() => handleQuickReply(reply.text)}
              >
                <Icon name={reply.icon} size={16} color="#FF1493" />
                <Text style={styles.quickReplyText}>{reply.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="attach" size={24} color="#FF1493" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Icon
              name="send"
              size={22}
              color={inputText.trim() ? '#FF1493' : '#ccc'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  menuButton: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  supportMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  supportBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#FF1493',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  supportText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
    opacity: 0.6,
    animation: 'pulse 1s infinite',
  },
  quickRepliesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 8,
  },
  quickRepliesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 8,
  },
  quickReplyText: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    padding: 8,
    marginLeft: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

// Add animation for typing dots
const pulseAnimation = {
  from: { opacity: 0.4 },
  to: { opacity: 1 },
};

export default ChatSupportScreen;
