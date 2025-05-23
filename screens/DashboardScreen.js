import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import IoniconsVectorIcons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Ionicons as ExpoIonicons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons"; // Fixed import name
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ActivityIndicator } from "react-native";
const screenWidth = Dimensions.get("window").width;
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
import { BarChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system"; // Add this import at the top of the file

// Regex validation patterns
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  name: /^[A-Za-z\s]{2,50}$/,
  phone: /^\d{11}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  gender: /^(Male|Female|Other)$/i,
  skills: /^[A-Za-z0-9\s,.-]{0,100}$/,
};

// Validation function
const validateField = (field, value) => {
  if (!value) return true; // Allow empty fields (optional fields)

  const pattern = VALIDATION_PATTERNS[field];
  if (!pattern) return true; // No validation pattern defined

  return pattern.test(value);
};

// Error messages for validation
const ERROR_MESSAGES = {
  email: "Please enter a valid email address",
  name: "Name should only contain letters and spaces (2-50 characters)",
  phone: "Phone number should be 11 digits",
  date: "Date should be in YYYY-MM-DD format",
  password:
    "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number",
  gender: "Gender should be Male, Female, or Other",
  skills:
    "Skills can only contain letters, numbers, spaces, commas, periods, and hyphens (max 100 characters)",
};

