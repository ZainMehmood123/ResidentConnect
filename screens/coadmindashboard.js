import { useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

// Custom animated input component
const AnimatedInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  style = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedIsFocused]);

  const labelStyle = {
    position: "absolute",
    left: 15,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [17, 0],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["#aaa", "#888"],
    }),
    backgroundColor: isFocused ? "white" : "transparent",
    paddingHorizontal: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 4],
    }),
    zIndex: 1,
  };

  return (
    <View style={[styles.animatedInputContainer, style]}>
      <Animated.Text style={labelStyle}>{placeholder}</Animated.Text>
      <TextInput
        style={[styles.animatedInput, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType={keyboardType}
        blurOnSubmit
      />
    </View>
  );
};

// Notifications Modal Component
const NotificationsModal = ({
  visible,
  onClose,
  notifications,
  onNotificationPress,
  selectedNotification,
  onClearSelection,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "Issue Report":
        return (
          <Ionicons name="alert-circle-outline" size={24} color="#FF5252" />
        );
      case "Event Creation":
        return <Ionicons name="calendar-outline" size={24} color="#4CAF50" />;
      case "Maintenance Request":
        return <Ionicons name="construct-outline" size={24} color="#FFB300" />;
      case "Feedback":
        return <Ionicons name="chatbox-outline" size={24} color="#2196F3" />;
      default:
        return <Ionicons name="notifications-outline" size={24} color="#666" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString))) {
      return "Invalid date";
    }
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minute${
        Math.floor(diffInSeconds / 60) === 1 ? "" : "s"
      } ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour${
        Math.floor(diffInSeconds / 3600) === 1 ? "" : "s"
      } ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} day${
        Math.floor(diffInSeconds / 86400) === 1 ? "" : "s"
      } ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.notificationsModalContent}>
          {!selectedNotification ? (
            <>
              <Text style={styles.modalTitle}>Notifications</Text>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotificationsContainer}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={50}
                    color="#666"
                  />
                  <Text style={styles.emptyNotificationsText}>
                    No notifications yet
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.notificationsList}>
                  {notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification._id}
                      style={[
                        styles.notificationItem,
                        !notification.read && styles.unreadNotification,
                      ]}
                      onPress={() => onNotificationPress(notification)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.notificationIcon}>
                        {getNotificationIcon(notification.type)}
                      </View>
                      <View style={styles.notificationContent}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            !notification.read && styles.unreadNotificationText,
                          ]}
                        >
                          {notification.title || "Untitled"}
                        </Text>
                        <Text
                          style={styles.notificationDescription}
                          numberOfLines={2}
                        >
                          {notification.description || "No description"}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.notificationDetailContainer}>
              <Text style={styles.modalTitle}>
                {selectedNotification.title || "Untitled"}
              </Text>
              <View style={styles.notificationDetailContent}>
                <Text style={styles.notificationDetailLabel}>Description:</Text>
                <Text style={styles.notificationDetailText}>
                  {selectedNotification.description || "No description"}
                </Text>
                <Text style={styles.notificationDetailLabel}>Type:</Text>
                <Text style={styles.notificationDetailText}>
                  {selectedNotification.type || "Unknown"}
                </Text>
                <Text style={styles.notificationDetailLabel}>Time:</Text>
                <Text style={styles.notificationDetailText}>
                  {formatDate(selectedNotification.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={onClearSelection}
                activeOpacity={0.8}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

function CoAdminDashboard({ navigation }) {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [isAddResidentModalVisible, setIsAddResidentModalVisible] =
    useState(false);
  const [residentEmail, setResidentEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isAddCoAdminModalVisible, setIsAddCoAdminModalVisible] =
    useState(false);
  const [coAdminName, setCoAdminName] = useState("");
  const [coAdminEmail, setCoAdminEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [editableData, setEditableData] = useState({
    name: "",
    DOB: "",
    Gender: "",
    email: "",
    contact: "",
    Password: "",
  });
  const [profileSidebarVisible, setProfileSidebarVisible] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const autoPlayTimerRef = useRef(null);

  const features = [
    {
      id: 1,
      title: "Community Events",
      description: "Upcoming events in your society",
      image:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80",
      colors: ["#1E88E5", "#1565C0"],
      link: "Events",
    },
    {
      id: 2,
      title: "Maintenance Requests",
      description: "Track and manage maintenance issues",
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80",
      colors: ["#4CAF50", "#2E7D32"],
      link: "Maintenance",
    },
    {
      id: 3,
      title: "Society Gallery",
      description: "Photos from recent community gatherings",
      image:
        "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=500&q=80",
      colors: ["#9C27B0", "#6A1B9A"],
      link: "Gallery",
    },
    {
      id: 4,
      title: "Amenities",
      description: "Explore available facilities in your society",
      image:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80",
      colors: ["#FFC107", "#FF8F00"],
      link: "Amenities",
    },
  ];

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (autoPlayEnabled) {
      autoPlayTimerRef.current = setInterval(() => {
        nextSlide();
      }, 3000);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [activeFeatureIndex, autoPlayEnabled]);

  const handleManualNavigation = (action) => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    action();

    setAutoPlayEnabled(false);

    setTimeout(() => {
      setAutoPlayEnabled(true);
    }, 5000);
  };

  // Function to fetch notifications
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationError(null);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        throw new Error("Authentication required");
      }
      const response = await fetch(
        `http://${ipPort}/api/notifications/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to fetch notifications: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Notifications response:", data);

      // Validate data structure
      if (!Array.isArray(data.notifications)) {
        console.warn("Notifications is not an array:", data.notifications);
        setNotifications([]);
        setUnreadCount(0);
        throw new Error("Invalid notifications data format");
      }

      // Ensure required fields exist
      const validatedNotifications = data.notifications.map((notification) => ({
        _id: notification._id || `temp-${Math.random()}`,
        title: notification.title || "Untitled",
        description: notification.description || "No description",
        type: notification.type || "General",
        read: notification.read || false,
        createdAt: notification.createdAt || new Date().toISOString(),
      }));

      setNotifications(validatedNotifications);
      setUnreadCount(validatedNotifications.filter((n) => !n.read).length);
      console.log("Set notifications:", validatedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      setNotificationError(error.message || "Failed to fetch notifications");
      Alert.alert("Error", error.message || "Failed to fetch notifications");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Function to mark notification as read
  const markNotificationAsRead = async (notification) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        throw new Error("Authentication required");
      }

      console.log("Marking notification as read:", notification._id);
      const response = await fetch(
        `http://${ipPort}/api/notifications/notifications/${notification._id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to mark notification as read: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Mark as read response:", data);

      // Validate response data
      if (!Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n) => !n.read).length);
        setSelectedNotification({ ...notification, read: true });
      } else {
        console.warn("Invalid response format after marking as read:", data);
        Alert.alert("Warning", "Unexpected response format");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error.message);
      Alert.alert(
        "Error",
        error.message || "Failed to mark notification as read"
      );
    }
  };

  // Fetch profile data and notifications
  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        fetchProfileData(token);
        fetchNotifications();
      } else {
        Alert.alert("Error", "No token found, please log in.");
        setLoading(false);
      }
    };
    fetchToken();

    // Set up a refresh interval for notifications (every 5 minutes)
    const notificationInterval = setInterval(fetchNotifications, 300000);

    return () => clearInterval(notificationInterval);
  }, [fetchProfileData, fetchNotifications]);

  const fetchProfileData = async (token) => {
    try {
      const response = await fetch(`http://${ipPort}/api/profiles/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
        setEditableData(data.profile);
        setImageUri(
          data.profile.profilePic || "https://via.placeholder.com/150"
        );
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          `Failed to fetch profile data: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while fetching the profile data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const source = result.assets[0].uri;
      setImageUri(source);

      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }

      try {
        const response = await fetch(
          `http://${ipPort}/api/profiles/profile/picture`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profilePic: source }),
          }
        );

        if (response.ok) {
          Alert.alert("Success", "Profile picture updated successfully.");
        } else {
          const errorData = await response.json();
          Alert.alert(
            "Error",
            `Failed to update the profile picture: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "An error occurred while updating the profile picture. Please try again later."
        );
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileData(editableData)) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }

      const response = await fetch(`http://${ipPort}/api/profiles/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editableData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
        setIsEditing(false);
        Alert.alert("Success", "Profile has been updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        Alert.alert(
          "Error",
          `Failed to update the profile: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Network or Server Error:", error.message);
      Alert.alert(
        "Error",
        "An error occurred while updating the profile. Please try again later."
      );
    }
  };

  const validateProfileData = (data) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (data.email && !emailRegex.test(data.email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return false;
    }

    const nameRegex = /^[A-Za-z ]+$/;
    if (data.name && !nameRegex.test(data.name)) {
      Alert.alert("Error", "Name can only contain letters and spaces.");
      return false;
    }

    const phoneRegex = /^\d{11}$/;
    if (data.contact && !phoneRegex.test(data.contact)) {
      Alert.alert("Error", "Contact number must be 11 digits.");
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (data.DOB && !dateRegex.test(data.DOB)) {
      Alert.alert("Error", "Date of Birth must be in YYYY-MM-DD format.");
      return false;
    }
    return true;
  };

  const handleCancelEdit = () => {
    setEditableData({ ...profileData });
    setIsEditing(false);
  };

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return {};
    }
  };

  const generateCode = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!residentEmail) {
      Alert.alert("Error", "Please fill in the email field.");
      return;
    }

    if (!emailRegex.test(residentEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      Alert.alert("Error", "No token found. Please log in again.");
      return;
    }

    try {
      const decodedToken = decodeJWT(token);
      const { society_name, society_code } = decodedToken;

      if (!society_name || !society_code) {
        Alert.alert("Error", "Society information is missing in the token.");
        return;
      }

      const signupData = {
        email: residentEmail,
        society_name: society_name,
        society_code: society_code,
      };

      const response = await fetch(
        `http://${ipPort}/api/residentsignupcode/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(signupData),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setGeneratedCode(result.code || "Code generated");
        Alert.alert("Success", "Resident signup code generated successfully");
        setIsAddResidentModalVisible(false);
      } else {
        Alert.alert("Error", result.message || "An unknown error occurred");
      }
    } catch (error) {
      console.error("Error generating signup code:", error);
      Alert.alert("Error", "Error generating signup code");
    }
  };

  const handleAddCoAdmin = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[A-Za-z ]+$/;

    if (!coAdminEmail || !coAdminName) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (!emailRegex.test(coAdminEmail)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (!nameRegex.test(coAdminName)) {
      Alert.alert(
        "Error",
        "Co-admin name can only contain uppercase and lowercase letters."
      );
      return;
    }

    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      Alert.alert("Error", "No token found. Please log in again.");
      return;
    }

    try {
      const decodedToken = decodeJWT(token);
      const { society_name, society_code } = decodedToken;

      if (!society_name || !society_code) {
        Alert.alert("Error", "Society information is missing in the token.");
        return;
      }

      const coAdminData = {
        coadmin_name: coAdminName,
        email: coAdminEmail,
        society_name: society_name,
        society_code: society_code,
      };

      const response = await fetch(`http://${ipPort}/api/coadminadd/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coAdminData),
      });

      const result = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Co-admin added successfully");
        setIsAddCoAdminModalVisible(false);
        setCoAdminName("");
        setCoAdminEmail("");
      } else {
        Alert.alert("Error", result.message || "Failed to add co-admin");
      }
    } catch (error) {
      console.error("Error adding co-admin:", error);
      Alert.alert("Error", "Error adding co-admin");
    }
  };

  const nextSlide = () => {
    setActiveFeatureIndex((prevIndex) =>
      prevIndex === features.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setActiveFeatureIndex((prevIndex) =>
      prevIndex === 0 ? features.length - 1 : prevIndex - 1
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Open navigation menu"
          onPress={() => navigation.navigate("Side2")}
        >
          <Ionicons name="menu-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Co-Admin Dashboard</Text>
        <TouchableOpacity
          accessibilityLabel="Open profile sidebar"
          onPress={() => setProfileSidebarVisible(true)}
          style={styles.profileIcon}
        >
          <Ionicons name="person-circle-outline" size={30} color="#FFC107" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Dashboard Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#135387" />
          <Text>Loading Dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Feature Cards */}
          <View>
            <Text style={styles.subtitle}>Featured</Text>
            <View style={styles.featureCardContainer}>
              <View style={styles.featureCard}>
                <Image
                  source={{ uri: features[activeFeatureIndex].image }}
                  style={styles.featureCardImage}
                  defaultSource={require("../assets/bg5.png")}
                  onError={(e) =>
                    console.log("Image failed to load:", e.nativeEvent.error)
                  }
                />
                <LinearGradient
                  colors={features[activeFeatureIndex].colors}
                  style={styles.featureCardOverlay}
                >
                  <View style={styles.featureCardContent}>
                    <Text style={styles.featureCardTitle}>
                      {features[activeFeatureIndex].title}
                    </Text>
                    <Text style={styles.featureCardDescription}>
                      {features[activeFeatureIndex].description}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.featureCardControls}>
                <TouchableOpacity
                  style={styles.featureCardButton}
                  onPress={() => handleManualNavigation(prevSlide)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#135387" />
                </TouchableOpacity>

                <View style={styles.featureCardIndicators}>
                  {features.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        handleManualNavigation(() =>
                          setActiveFeatureIndex(index)
                        );
                      }}
                      style={[
                        styles.featureCardIndicator,
                        activeFeatureIndex === index &&
                          styles.featureCardIndicatorActive,
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.featureCardButton}
                  onPress={() => handleManualNavigation(nextSlide)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={24} color="#135387" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.subtitle}>Quick Actions</Text>
            <View style={styles.blocksRow}>
              <TouchableOpacity
                style={styles.block}
                onPress={() => setIsAddResidentModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={28}
                  color="#135387"
                  style={styles.blockIcon}
                />
                <Text style={styles.blockText}>Add Resident</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.block}
                onPress={() => setIsAddCoAdminModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-add-outline"
                  size={28}
                  color="#135387"
                  style={styles.blockIcon}
                />
                <Text style={styles.blockText}>Add Co-Admin</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Recent Announcements</Text>
            <View style={styles.blocksRow}>
              <TouchableOpacity
                style={styles.block}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#135387"
                  style={styles.blockIcon}
                />
                <Text style={styles.blockText}>
                  {notificationsLoading
                    ? "Loading..."
                    : notificationError
                    ? "Error Loading"
                    : notifications.length > 0
                    ? `${notifications.length} Notification${
                        notifications.length > 1 ? "s" : ""
                      }`
                    : "No Notifications"}
                </Text>
                {unreadCount > 0 &&
                  !notificationsLoading &&
                  !notificationError && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                {notificationError && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchNotifications}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.block}
                onPress={() => navigation.navigate("Feedback")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={28}
                  color="#135387"
                  style={styles.blockIcon}
                />
                <Text style={styles.blockText}>View Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Profile Sidebar */}
      {profileSidebarVisible && (
        <ProfileSidebar
          profileData={profileData}
          imageUri={imageUri}
          isEditing={isEditing}
          editableData={editableData}
          setEditableData={setEditableData}
          handleUpdateProfile={handleUpdateProfile}
          handleCancelEdit={handleCancelEdit}
          setIsEditing={setIsEditing}
          handleUpdateProfilePicture={handleUpdateProfilePicture}
          onClose={() => setProfileSidebarVisible(false)}
        />
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedNotification(null);
        }}
        notifications={notifications}
        onNotificationPress={(notification) => {
          markNotificationAsRead(notification);
          setSelectedNotification(notification);
        }}
        selectedNotification={selectedNotification}
        onClearSelection={() => setSelectedNotification(null)}
      />

      {/* Add Resident Modal */}
      <Modal
        visible={isAddResidentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddResidentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Resident</Text>
            <AnimatedInput
              placeholder="Enter Resident Email"
              value={residentEmail}
              onChangeText={setResidentEmail}
              keyboardType="email-address"
              style={{ marginBottom: 15 }}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateCode}
              activeOpacity={0.8}
            >
              <Text style={styles.generateButtonText}>Generate Code</Text>
            </TouchableOpacity>
            {generatedCode ? (
              <Text style={styles.generatedCode}>
                Generated Code: {generatedCode}
              </Text>
            ) : null}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsAddResidentModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Co-Admin Modal */}
      <Modal
        visible={isAddCoAdminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddCoAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Co-Admin</Text>
            <AnimatedInput
              placeholder="Enter Co-Admin Name"
              value={coAdminName}
              onChangeText={setCoAdminName}
              style={{ marginBottom: 15 }}
            />
            <AnimatedInput
              placeholder="Enter Co-Admin Email"
              value={coAdminEmail}
              onChangeText={setCoAdminEmail}
              keyboardType="email-address"
              style={{ marginBottom: 15 }}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleAddCoAdmin}
              activeOpacity={0.8}
            >
              <Text style={styles.generateButtonText}>Add Co-Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsAddCoAdminModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProfileSidebar({
  profileData,
  imageUri,
  isEditing,
  editableData,
  setEditableData,
  handleUpdateProfile,
  handleCancelEdit,
  setIsEditing,
  handleUpdateProfilePicture,
  onClose,
}) {
  return (
    <View style={styles.sidebar}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: imageUri || "https://via.placeholder.com/150",
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity
              style={styles.cameraIconContainer}
              onPress={handleUpdateProfilePicture}
              activeOpacity={0.7}
            >
              <FontAwesome
                name="camera"
                size={20}
                color="white"
                style={styles.cameraIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {editableData?.name || "Loading..."}
          </Text>
          <Text style={styles.profileEmail}>
            {editableData?.email || "Loading..."}
          </Text>
        </View>

        <View style={styles.profileDetails}>
          {isEditing ? (
            <>
              <AnimatedInput
                placeholder="Name"
                value={editableData?.name}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, name: text })
                }
                style={{ marginBottom: 15 }}
              />
              <AnimatedInput
                placeholder="Date of Birth"
                value={editableData?.DOB}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, DOB: text })
                }
                style={{ marginBottom: 15 }}
              />
              <AnimatedInput
                placeholder="Gender"
                value={editableData?.Gender}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, Gender: text })
                }
                style={{ marginBottom: 15 }}
              />
              <AnimatedInput
                placeholder="Email"
                value={editableData?.email}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, email: text })
                }
                keyboardType="email-address"
                style={{ marginBottom: 15 }}
              />
              <AnimatedInput
                placeholder="Contact"
                value={editableData?.contact}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, contact: text })
                }
                keyboardType="phone-pad"
                style={{ marginBottom: 15 }}
              />
              <AnimatedInput
                placeholder="Password"
                value={editableData?.Password}
                onChangeText={(text) =>
                  setEditableData({ ...editableData, Password: text })
                }
                secureTextEntry
                style={{ marginBottom: 15 }}
              />
            </>
          ) : (
            <>
              {renderProfileField("user", "Name", editableData?.name)}
              {renderProfileField(
                "calendar",
                "Date of Birth",
                editableData?.DOB
              )}
              {renderProfileField("user", "Gender", editableData?.Gender)}
              {renderProfileField("envelope", "Email", editableData?.email)}
              {renderProfileField("phone", "Contact", editableData?.contact)}
              {renderProfileField(
                "lock",
                "Password",
                editableData?.Password ? "********" : "Not Set"
              )}
            </>
          )}
        </View>

        <View style={styles.sidebarButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdateProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.closeSidebar}
        onPress={onClose}
        activeOpacity={0.7}
      >
        <Ionicons name="close-circle" size={30} color="#135387" />
      </TouchableOpacity>
    </View>
  );
}

function renderProfileField(iconName, label, value) {
  return (
    <View style={styles.detailRow}>
      <FontAwesome name={iconName} size={20} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.profileText}>{value || "Not Available"}</Text>
      </View>
    </View>
  );
}

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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  profileIcon: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#135387",
  },
  blocksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  block: {
    flex: 0.48,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  blockIcon: {
    marginBottom: 10,
  },
  blockText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#F44336",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  retryButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#135387",
    padding: 5,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    zIndex: 100,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#135387",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(19, 83, 135, 0.8)",
    padding: 8,
    borderRadius: 20,
  },
  cameraIcon: {
    marginRight: 0,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
  },
  profileDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#F8F8F8",
    padding: 10,
    borderRadius: 8,
  },
  icon: {
    color: "#135387",
    marginRight: 15,
    width: 20,
    textAlign: "center",
  },
  textContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  profileText: {
    fontSize: 16,
    color: "#333",
  },
  sidebarButtons: {
    marginBottom: 20,
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  updateButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  editButton: {
    backgroundColor: "#135387",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeSidebar: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  notificationsModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#135387",
    textAlign: "center",
  },
  animatedInputContainer: {
    position: "relative",
    width: "100%",
    height: 56,
    marginBottom: 10,
  },
  animatedInput: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  inputFocused: {
    borderColor: "#28A745",
    borderWidth: 2,
  },
  generateButton: {
    backgroundColor: "#135387",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  generatedCode: {
    fontSize: 16,
    color: "#135387",
    marginTop: 10,
    marginBottom: 10,
  },
  closeModalButton: {
    backgroundColor: "#F44336",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  closeModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  featureCardContainer: {
    marginBottom: 20,
  },
  featureCard: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  featureCardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featureCardOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  featureCardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featureCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  featureCardDescription: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
  },
  featureCardControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  featureCardButton: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureCardIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  featureCardIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(19, 83, 135, 0.3)",
  },
  featureCardIndicatorActive: {
    width: 24,
    backgroundColor: "#135387",
  },
  emptyNotificationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "white",
    alignItems: "center",
  },
  unreadNotification: {
    backgroundColor: "rgba(19, 83, 135, 0.05)",
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unreadNotificationText: {
    fontWeight: "bold",
    color: "#135387",
  },
  notificationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#135387",
    marginLeft: 10,
  },
  notificationDetailContainer: {
    flex: 1,
    padding: 20,
  },
  notificationDetailContent: {
    marginBottom: 20,
  },
  notificationDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  notificationDetailText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CoAdminDashboard;
