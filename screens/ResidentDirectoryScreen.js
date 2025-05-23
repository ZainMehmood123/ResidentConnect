import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
const API_URL = `http://${ipPort}/api/messages`;
const socket = io(`http://${ipPort}`, { autoConnect: false });
const { width } = Dimensions.get("window");

const ResidentDirectoryScreen = ({ route, navigation }) => {
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef();
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  const decodeJWT = (token) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  };

  useEffect(() => {
    const fetchTokenAndUser = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("Error", "No token found, please log in.");
          setLoading(false);
          return;
        }
        const decoded = decodeJWT(token);
        const userEmail = decoded.id; // Adjust based on your JWT structure
        setUserId(userEmail);

        socket.connect();
        socket.emit("register", userEmail);
      } catch (error) {
        console.error("Error fetching token:", error);
        Alert.alert("Error", "Failed to fetch user token.");
      } finally {
        setLoading(false);
      }
    };
    fetchTokenAndUser();

    return () => {
      socket.disconnect();
    };
  }, []);

  const animateSearchBar = (toValue) => {
    Animated.timing(searchBarAnim, { toValue, duration: 300, useNativeDriver: false }).start();
  };

  useEffect(() => {
    if (userId && !loading) {
      fetchContacts();
    }

    socket.on("newMessage", (message) => {
      if (
        (message.sender._id === selectedContact?._id && message.recipient === userId) ||
        (message.recipient === selectedContact?._id && message.sender === userId)
      ) {
        setMessages((prev) => [...prev, message]);
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
      if (message.recipient === userId && message.sender._id !== selectedContact?._id) {
        setContacts((prev) =>
          prev.map((contact) =>
            contact._id === message.sender._id
              ? { ...contact, unreadCount: (contact.unreadCount || 0) + 1 }
              : contact
          )
        );
      }
    });

    socket.on("onlineStatus", ({ userId: contactId, online }) => {
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === contactId ? { ...contact, online } : contact
        )
      );
    });

    socket.on("typing", ({ sender, recipient }) => {
      if (sender === selectedContact?._id && recipient === userId) setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    });

    socket.on("unreadCountUpdate", ({ sender, count }) => {
      if (sender !== selectedContact?._id) {
        setContacts((prev) =>
          prev.map((contact) =>
            contact._id === sender ? { ...contact, unreadCount: count } : contact
          )
        );
      }
    });
  }, [userId, loading, selectedContact]);

  const fetchContacts = async () => {
    if (!userId || loading) return;
    try {
      const response = await fetch(`${API_URL}/contacts?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      const filteredContacts = data.filter((contact) => contact._id !== userId);
      setContacts(filteredContacts);

      if (route.params?.recipientId) {
        const recipient = filteredContacts.find((contact) => contact._id === route.params.recipientId);
        if (recipient) handleContactSelect(recipient);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      Alert.alert("Error", "Failed to fetch contacts.");
    }
  };

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);
    setActiveTab("chats");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/messages/${userId}/${contact._id}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);

      setContacts((prev) =>
        prev.map((c) => (c._id === contact._id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message = {
      sender: userId,
      recipient: selectedContact._id,
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sending",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    socket.emit("sendMessage", message);
    socket.emit("typing", { sender: userId, recipient: selectedContact._id });

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();
      setMessages((prev) =>
        prev.map((msg) => (msg.time === message.time && msg.status === "sending" ? data : msg))
      );
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAttachImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to attach images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageMessage = {
        sender: userId,
        recipient: selectedContact._id,
        type: "image",
        uri: result.assets[0].uri,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      };
      setMessages((prev) => [...prev, imageMessage]);
      socket.emit("sendMessage", imageMessage);

      try {
        const response = await fetch(`${API_URL}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imageMessage),
        });
        if (!response.ok) throw new Error("Failed to send image");
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } catch (error) {
        console.error("Error sending image:", error);
      }
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.name?.toLowerCase() ||
        `${contact.firstName?.toLowerCase()} ${contact.lastName?.toLowerCase()}`)?.includes(
        searchQuery.toLowerCase()
      ) || contact.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContactItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.contactItem, selectedContact?._id === item._id && styles.selectedContactItem]}
      onPress={() => handleContactSelect(item)}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
          onError={(e) => console.log("Image Error:", e.nativeEvent.error, "URI:", item.avatar)}
        />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{item.name || `${item.firstName} ${item.lastName}`}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.contactSubheader}>
          <Text style={styles.contactRole}>{item.role}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = (message, index) => {
    const isMe = message.sender._id === userId;
    const showAvatar = !isMe && (index === 0 || messages[index - 1].sender._id !== message.sender._id);

    return (
      <View
        key={message._id}
        style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}
      >
        {!isMe && showAvatar && (
          <Image
            source={{ uri: message.sender.avatar }}
            style={styles.messageAvatar}
            onError={(e) => console.log("Image Error:", e.nativeEvent.error, "URI:", message.sender.avatar)}
          />
        )}
        {!isMe && !showAvatar && <View style={styles.messagePlaceholder} />}
        <View style={[styles.messageBubble, isMe ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {message.type === "image" ? (
            <Image
              source={{ uri: message.uri }}
              style={{ width: 200, height: 150, borderRadius: 10 }}
              onError={(e) => console.log("Image Error:", e.nativeEvent.error, "URI:", message.uri)}
            />
          ) : (
            <Text style={styles.messageText}>{message.text}</Text>
          )}
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{message.time}</Text>
            {isMe && (
              <View style={styles.messageStatus}>
                {message.status === "sending" && <MaterialIcons name="access-time" size={14} color="#999" />}
                {message.status === "sent" && <MaterialIcons name="check" size={14} color="#999" />}
                {message.status === "read" && <MaterialIcons name="done-all" size={14} color="#4FC3F7" />}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#135387" />
      <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => animateSearchBar(searchBarAnim._value === 0 ? 1 : 0)}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <Animated.View
        style={[
          styles.searchBarContainer,
          { height: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }), opacity: searchBarAnim },
        ]}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearch}>
          <Ionicons name="close-circle" size={20} color="#999" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chats" && styles.activeTab]}
          onPress={() => setActiveTab("chats")}
        >
          <Text style={[styles.tabText, activeTab === "chats" && styles.activeTabText]}>Chats</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.tab, activeTab === "contacts" && styles.activeTab]}
          onPress={() => setActiveTab("contacts")}
        >
          <Text style={[styles.tabText, activeTab === "contacts" && styles.activeTabText]}>Contacts</Text>
        </TouchableOpacity> */}
      </View>

      {!selectedContact ? (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.contactsList}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedContact(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#135387" />
            </TouchableOpacity>
            <Image source={{ uri: selectedContact.avatar }} style={styles.chatAvatar} />
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatName}>
                {selectedContact.name || `${selectedContact.firstName} ${selectedContact.lastName}`}
              </Text>
              <Text style={styles.chatStatus}>{selectedContact.online ? "Online" : "Offline"}</Text>
            </View>
            {/* <TouchableOpacity style={styles.chatHeaderIcon}>
              <Ionicons name="call" size={22} color="#135387" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatHeaderIcon}>
              <Ionicons name="videocam" size={22} color="#135387" />
            </TouchableOpacity> */}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#135387" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((message, index) => renderMessage(message, index))}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>{selectedContact.name} is typing...</Text>
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={handleAttachImage}>
              <Ionicons name="attach" size={24} color="#135387" />
            </TouchableOpacity>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            {/* <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy" size={24} color="#135387" />
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: Platform.OS === "ios" ? 50 : 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  searchBarContainer: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearSearch: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#135387",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#135387",
    fontWeight: "bold",
  },
  contactsList: {
    padding: 10,
  },
  contactItem: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  selectedContactItem: {
    backgroundColor: "#E3F2FD",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  contactInfo: {
    flex: 1,
    justifyContent: "center",
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactSubheader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: "#666",
  },
  unreadBadge: {
    backgroundColor: "#135387",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 10,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    marginRight: 10,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chatStatus: {
    fontSize: 12,
    color: "#4CAF50",
  },
  chatHeaderIcon: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#E5DDD5",
  },
  messagesContent: {
    padding: 10,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 10,
    maxWidth: "80%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  theirMessageContainer: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 5,
    alignSelf: "flex-end",
  },
  messagePlaceholder: {
    width: 30,
    marginRight: 5,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: "100%",
  },
  myMessageBubble: {
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 5,
  },
  theirMessageBubble: {
    backgroundColor: "white",
    borderTopLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 5,
  },
  messageTime: {
    fontSize: 11,
    color: "#999",
    marginRight: 5,
  },
  messageStatus: {
    flexDirection: "row",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  attachButton: {
    padding: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  emojiButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: "#135387",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  typingIndicator: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

export default ResidentDirectoryScreen;