function DashboardScreen({ navigation }) {
  const [profileSidebarVisible, setProfileSidebarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [modalVisible, setModalVisible] = useState({
    latestAnnouncements: false,
    resolvedIssues: false,
    viewEvents: false,
    reportedIssues: false,
    availableResources: false,
    emergencyAlerts: false,
    notifications: false,
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Card slider state
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const autoPlayTimerRef = useRef(null);

  // Features for the card slider
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

  // Auto-advance carousel every 2 seconds
  useEffect(() => {
    if (autoPlayEnabled) {
      autoPlayTimerRef.current = setInterval(() => {
        nextSlide();
      }, 2000);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [activeFeatureIndex, autoPlayEnabled]);

  // Pause auto-play when user interacts with carousel
  const handleManualNavigation = (action) => {
    // Clear the existing timer
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    // Perform the navigation action
    action();

    // Temporarily disable auto-play
    setAutoPlayEnabled(false);

    // Re-enable auto-play after 5 seconds of inactivity
    setTimeout(() => {
      setAutoPlayEnabled(true);
    }, 5000);
  };

  // Next slide function
  const nextSlide = () => {
    setActiveFeatureIndex((prevIndex) =>
      prevIndex === features.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Previous slide function
  const prevSlide = () => {
    setActiveFeatureIndex((prevIndex) =>
      prevIndex === 0 ? features.length - 1 : prevIndex - 1
    );
  };

  const Icons = { Ionicons: IoniconsVectorIcons, FontAwesome, ExpoIonicons };

  const fetchProfileData = useCallback(async (token) => {
    try {
      const response = await fetch(`http://${ipPort}/api/profiles/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProfileData(data.profile);
      setEditableData(data.profile);
      setImageUri(data.profile.profilePic);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      Alert.alert("Error", "Failed to fetch profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        throw new Error("Authentication required");
      }

      // Updated endpoint to match the mounted route: /api/notifications/notifications
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
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
      Alert.alert("Error", error.message || "Failed to fetch notifications");
    }
  }, []);

  // useEffect remains the same
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

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        throw new Error("Authentication required");
      }

      // Updated endpoint to match the mounted route: /api/notifications/notifications/:id/read
      const response = await fetch(
        `http://${ipPort}/api/notifications/notifications/${notificationId}/read`,
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
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error marking notification as read:", error.message);
      Alert.alert(
        "Error",
        error.message || "Failed to mark notification as read"
      );
    }
  };

  const handleUpdateProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please grant permission to access your media library."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      console.log("New Image URI:", newImageUri); // Debug the full path
      setImageUri(newImageUri);

      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("Error", "No token found, please log in.");
          return;
        }

        // Optionally convert to base64 or upload to cloud before sending
        let profilePicData = newImageUri;
        if (newImageUri.startsWith("file://")) {
          // Convert to base64 for sending to backend (if backend expects it)
          const base64 = await FileSystem.readAsStringAsync(newImageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          profilePicData = `data:image/jpeg;base64,${base64}`; // Adjust MIME type if needed
        }

        const response = await fetch(
          `http://${ipPort}/api/profiles/profile/picture`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profilePic: profilePicData }),
          }
        );

        if (response.ok) {
          Alert.alert("Success", "Profile picture updated successfully!");
        } else {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          Alert.alert(
            "Error",
            `Failed to update profile picture: ${
              errorData.error || "Unknown error"
            }`
          );
        }
      } catch (error) {
        console.error("Network or Server Error:", error.message);
        Alert.alert(
          "Error",
          "An error occurred while updating the profile picture. Please try again later."
        );
      }
    }
  };

  const validateProfileData = () => {
    const errors = {};

    // Validate each field
    if (editableData.email && !validateField("email", editableData.email)) {
      errors.email = ERROR_MESSAGES.email;
    }

    if (editableData.name && !validateField("name", editableData.name)) {
      errors.name = ERROR_MESSAGES.name;
    }

    if (editableData.contact && !validateField("phone", editableData.contact)) {
      errors.contact = ERROR_MESSAGES.phone;
    }

    if (editableData.DOB && !validateField("date", editableData.DOB)) {
      errors.DOB = ERROR_MESSAGES.date;
    }

    if (editableData.Gender && !validateField("gender", editableData.Gender)) {
      errors.Gender = ERROR_MESSAGES.gender;
    }

    if (
      editableData.Password &&
      !validateField("password", editableData.Password)
    ) {
      errors.Password = ERROR_MESSAGES.password;
    }

    if (editableData.skills && !validateField("skills", editableData.skills)) {
      errors.skills = ERROR_MESSAGES.skills;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    // Validate all fields before submitting
    if (!validateProfileData()) {
      // Show the first validation error
      const firstError = Object.values(validationErrors)[0];
      Alert.alert("Validation Error", firstError);
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

  const handleCancelEdit = () => {
    setEditableData({ ...profileData });
    setIsEditing(false);
    setValidationErrors({});
  };

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    markNotificationAsRead(notification._id);
  };

  const handleInputChange = (field, value) => {
    setEditableData({ ...editableData, [field]: value });

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Side")}>
          <Icons.Ionicons name="menu-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Resident Dashboard</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setProfileSidebarVisible(true)}
            style={styles.profileIcon}
          >
            <Icons.Ionicons
              name="person-circle-outline"
              size={30}
              color="#FFC107"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Feature Cards Slider */}
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

        <DashboardContent
          setModalVisible={setModalVisible}
          unreadCount={unreadCount}
        />
      </ScrollView>

      {profileSidebarVisible && (
        <ProfileSidebar
          profileData={profileData}
          imageUri={imageUri}
          isEditing={isEditing}
          editableData={editableData}
          setEditableData={handleInputChange}
          handleUpdateProfile={handleUpdateProfile}
          handleCancelEdit={handleCancelEdit}
          setIsEditing={setIsEditing}
          handleUpdateProfilePicture={handleUpdateProfilePicture}
          onClose={() => setProfileSidebarVisible(false)}
          validationErrors={validationErrors}
        />
      )}

      <NotificationsModal
        visible={modalVisible.notifications}
        onClose={() =>
          setModalVisible({ ...modalVisible, notifications: false })
        }
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
        selectedNotification={selectedNotification}
        onClearSelection={() => setSelectedNotification(null)}
      />

      <ResolvedIssuesModal
        visible={modalVisible.resolvedIssues}
        onClose={() =>
          setModalVisible({ ...modalVisible, resolvedIssues: false })
        }
      />
      <ViewEventsModal
        visible={modalVisible.viewEvents}
        onClose={() => setModalVisible({ ...modalVisible, viewEvents: false })}
        navigation={navigation}
      />
      <ReportedIssuesModal
        visible={modalVisible.reportedIssues}
        onClose={() =>
          setModalVisible({ ...modalVisible, reportedIssues: false })
        }
        navigation={navigation}
      />
      <AvailableResourcesModal
        visible={modalVisible.availableResources}
        onClose={() =>
          setModalVisible({ ...modalVisible, availableResources: false })
        }
        navigation={navigation}
      />
      <EmergencyAlertsModal
        visible={modalVisible.emergencyAlerts}
        onClose={() =>
          setModalVisible({ ...modalVisible, emergencyAlerts: false })
        }
      />
    </View>
  );
}

// Function to convert local file path to base64 data URL
const convertLocalPathToBase64 = async (localPath) => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(localPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Create a data URL (adjust MIME type if the image is PNG, etc.)
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return dataUrl;
  } catch (error) {
    console.error("Error converting local path to base64:", error);
    return null; // Return null if conversion fails
  }
};

// New Notifications Modal Component
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
          <ExpoIonicons name="alert-circle-outline" size={24} color="#F44336" />
        );
      case "Event Creation":
        return (
          <ExpoIonicons name="calendar-outline" size={24} color="#4CAF50" />
        );
      case "Resource Sharing":
        return <ExpoIonicons name="cube-outline" size={24} color="#2196F3" />;
      case "Visitor Request":
        return <ExpoIonicons name="person-outline" size={24} color="#FF9800" />;
      default:
        return (
          <ExpoIonicons
            name="notifications-outline"
            size={24}
            color="#135387"
          />
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "just now";
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotificationDetails = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedNotification}
      onRequestClose={onClearSelection}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, styles.detailModalView]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClearSelection}
          >
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            {selectedNotification &&
              getNotificationIcon(selectedNotification.type)}
            <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
          </View>

          <ScrollView style={styles.detailScrollView}>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Icon name="description" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {selectedNotification?.description}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="category" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedNotification?.type}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="schedule" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Received</Text>
                  <Text style={styles.detailValue}>
                    {selectedNotification?.createdAt &&
                      new Date(selectedNotification.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="notifications"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Notifications</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification,
                  ]}
                  onPress={() => onNotificationPress(notification)}
                >
                  <View style={styles.notificationIconContainer}>
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View style={styles.notificationContent}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadNotificationText,
                      ]}
                    >
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationPreview} numberOfLines={1}>
                      {notification.description}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatDate(notification.createdAt)}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyListContainer}>
                <ExpoIonicons
                  name="notifications-off-outline"
                  size={40}
                  color="#135387"
                  opacity={0.5}
                />
                <Text style={styles.emptyListText}>No notifications yet</Text>
              </View>
            )}
          </ScrollView>

          {renderNotificationDetails()}
        </View>
      </View>
    </Modal>
  );
};

// Updated ProfileSidebar component
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
  validationErrors,
}) {
  const [profileImageUri, setProfileImageUri] = useState(null); // State to store converted URI

  useEffect(() => {
    const processImageUri = async () => {
      if (imageUri && imageUri.startsWith("file://")) {
        // Convert local path to base64 if it's a file URI
        const dataUrl = await convertLocalPathToBase64(imageUri);
        if (dataUrl) {
          setProfileImageUri(dataUrl);
        } else {
          setProfileImageUri(
            profileData?.profilePic || "https://via.placeholder.com/150"
          ); // Fallback
        }
      } else {
        setProfileImageUri(
          imageUri ||
            profileData?.profilePic ||
            "https://via.placeholder.com/150"
        );
      }
    };

    processImageUri();
  }, [imageUri, profileData?.profilePic]);

  return (
    <View style={styles.sidebar}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: profileImageUri, // Use the processed/converted URI
              }}
              style={styles.profileImage}
              onError={(e) =>
                console.log(
                  "Image Error:",
                  e.nativeEvent.error,
                  "URI:",
                  profileImageUri
                )
              }
            />
            <TouchableOpacity
              style={styles.cameraIconContainer}
              onPress={handleUpdateProfilePicture}
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
          {renderProfileField(
            "user",
            "Name",
            editableData?.name,
            isEditing,
            (text) => setEditableData("name", text),
            validationErrors?.name
          )}
          {renderProfileField(
            "calendar",
            "Date of Birth",
            editableData?.DOB,
            isEditing,
            (text) => setEditableData("DOB", text),
            validationErrors?.DOB
          )}
          {renderProfileField(
            "user",
            "Gender",
            editableData?.Gender,
            isEditing,
            (text) => setEditableData("Gender", text),
            validationErrors?.Gender
          )}
          {renderProfileField(
            "envelope",
            "Email",
            editableData?.email,
            isEditing,
            (text) => setEditableData("email", text),
            validationErrors?.email
          )}
          {renderProfileField(
            "phone",
            "Contact",
            editableData?.contact,
            isEditing,
            (text) => setEditableData("contact", text),
            validationErrors?.contact
          )}
          {renderProfileField(
            "lightbulb-o",
            "Skills",
            editableData?.Password,
            isEditing,
            (text) => setEditableData("Password", text),
            validationErrors?.Password
          )}
        </View>

        <View style={styles.sidebarButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.closeSidebar} onPress={onClose}>
        <IoniconsVectorIcons name="close-circle" size={30} color="#135387" />
      </TouchableOpacity>
    </View>
  );
}

function renderProfileField(
  iconName,
  label,
  value,
  isEditing,
  onChangeText,
  validationError
) {
  return (
    <View style={styles.detailRow}>
      <FontAwesome name={iconName} size={20} style={styles.icon} />
      {isEditing ? (
        <View style={styles.textContainer}>
          <TextInput
            style={[
              styles.editInput,
              validationError ? styles.inputError : null,
            ]}
            placeholder={label}
            value={value}
            onChangeText={onChangeText}
          />
          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}
        </View>
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.profileText}>{value || "Not Available"}</Text>
        </View>
      )}
    </View>
  );
}

function DashboardContent({ setModalVisible, unreadCount }) {
  const renderBlock = (icon, title, onPress) => (
    <TouchableOpacity style={styles.block} onPress={onPress}>
      <ExpoIonicons
        name={icon}
        size={28}
        color="#135387"
        style={styles.blockIcon}
      />
      <Text style={styles.blockText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text style={styles.subtitle}>Notifications</Text>
      <View style={styles.blocksRow}>
        <TouchableOpacity
          style={styles.block}
          onPress={() =>
            setModalVisible((prev) => ({ ...prev, notifications: true }))
          }
        >
          <View style={styles.notificationBlockIconContainer}>
            <ExpoIonicons name="notifications" size={28} color="#135387" />
            {unreadCount > 0 && (
              <View style={styles.notificationBlockBadge}>
                <Text style={styles.notificationBlockBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.blockText}>Notifications</Text>
        </TouchableOpacity>

        {renderBlock("checkmark-circle-outline", "80% Resolved", () =>
          setModalVisible((prev) => ({ ...prev, resolvedIssues: true }))
        )}
      </View>

      <Text style={styles.subtitle}>Issues</Text>
      <View style={styles.blocksRow}>
        {renderBlock("calendar-outline", "View Events", () =>
          setModalVisible((prev) => ({ ...prev, viewEvents: true }))
        )}
        {renderBlock("alert-circle-outline", "View Reported Issues", () =>
          setModalVisible((prev) => ({ ...prev, reportedIssues: true }))
        )}
      </View>

      <Text style={styles.subtitle}>Resources & Alerts</Text>
      <View style={styles.blocksRow}>
        {renderBlock("clipboard-outline", "Available Resources", () =>
          setModalVisible((prev) => ({ ...prev, availableResources: true }))
        )}
        {renderBlock("warning-outline", "Emergency Alerts", () =>
          setModalVisible((prev) => ({ ...prev, emergencyAlerts: true }))
        )}
      </View>
    </View>
  );
}
const ResolvedIssuesModal = ({ visible, onClose }) => {
  const [issueStats, setIssueStats] = useState([]);
  const [overallStats, setOverallStats] = useState({
    resolved: 0,
    unresolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch issue stats when modal becomes visible
  useEffect(() => {
    if (visible) {
      const fetchIssueStats = async () => {
        try {
          setLoading(true);
          setError(null);

          const token = await AsyncStorage.getItem("jwtToken");
          if (!token) {
            throw new Error("No authentication token found. Please log in.");
          }

          const response = await fetch(
            `http://${ipPort}/api/report/issues/stats`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch issue stats");
          }

          const data = await response.json();
          setIssueStats(data);

          // Calculate overall resolved and unresolved percentages
          const totalResolved = data.reduce(
            (sum, item) => sum + item.resolved,
            0
          );
          const totalUnresolved = data.reduce(
            (sum, item) => sum + item.unresolved,
            0
          );
          const totalIssues = totalResolved + totalUnresolved;
          const resolvedPercentage =
            totalIssues > 0
              ? Math.round((totalResolved / totalIssues) * 100)
              : 0;
          const unresolvedPercentage =
            totalIssues > 0
              ? Math.round((totalUnresolved / totalIssues) * 100)
              : 0;

          setOverallStats({
            resolved: resolvedPercentage,
            unresolved: unresolvedPercentage,
          });
        } catch (error) {
          console.error("Error fetching issue stats:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchIssueStats();
    }
  }, [visible]);

  // Prepare data for the bar chart
  const chartData = {
    labels: issueStats.map((item) => item.year.toString()), // Years as labels
    datasets: [
      {
        data: issueStats.map((item) => item.resolved), // Resolved issues
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for resolved
        strokeWidth: 2,
      },
      {
        data: issueStats.map((item) => item.unresolved), // Unresolved issues
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for unresolved
        strokeWidth: 2,
      },
    ],
    legend: ["Resolved", "Unresolved"], // Legend for the chart
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0, // No decimal places for whole numbers
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="checkmark-circle-outline"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Issue Resolution Stats</Text>
          </View>

          <View style={styles.statsCardContainer}>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={[styles.statPercentage, { color: "#4CAF50" }]}>
                  {overallStats.resolved}%
                </Text>
                <Text style={styles.statLabel}>Resolved</Text>
                <View
                  style={[styles.statIndicator, { backgroundColor: "#4CAF50" }]}
                />
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statPercentage, { color: "#F44336" }]}>
                  {overallStats.unresolved}%
                </Text>
                <Text style={styles.statLabel}>Unresolved</Text>
                <View
                  style={[styles.statIndicator, { backgroundColor: "#F44336" }]}
                />
              </View>
            </View>
          </View>

          {/* Loading, Error, or Bar Chart */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#135387"
                style={styles.loading}
              />
              <Text style={styles.loadingText}>Loading statistics...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ExpoIonicons
                name="alert-circle-outline"
                size={40}
                color="#F44336"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : issueStats.length > 0 ? (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Issue Resolution by Year</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 60} // Adjust width based on modal padding
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero={true}
                showValuesOnTopOfBars={true}
                withHorizontalLabels={true}
                withInnerLines={false}
              />
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: "rgba(76, 175, 80, 1)" },
                    ]}
                  />
                  <Text style={styles.legendText}>Resolved</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: "rgba(244, 67, 54, 1)" },
                    ]}
                  />
                  <Text style={styles.legendText}>Unresolved</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <ExpoIonicons name="document-outline" size={40} color="#135387" />
              <Text style={styles.noDataText}>No data available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const ViewEventsModal = ({ visible, onClose, navigation }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pastEvents, setPastEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const fetchEvents = async (setPastEvents, setUpcomingEvents, setLoading) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }

      // Decode JWT to get user email
      const decoded = decodeJWT(token);
      console.log("Decoded JWT:", decoded); // Debugging

      if (!decoded || !decoded.email) {
        console.error("Error: User email not found in token.", decoded);
        Alert.alert("Error", "Invalid token. Please log in again.");
        return;
      }

      const userEmail = decoded.email;
      console.log("Fetching events for user:", userEmail);

      setLoading(true);
      const response = await fetch(`http://${ipPort}/api/events/fetchAll`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch events");
      }

      const data = await response.json();
      console.log("Fetched Resources:", data);

      if (!data || !data.events || !Array.isArray(data.events)) {
        throw new Error("Invalid data format: events should be an array");
      }

      const now = new Date();

      // Separate past events (created by the logged-in user)
      const pastEvents = data.events
        .filter((event) => event.userEmail === userEmail)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Separate upcoming events (not created by the logged-in user)
      const upcomingEvents = data.events
        .filter(
          (event) =>
            event.userEmail !== userEmail && new Date(event.date) >= now
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setPastEvents(pastEvents);
      setUpcomingEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      Alert.alert("Error", "Error fetching events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(setPastEvents, setUpcomingEvents, setLoading);
  }, []);

  const startChat = async (eventId) => {
    console.log("Frontend Sending Event ID:", eventId.toString());

    try {
      // Step 1: Get the logged-in user's ID
      const token = await AsyncStorage.getItem("jwtToken"); // Adjust based on storage method
      if (!token) {
        console.log("No token found. User not logged in.");
        return;
      }

      const decodedToken = decodeJWT(token);
      const loggedInUserId = decodedToken.id; // Adjust based on your token payload structure

      console.log("Logged-in User ID:", loggedInUserId);

      // Step 2: Fetch the recipient's user ID based on eventId
      const response = await fetch(
        `http://${ipPort}/api/events/get-user-id/${eventId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.log("Error fetching user ID:", data.message);
        return;
      }

      const recipientId = data.userId;
      console.log("Fetched Recipient ID:", recipientId);

      const initialMessage = {
        sender: loggedInUserId,
        recipient: recipientId,
        text: `Hi, I'm interested in the event "${data.eventname}" you're organizing.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      };

      const messageResponse = await fetch(
        `http://${ipPort}/api/messages/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(initialMessage),
        }
      );

      const messageData = await messageResponse.json();

      if (!messageResponse.ok) {
        console.log("Error sending initial message:", messageData.error);
        return;
      }

      Alert.alert(
        `Message "Hi, I'm interested in the event "${data.eventname}" you're organizing." sent successfully.`
      );

      setEventDetails(null);
      onClose();
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const fetchEventDetails = async (eventId, setEventDetails, setLoading) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }

      const response = await fetch(`http://${ipPort}/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch event details");
      }

      const eventDetails = await response.json();
      setEventDetails(eventDetails);
    } catch (error) {
      console.error("Error fetching event details:", error);
      Alert.alert("Error", "Error fetching event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchEventDetails = async (eventId) => {
    await fetchEventDetails(eventId, setEventDetails, setLoading);
  };

  const renderEventList = (events) => (
    <ScrollView style={styles.scrollView}>
      {events.length > 0 ? (
        events.map((event) => (
          <TouchableOpacity
            key={event._id}
            style={styles.listItem}
            onPress={() => handleFetchEventDetails(event._id)}
          >
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{event.name}</Text>
              <Text style={styles.listItemDate}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
            </View>
            <ExpoIonicons name="chevron-forward" size={20} color="#135387" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyListContainer}>
          <ExpoIonicons
            name="calendar-outline"
            size={40}
            color="#135387"
            opacity={0.5}
          />
          <Text style={styles.emptyListText}>No events found</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderEventDetails = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!eventDetails}
      onRequestClose={() => setEventDetails(null)}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, styles.detailModalView]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setEventDetails(null)}
          >
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="calendar"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Event Details</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#135387" />
              <Text style={styles.loadingText}>Loading event details...</Text>
            </View>
          ) : eventDetails ? (
            <ScrollView style={styles.detailScrollView}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Icon name="event" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Event Name</Text>
                    <Text style={styles.detailValue}>{eventDetails.name}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="description" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>
                      {eventDetails.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="date-range" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(eventDetails.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="access-time" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{eventDetails.time}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="location-on" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {eventDetails.location}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="person" size={20} color="#135387" />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Created by</Text>
                    <Text style={styles.detailValue}>{eventDetails.name}</Text>
                  </View>
                  {selectedOption === "upcoming" && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => startChat(eventDetails._id)}
                    >
                      <Icon name="chat" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Chat</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <ExpoIonicons
                name="alert-circle-outline"
                size={40}
                color="#F44336"
              />
              <Text style={styles.errorText}>Event details not available.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="calendar-outline"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Community Events</Text>
          </View>

          {!selectedOption ? (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("past")}
              >
                <ExpoIonicons name="time-outline" size={32} color="#135387" />
                <Text style={styles.optionTitle}>My Events</Text>
                <Text style={styles.optionDescription}>
                  Events you've created
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("upcoming")}
              >
                <ExpoIonicons name="calendar" size={32} color="#135387" />
                <Text style={styles.optionTitle}>Upcoming Events</Text>
                <Text style={styles.optionDescription}>
                  Events in the community
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedOption === "past" ? "My Events" : "Upcoming Events"}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedOption(null)}
                >
                  <ExpoIonicons name="arrow-back" size={18} color="#FFFFFF" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#135387" />
                  <Text style={styles.loadingText}>Loading events...</Text>
                </View>
              ) : (
                renderEventList(
                  selectedOption === "past" ? pastEvents : upcomingEvents
                )
              )}
            </>
          )}
          {renderEventDetails()}
        </View>
      </View>
    </Modal>
  );
};

const ReportedIssuesModal = ({ visible, onClose, navigation }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [myIssues, setMyIssues] = useState([]);
  const [otherIssues, setOtherIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (visible) {
      fetchIssues();
    }
  }, [visible]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        return;
      }

      const response = await fetch(`http://${ipPort}/api/report/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const rawData = await response.text();
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (parseError) {
        throw new Error("Invalid JSON response from API");
      }

      if (
        !data.success ||
        !Array.isArray(data.myIssues) ||
        !Array.isArray(data.otherIssues)
      ) {
        throw new Error("Invalid response format from API");
      }

      setMyIssues(data.myIssues);
      setOtherIssues(data.otherIssues);

      console.log("My Issues:", JSON.stringify(data.myIssues, null, 2));
      console.log("Other Issues:", JSON.stringify(data.otherIssues, null, 2));
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (issueId) => {
    console.log("Frontend Sending Issue ID:", issueId.toString());

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.log("No token found. User not logged in.");
        return;
      }

      const decodedToken = decodeJWT(token);
      const loggedInUserId = decodedToken.id;

      console.log("Logged-in User ID:", loggedInUserId);

      const response = await fetch(
        `http://${ipPort}/api/report/get-reporter-id/${issueId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.log("Error fetching reporter details:", data.message);
        return;
      }

      const reporterId = data.reporterId;
      console.log("Fetched Reporter ID:", reporterId);
      console.log("Issue Type:", data.issueType);

      const initialMessage = {
        sender: loggedInUserId,
        recipient: reporterId,
        text: `Hi, I wanted to discuss the issue "${data.issueType}" you reported.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      };

      const messageResponse = await fetch(
        `http://${ipPort}/api/messages/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialMessage),
        }
      );

      const messageData = await messageResponse.json();

      if (!messageResponse.ok) {
        console.log("Error sending initial message:", messageData.error);
        return;
      }

      Alert.alert(
        `Message Sent Successfully. Hi, I wanted to discuss the issue "${data.issueType}" you reported.`
      );

      setSelectedIssue(null);
      onClose();
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const resolveIssue = async (issueId) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.error("No token found, please log in.");
        return;
      }

      const response = await fetch(
        `http://${ipPort}/api/report/update-status/${issueId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Resolved" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to resolve issue");
      }

      const updatedIssue = await response.json();
      console.log("Issue resolved:", updatedIssue);

      // Update the local state with the resolved issue
      setMyIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue._id === issueId ? { ...issue, status: "Resolved" } : issue
        )
      );
      setSelectedIssue(null); // Close the details modal
      Alert.alert("Success", "Issue has been resolved.");
    } catch (error) {
      console.error("Error resolving issue:", error);
      Alert.alert("Error", "Failed to resolve issue. Please try again.");
    }
  };

  const renderIssueList = (issues) => {
    if (!issues || issues.length === 0) {
      return (
        <View style={styles.emptyListContainer}>
          <ExpoIonicons
            name="alert-circle-outline"
            size={40}
            color="#135387"
            opacity={0.5}
          />
          <Text style={styles.emptyListText}>No issues found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView}>
        {issues.map((issue) => (
          <TouchableOpacity
            key={issue.id || issue._id}
            style={styles.listItem}
            onPress={() => setSelectedIssue(issue)}
          >
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>
                {issue.issueType || "Untitled Issue"}
              </Text>
              <View style={styles.issueStatusContainer}>
                <Text
                  style={[
                    styles.issueStatus,
                    issue.status === "Resolved"
                      ? styles.statusResolved
                      : issue.status === "In Progress"
                      ? styles.statusInProgress
                      : issue.status === "Under Review"
                      ? styles.statusUnderReview
                      : styles.statusReported,
                  ]}
                >
                  {issue.status || "Status Unknown"}
                </Text>
              </View>
            </View>
            <ExpoIonicons name="chevron-forward" size={20} color="#135387" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderIssueDetails = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedIssue}
      onRequestClose={() => setSelectedIssue(null)}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, styles.detailModalView]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedIssue(null)}
          >
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="alert-circle"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Issue Details</Text>
          </View>

          <ScrollView style={styles.detailScrollView}>
            <View style={styles.detailCard}>
              {/* Images */}
              {selectedIssue?.images?.length > 0 && (
                <View style={styles.imagesContainer}>
                  <Text style={styles.imagesTitle}>Images</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagesScrollView}
                  >
                    {selectedIssue.images.map((image, index) => {
                      const imageUri = decodeURIComponent(image);
                      return (
                        <Image
                          key={index}
                          source={{ uri: imageUri }}
                          style={styles.issueImage}
                          onError={(e) =>
                            console.error(
                              "Image Load Error:",
                              e.nativeEvent.error
                            )
                          }
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Issue Type */}
              <View style={styles.detailRow}>
                <Icon name="error-outline" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Issue Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedIssue?.issueType}
                  </Text>
                </View>
              </View>

              {/* Status */}
              <View style={styles.detailRow}>
                <Icon name="flag" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      selectedIssue?.status === "Resolved"
                        ? styles.statusResolved
                        : selectedIssue?.status === "In Progress"
                        ? styles.statusInProgress
                        : selectedIssue?.status === "Under Review"
                        ? styles.statusUnderReview
                        : styles.statusReported,
                    ]}
                  >
                    {selectedIssue?.status || "Status Unknown"}
                  </Text>
                </View>
              </View>

              {/* Reported By */}
              <View style={styles.detailRow}>
                <Icon name="person" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Reported by</Text>
                  <Text style={styles.detailValue}>
                    {selectedIssue?.userEmail}
                  </Text>
                </View>
                {selectedOption === "others" && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      startChat(selectedIssue?._id || selectedIssue?.id)
                    }
                  >
                    <Icon name="chat" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Chat</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Description */}
              <View style={styles.detailRow}>
                <Icon name="description" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {selectedIssue?.description}
                  </Text>
                </View>
              </View>

              {/* Contact Info */}
              <View style={styles.detailRow}>
                <Icon name="phone" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Contact Info</Text>
                  <Text style={styles.detailValue}>
                    {selectedIssue?.contactInfo}
                  </Text>
                </View>
              </View>

              {/* Created At */}
              <View style={styles.detailRow}>
                <Icon name="schedule" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Reported on</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedIssue?.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Resolve Button (only for My Issues with Pending status) */}
              {selectedOption === "my" &&
                selectedIssue?.status === "Pending" && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => resolveIssue(selectedIssue?._id)}
                  >
                    <ExpoIonicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.resolveButtonText}>
                      Mark as Resolved
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="alert-circle-outline"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Reported Issues</Text>
          </View>

          {!selectedOption ? (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("my")}
              >
                <ExpoIonicons name="person-outline" size={32} color="#135387" />
                <Text style={styles.optionTitle}>My Issues</Text>
                <Text style={styles.optionDescription}>
                  Issues you've reported
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("others")}
              >
                <ExpoIonicons name="people-outline" size={32} color="#135387" />
                <Text style={styles.optionTitle}>Community Issues</Text>
                <Text style={styles.optionDescription}>
                  Issues reported by others
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedOption === "my" ? "My Issues" : "Community Issues"}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedOption(null)}
                >
                  <ExpoIonicons name="arrow-back" size={18} color="#FFFFFF" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#135387" />
                  <Text style={styles.loadingText}>Loading issues...</Text>
                </View>
              ) : (
                renderIssueList(
                  selectedOption === "my" ? myIssues : otherIssues
                )
              )}
            </>
          )}
          {renderIssueDetails()}
        </View>
      </View>
    </Modal>
  );
};

const AvailableResourcesModal = ({ visible, onClose, navigation }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [myResources, setMyResources] = useState([]);
  const [sharedResources, setSharedResources] = useState([]);
  const [loading, setLoading] = useState(false);

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const fetchResources = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }

      const decoded = decodeJWT(token);
      const userEmail = decoded?.email;

      if (!userEmail) {
        console.error("Error: User email not found in token.");
        Alert.alert("Error", "Invalid token. Please log in again.");
        return;
      }

      setLoading(true);
      const response = await fetch(`http://${ipPort}/api/resources/fetchAll`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch resources");
      }

      const data = await response.json();

      if (
        !data ||
        !Array.isArray(data.myResources) ||
        !Array.isArray(data.sharedResources)
      ) {
        throw new Error("Invalid data format: expected arrays");
      }

      setMyResources(data.myResources);
      setSharedResources(data.sharedResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      Alert.alert("Error", "Error fetching resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchResources();
    }
  }, [visible]);

  const startChat = async (resourceId) => {
    console.log("Frontend Sending Resource ID:", resourceId.toString());

    try {
      // Step 1: Get the logged-in user's ID
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        console.log("No token found. User not logged in.");
        return;
      }

      const decodedToken = decodeJWT(token);
      const loggedInUserId = decodedToken.id;

      console.log("Logged-in User ID:", loggedInUserId);

      // Step 2: Fetch the resource owner info
      const response = await fetch(
        `http://${ipPort}/api/resources/get-owner-id/${resourceId}`
      );
      const data = await response.json();

      if (!response.ok) {
        console.log("Error fetching owner details:", data.message);
        return;
      }

      const recipientId = data.ownerId;
      console.log("Fetched Recipient ID:", recipientId);

      // Step 3: Send an initial message
      const initialMessage = {
        sender: loggedInUserId,
        recipient: recipientId,
        text: `Hi, I'm interested in the resource Name: "${data.item}" which you're sharing.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      };

      const messageResponse = await fetch(
        `http://${ipPort}/api/messages/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialMessage),
        }
      );

      const messageData = await messageResponse.json();

      if (!messageResponse.ok) {
        console.log("Error sending initial message:", messageData.error);
        return;
      }

      Alert.alert(
        `Message Hi, I'm interested in the resource Name: "${data.item}" which you're sharing. sent successfully:`
      );

      setSelectedResource(null);
      onClose();
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const renderResourceList = (resources) => {
    if (!resources || resources.length === 0) {
      return (
        <View style={styles.emptyListContainer}>
          <ExpoIonicons
            name="cube-outline"
            size={40}
            color="#135387"
            opacity={0.5}
          />
          <Text style={styles.emptyListText}>No resources found</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView}>
        {resources.map((resource) => (
          <TouchableOpacity
            key={resource.id || resource._id}
            style={styles.listItem}
            onPress={() => setSelectedResource(resource)}
          >
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{resource.item}</Text>
              <View style={styles.resourceStatusContainer}>
                <Text
                  style={[
                    styles.resourceStatus,
                    resource.status === "Available"
                      ? styles.statusAvailable
                      : styles.statusBooked,
                  ]}
                >
                  {resource.status}
                </Text>
              </View>
            </View>
            <ExpoIonicons name="chevron-forward" size={20} color="#135387" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderResourceDetails = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!selectedResource}
      onRequestClose={() => setSelectedResource(null)}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, styles.detailModalView]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedResource(null)}
          >
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="cube"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Resource Details</Text>
          </View>

          <ScrollView style={styles.detailScrollView}>
            {selectedResource?.image && (
              <Image
                source={{ uri: selectedResource.image }}
                style={styles.resourceDetailImage}
              />
            )}

            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Icon name="inventory" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Item</Text>
                  <Text style={styles.detailValue}>
                    {selectedResource?.item}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="description" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>
                    {selectedResource?.description}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="location-on" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {selectedResource?.location}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="phone" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Contact</Text>
                  <Text style={styles.detailValue}>
                    {selectedResource?.contact}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="flag" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text
                    style={[
                      styles.statusBadge,
                      selectedResource?.status === "Available"
                        ? styles.statusAvailable
                        : styles.statusBooked,
                    ]}
                  >
                    {selectedResource?.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Icon name="person" size={20} color="#135387" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Shared by</Text>
                  <Text style={styles.detailValue}>
                    {selectedResource?.owner?.name}
                  </Text>
                </View>
                {selectedOption === "shared" &&
                  selectedResource?.status === "Available" && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        if (selectedResource) {
                          startChat(
                            selectedResource._id || selectedResource.id
                          );
                        }
                      }}
                    >
                      <Icon name="chat" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Contact</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ExpoIonicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="cube-outline"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Community Resources</Text>
          </View>

          {!selectedOption ? (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("my")}
              >
                <ExpoIonicons name="person-outline" size={32} color="#135387" />
                <Text style={styles.optionTitle}>My Resources</Text>
                <Text style={styles.optionDescription}>
                  Resources you've shared
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => setSelectedOption("shared")}
              >
                <ExpoIonicons name="people-outline" size={32} color="#135387" />
                <Text style={styles.optionTitle}>Available Resources</Text>
                <Text style={styles.optionDescription}>
                  Resources shared by others
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedOption === "my"
                    ? "My Resources"
                    : "Available Resources"}
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedOption(null)}
                >
                  <ExpoIonicons name="arrow-back" size={18} color="#FFFFFF" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#135387" />
                  <Text style={styles.loadingText}>Loading resources...</Text>
                </View>
              ) : (
                renderResourceList(
                  selectedOption === "my" ? myResources : sharedResources
                )
              )}
            </>
          )}
          {renderResourceDetails()}
        </View>
      </View>
    </Modal>
  );
};

const EmergencyAlertsModal = ({ visible, onClose }) => {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (visible) {
      fetchEmergencyAlerts();
    }
  }, [visible]);

  const fetchEmergencyAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://${ipPort}/api/emergency/fetchAll`);

      if (!response.ok) {
        throw new Error("Failed to fetch emergency alerts");
      }

      const data = await response.json();

      if (!Array.isArray(data.alerts)) {
        throw new Error("Invalid data format: Expected an array");
      }
      console.log("Emergnevcy:", data);

      setEmergencyAlerts(data.alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      Alert.alert(
        "Error",
        "Could not load emergency alerts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#F44336" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ExpoIonicons
              name="warning"
              size={28}
              color="#135387"
              style={styles.modalHeaderIcon}
            />
            <Text style={styles.modalTitle}>Emergency Alerts</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F44336" />
              <Text style={styles.loadingText}>
                Loading emergency alerts...
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {emergencyAlerts.length > 0 ? (
                emergencyAlerts.map((alert) => {
                  // Convert timestamp to Date and extract exact UTC date and time
                  const dateObj = new Date(alert.timestamp);
                  const formattedDate = `${dateObj.getUTCFullYear()}-${String(
                    dateObj.getUTCMonth() + 1
                  ).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(
                    2,
                    "0"
                  )}`;

                  // Convert to 12-hour format with AM/PM
                  const hours = dateObj.getUTCHours();
                  const minutes = String(dateObj.getUTCMinutes()).padStart(
                    2,
                    "0"
                  );
                  const seconds = String(dateObj.getUTCSeconds()).padStart(
                    2,
                    "0"
                  );
                  const period = hours >= 12 ? "PM" : "AM";
                  const adjustedHours = hours % 12 || 12; // Converts 0 to 12 for midnight/noon
                  const formattedTime = `${adjustedHours}:${minutes}:${seconds} ${period}`;

                  return (
                    <View key={alert._id} style={styles.alertCard}>
                      <View style={styles.alertHeader}>
                        <ExpoIonicons
                          name="warning"
                          size={24}
                          color="#F44336"
                        />
                        <Text style={styles.alertTitle}>
                          {alert.type.toUpperCase()} ALERT
                        </Text>
                      </View>

                      <View style={styles.alertContent}>
                        <Text style={styles.alertDescription}>
                          {alert.details}
                        </Text>

                        <View style={styles.alertTimeContainer}>
                          <Icon name="event" size={16} color="#135387" />
                          <Text style={styles.alertTimeText}></Text>
                          <Text style={styles.alertTimeText}>
                            {formattedDate}
                          </Text>
                        </View>

                        <View style={styles.alertTimeContainer}>
                          <Icon name="access-time" size={16} color="#135387" />
                          <Text style={styles.alertTimeText}>
                            {formattedTime}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyListContainer}>
                  <ExpoIonicons
                    name="checkmark-circle-outline"
                    size={40}
                    color="#4CAF50"
                  />
                  <Text style={styles.emptyListText}>
                    No active emergency alerts
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerText}>© {currentYear} ResidentConnect</Text>
        </View>
        <View style={styles.footerRight}>
          <TouchableOpacity style={styles.footerIconContainer}>
            <FontAwesome name="facebook" size={20} color="#135387" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconContainer}>
            <FontAwesome name="twitter" size={20} color="#135387" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerIconContainer}>
            <FontAwesome name="instagram" size={20} color="#135387" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.footerVersion}>Version 1.0.3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Existing styles
  imageContainer: {
    marginTop: 10,
  },
  imageStyle: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },

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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIcon: {
    padding: 5,
    marginRight: 10,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FFC107",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: "#135387",
    fontSize: 10,
    fontWeight: "bold",
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
  editInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    padding: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 4,
  },
  errorText: {
    color: "#F44336",
    fontSize: 12,
    marginTop: 2,
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

  // Enhanced modal styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
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
  detailModalView: {
    padding: 0,
    paddingTop: 15,
    paddingBottom: 20,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    width: "100%",
    paddingHorizontal: 20,
  },
  modalHeaderIcon: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#135387",
  },

  // List items
  scrollView: {
    width: "100%",
    marginTop: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  listItemPreview: {
    fontSize: 14,
    color: "#666",
  },
  listItemDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  // Empty states
  emptyListContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyListText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },

  // Loading states
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
  },

  // Error states
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginTop: 10,
    textAlign: "center",
  },

  // Options
  optionsContainer: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#135387",
    marginTop: 10,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#135387",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#135387",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
  },

  // Detail views
  detailScrollView: {
    width: "100%",
    paddingHorizontal: 15,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
  },

  // Action buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#135387",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    marginLeft: 5,
  },

  // Status badges
  statusBadge: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusResolved: {
    color: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  statusInProgress: {
    color: "#2196F3",
    backgroundColor: "rgba(33, 150, 243, 0.1)",
  },
  statusUnderReview: {
    color: "#FF9800",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
  },
  statusReported: {
    color: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  statusAvailable: {
    color: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  statusBooked: {
    color: "#F44336",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },

  // Images
  resourceDetailImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  issueImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  imagesContainer: {
    marginTop: 15,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 10,
  },
  imagesScrollView: {
    flexDirection: "row",
  },

  // Stats and charts
  statsCardContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 10,
  },
  statPercentage: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  statIndicator: {
    height: 4,
    width: 30,
    borderRadius: 2,
    marginTop: 5,
  },
  chartContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },

  // Alert cards
  alertCard: {
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#F44336",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    padding: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F44336",
    marginLeft: 10,
  },
  alertContent: {
    padding: 15,
  },
  alertDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  alertTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  alertTimeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },

  // Resolve button
  resolveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  resolveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // Modal content
  modalContentContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    marginTop: 10,
  },
  modalContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },

  // Footer styles
  footer: {
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    padding: 15,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flexDirection: "row",
  },
  footerText: {
    color: "#666",
    fontSize: 12,
  },
  footerVersion: {
    color: "#999",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },
  footerIconContainer: {
    marginLeft: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },

  // Status containers
  issueStatusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  resourceStatusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },

  // No data container
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },

  // Notification styles
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "rgba(19, 83, 135, 0.05)",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  unreadNotificationText: {
    fontWeight: "bold",
    color: "#135387",
  },
  notificationPreview: {
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
    position: "absolute",
    right: 15,
    top: 15,
  },

  // Notification block styles
  notificationBlockIconContainer: {
    position: "relative",
    marginBottom: 10,
  },
  notificationBlockBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notificationBlockBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  // Feature card styles
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
});

export default DashboardScreen;
