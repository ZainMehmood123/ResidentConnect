"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { PieChart, LineChart } from "react-native-chart-kit";
import { Picker } from "@react-native-picker/picker";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const { width, height } = Dimensions.get("window");

// Create responsive size functions
const wp = (percentage) => {
  return (percentage * width) / 100;
};

const hp = (percentage) => {
  return (percentage * height) / 100;
};

// Responsive font size
const normalize = (size) => {
  const scale = width / 375;
  const newSize = size * scale;
  return Math.round(Platform.OS === "ios" ? newSize : newSize - 2);
};

// Regex patterns for validation
const nameRegex = /^[a-zA-Z\s]{2,50}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{11}$/;
const dateRegex =
  /^(0[1-9]|[12][0-9]|3[01])[- /.](0[1-9]|1[012])[- /.](19|20)\d\d$/;
const genderRegex = /^(Male|Female|Other)$/i;

function SuperAdminDashboard({ navigation }) {
  const [profileSidebarVisible, setProfileSidebarVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    contact: "",
    DOB: "",
    Gender: "",
    Password: "",
  });

  // Metrics state
  const [totalSocieties, setTotalSocieties] = useState(0);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [totalActiveSocieties, setTotalActiveSocieties] = useState(0);
  const [totalRejectedSocieties, setTotalRejectedSocieties] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  // Chart data
  const [selectedPieSlice, setSelectedPieSlice] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All Societies");
  const [categories, setCategories] = useState(["All Societies"]);
  const [pieData, setPieData] = useState([
    {
      name: "Loading",
      population: 100,
      color: "#ccc",
      legendFontColor: "#333",
      legendFontSize: normalize(14),
    },
  ]);
  const [lineData, setLineData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
        legend: "Loading",
      },
    ],
    legend: ["Loading"],
  });

  // Fetch metrics
  const fetchMetrics = useCallback(async (token) => {
    try {
      const response = await fetch(`http://${ipPort}/api/developer/metrics`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData}`
        );
      }
      const data = await response.json();
      console.log("Metrics Data:", data); // Debug log
      setTotalSocieties(data.totalSocieties || 0);
      setTotalPopulation(data.totalPopulation || 0);
      setTotalActiveSocieties(data.totalActiveSocieties || 0);
      setTotalRejectedSocieties(data.totalRejectedSocieties || 0);
      setTotalEvents(data.totalEvents || 0);
    } catch (error) {
      console.error("Error fetching metrics:", error.message);
      Alert.alert("Error", "Failed to fetch metrics. Please try again.");
    }
  }, []);

  // Fetch PieChart data
  const fetchPieData = useCallback(async (token, category) => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/developer/analytics?category=${encodeURIComponent(
          category
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData}`
        );
      }
      const data = await response.json();
      console.log("Pie Data:", data); // Debug log
      if (data && Array.isArray(data) && data.length > 0) {
        setPieData(
          data.map((item) => ({
            ...item,
            legendFontColor: "#333",
            legendFontSize: normalize(14),
          }))
        );
      } else {
        setPieData([
          {
            name: "No Data",
            population: 100,
            color: "#ccc",
            legendFontColor: "#333",
            legendFontSize: normalize(14),
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching pie data:", error.message);
      Alert.alert("Error", "Failed to fetch analytics data. Using fallback.");
      setPieData([
        {
          name: "Error",
          population: 100,
          color: "#ccc",
          legendFontColor: "#333",
          legendFontSize: normalize(14),
        },
      ]);
    }
  }, []);

  // Fetch LineChart data
  const fetchLineData = useCallback(async (token) => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/developer/active-users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData}`
        );
      }
      const data = await response.json();
      console.log("Line Data:", data); // Debug log
      if (data && data.labels && data.datasets && data.legend) {
        setLineData({
          labels: data.labels,
          datasets: data.datasets,
          legend: data.legend,
        });
      } else {
        throw new Error("Invalid line data format");
      }
    } catch (error) {
      console.error("Error fetching line data:", error.message);
      Alert.alert(
        "Error",
        "Failed to fetch active users data. Using fallback."
      );
      setLineData({
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            data: [0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 3,
            legend: "No Data",
          },
        ],
        legend: ["No Data"],
      });
    }
  }, []);

  // Fetch society categories
  const fetchCategories = useCallback(async (token) => {
    try {
      const response = await fetch(`http://${ipPort}/api/developer/societies`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData}`
        );
      }
      const data = await response.json();
      console.log("Categories Data:", data); // Debug log
      setCategories(["All Societies", ...data]);
    } catch (error) {
      console.error("Error fetching societies:", error.message);
      Alert.alert(
        "Error",
        "Failed to fetch societies. Using default categories."
      );
      setCategories(["All Societies", "By User Type", "By Fundraiser Status"]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("No token found");
        }
        await Promise.all([
          fetchProfileData(token),
          fetchMetrics(token),
          fetchCategories(token),
          fetchPieData(token, "All Societies"),
          fetchLineData(token),
        ]);
      } catch (error) {
        console.error("Error during initial fetch:", error.message);
        Alert.alert(
          "Error",
          "Failed to load dashboard data. Please log in again."
        );
        setLoading(false);
      }
    };
    fetchData();
  }, [
    fetchProfileData,
    fetchMetrics,
    fetchCategories,
    fetchPieData,
    fetchLineData,
  ]);

  // Update PieChart when category changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (token) {
          await fetchPieData(token, selectedCategory);
        }
      } catch (error) {
        console.error("Error updating pie data:", error.message);
      }
    };
    fetchData();
  }, [selectedCategory, fetchPieData]);

  // Validation functions
  const validateName = (name) => {
    if (!name) return "Name is required";
    if (!nameRegex.test(name))
      return "Name should only contain letters and spaces (2-50 characters)";
    return "";
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) return "Contact number is required";
    if (!phoneRegex.test(phone))
      return "Please enter a valid 11-digit phone number";
    return "";
  };

  const validateDate = (date) => {
    if (!date) return "Date of birth is required";
    if (!dateRegex.test(date)) return "Please enter a valid date (DD/MM/YYYY)";
    return "";
  };

  const validateGender = (gender) => {
    if (!gender) return "Gender is required";
    if (!genderRegex.test(gender))
      return "Gender must be Male, Female, or Other";
    return "";
  };

  // Validate all fields
  const validateAllFields = () => {
    const errors = {
      name: validateName(editableData.name),
      email: validateEmail(editableData.email),
      contact: validatePhone(editableData.contact),
      DOB: validateDate(editableData.DOB),
      Gender: validateGender(editableData.Gender),
    };

    setValidationErrors(errors);
    return Object.values(errors).every((error) => error === "");
  };

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
      console.error("Error fetching profile data:", error.message);
      Alert.alert("Error", "Failed to fetch profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      setImageUri(newImageUri);

      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("Error", "No token found, please log in.");
          return;
        }

        const response = await fetch(
          `http://${ipPort}/api/profiles/profile/picture`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ profilePic: newImageUri }),
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

  const handleUpdateProfile = async () => {
    if (!validateAllFields()) {
      Alert.alert(
        "Validation Error",
        "Please correct the errors in the form before submitting."
      );
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
    setValidationErrors({
      name: "",
      email: "",
      contact: "",
      DOB: "",
      Gender: "",
      Password: "",
    });
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://${ipPort}/api/get-societies`);
        const data = await response.json();
        setNotifications(data);
        const unreadCount = data.filter((notif) => !notif.read).length;
        setUnreadCount(unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        Alert.alert("Error", "Failed to fetch notifications");
      }
    };

    fetchNotifications();
  }, []);

  const handleNotificationPress = async (notification) => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/mark-notification-read/${notification._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedNotifications = notifications.map((notif) =>
          notif._id === notification._id ? { ...notif, read: true } : notif
        );

        setNotifications(updatedNotifications);
        setUnreadCount(unreadCount - 1);
        setSelectedNotification(notification);
      } else {
        console.error("Error marking notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleApprove = async () => {
    try {
      const response = await fetch(`http://${ipPort}/api/register-society`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          society_name: selectedNotification.society_name,
          email: selectedNotification.email,
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Success",
          `${selectedNotification.society_name} has been registered successfully`
        );
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === selectedNotification._id
              ? { ...notif, approved: true }
              : notif
          )
        );
        setUnreadCount(unreadCount - 1);
        setSelectedNotification(null);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        Alert.alert(
          "Error",
          `Failed to register the society: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Network or Server Error:", error);
      Alert.alert(
        "Error",
        "An error occurred while registering the society. Please try again later."
      );
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`http://${ipPort}/api/reject-society`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNotification._id,
          society_name: selectedNotification.society_name,
          address: selectedNotification.address,
          email: selectedNotification.email,
          contact_number: selectedNotification.contact_number,
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Rejected",
          `${selectedNotification.society_name} has been rejected. A rejection email has been sent.`
        );
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== selectedNotification._id)
        );
        setUnreadCount(unreadCount - 1);
        setSelectedNotification(null);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        Alert.alert(
          "Error",
          `Failed to reject the society: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error rejecting society:", error);
      Alert.alert("Error", "An error occurred while rejecting the society.");
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, item.read ? styles.read : styles.unread]}
      onPress={() => handleNotificationPress(item)}
    >
      <Text
        style={[
          styles.notificationText,
          { fontWeight: "bold", color: item.read ? "#F76D57" : "black" },
        ]}
      >
        {item.society_name}
      </Text>
      <Text
        style={[
          styles.notificationText,
          { color: item.read ? "black" : "#666" },
        ]}
      >
        {item.address}
      </Text>
    </TouchableOpacity>
  );

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const handlePieChartPress = (_, index) => {
    setSelectedPieSlice(index === selectedPieSlice ? null : index);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => setProfileSidebarVisible(true)}
          style={styles.profileIcon}
        >
          <Ionicons name="person-circle-outline" size={30} color="#FBBF24" />
        </TouchableOpacity>
        <Text style={styles.title}>Developer Dashboard</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.notificationIcon}
        >
          <Ionicons name="notifications-outline" size={30} color="white" />
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricTitle}>Total Societies</Text>
            <Text style={styles.metricValue}>{totalSocieties}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricTitle}>Total Population</Text>
            <Text style={styles.metricValue}>{totalPopulation}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricTitle}>Total Active Societies</Text>
            <Text style={styles.metricValue}>{totalActiveSocieties}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricTitle}>Total Rejected Societies</Text>
            <Text style={styles.metricValue}>{totalRejectedSocieties}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Analytics Breakdown</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={styles.picker}
          >
            {categories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
          <PieChart
            data={pieData}
            width={width - 32}
            height={240}
            chartConfig={{
              backgroundColor: "#F3F4F6",
              backgroundGradientFrom: "#F3F4F6",
              backgroundGradientTo: "#F3F4F6",
              color: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            onDataPointClick={handlePieChartPress}
          />
          {selectedPieSlice !== null && pieData[selectedPieSlice] && (
            <Text style={styles.chartDetail}>
              {pieData[selectedPieSlice].name}:{" "}
              {pieData[selectedPieSlice].population.toFixed(1)}%
            </Text>
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Monthly Active Users by Society</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={lineData}
              width={Math.max(width - 32, lineData.labels.length * 60)} // Dynamic width based on number of labels
              height={240}
              chartConfig={{
                backgroundColor: "#F3F4F6",
                backgroundGradientFrom: "#F3F4F6",
                backgroundGradientTo: "#F3F4F6",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                style: {
                  borderRadius: 12,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#FBBF24",
                },
                propsForLabels: {
                  fontSize: normalize(10), // Smaller font size for labels
                },
              }}
              bezier
              style={{
                marginVertical: 12,
                borderRadius: 12,
                paddingRight: 20, // Extra padding to prevent cutoff
              }}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              segments={5} // Control number of grid lines
              formatXLabel={(label) => label.substring(0, 3)} // Shorten labels (e.g., "Jan" instead of "January")
            />
          </ScrollView>
        </View>
      </ScrollView>

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
          validationErrors={validationErrors}
          validateName={validateName}
          validateEmail={validateEmail}
          validatePhone={validatePhone}
          validateDate={validateDate}
          validateGender={validateGender}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeIcon}
              >
                <Ionicons name="close" size={24} color="red" />
              </TouchableOpacity>
            </View>
            {selectedNotification ? (
              <NotificationDetails
                notification={selectedNotification}
                handleApprove={handleApprove}
                handleReject={handleReject}
              />
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.flatListContainer}
              />
            )}
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
  validationErrors,
  validateName,
  validateEmail,
  validatePhone,
  validateDate,
  validateGender,
}) {
  return (
    <View style={styles.sidebar}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri:
                  imageUri ||
                  profileData?.profilePic ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.profileImage}
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
            (text) => {
              setEditableData({ ...editableData, name: text });
            },
            validationErrors.name
          )}

          {renderProfileField(
            "calendar",
            "Date of Birth (DD/MM/YYYY)",
            editableData?.DOB,
            isEditing,
            (text) => {
              setEditableData({ ...editableData, DOB: text });
            },
            validationErrors.DOB
          )}

          {renderProfileField(
            "user",
            "Gender (Male/Female/Other)",
            editableData?.Gender,
            isEditing,
            (text) => {
              setEditableData({ ...editableData, Gender: text });
            },
            validationErrors.Gender
          )}

          {renderProfileField(
            "envelope",
            "Email",
            editableData?.email,
            isEditing,
            (text) => {
              setEditableData({ ...editableData, email: text });
            },
            validationErrors.email
          )}

          {renderProfileField(
            "phone",
            "Contact (10 digits)",
            editableData?.contact,
            isEditing,
            (text) => {
              setEditableData({ ...editableData, contact: text });
            },
            validationErrors.contact
          )}

          {renderProfileField(
            "lightbulb-o",
            "Password",
            editableData?.Password,
            isEditing,
            (text) => {
              setEditableData({ ...editableData, Password: text });
            },
            validationErrors.Password,
            true
          )}
        </View>

        <View style={styles.sidebarButtons}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[styles.editbutton, styles.updateButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editbutton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.editbutton, styles.editButton]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.closeSidebar} onPress={onClose}>
        <Ionicons name="close-circle" size={30} color="#135387" />
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
  errorMessage,
  isPassword = false
) {
  return (
    <View style={styles.profileFieldContainer}>
      <View style={styles.detailRow}>
        <FontAwesome name={iconName} size={20} style={styles.icon} />
        {isEditing ? (
          <TextInput
            style={[styles.editInput, errorMessage ? styles.inputError : null]}
            placeholder={label}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={isPassword}
          />
        ) : (
          <View style={styles.textContainer}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.profileText}>
              {isPassword ? "••••••••" : value || "Not Available"}
            </Text>
          </View>
        )}
      </View>
      {isEditing && errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

function NotificationDetails({ notification, handleApprove, handleReject }) {
  return (
    <View style={styles.notificationDetails}>
      <Text style={styles.notificationDetailText}>
        <Text style={styles.detailLabel}>Society Name:</Text>{" "}
        {notification.society_name}
      </Text>
      <Text style={styles.notificationDetailText}>
        <Text style={styles.detailLabel}>Address:</Text> {notification.address}
      </Text>
      <Text style={styles.notificationDetailText}>
        <Text style={styles.detailLabel}>Contact:</Text>{" "}
        {notification.contact_number || "N/A"}
      </Text>
      <Text style={styles.notificationDetailText}>
        <Text style={styles.detailLabel}>Email:</Text>{" "}
        {notification.email || "N/A"}
      </Text>
      <Text style={styles.notificationDetailText}>
        <Text style={styles.detailLabel}>Website:</Text>{" "}
        {notification.website || "N/A"}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleApprove}>
          <View style={[styles.button, { backgroundColor: "green" }]}>
            <Text style={styles.buttonText}>Approve</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReject}>
          <View style={[styles.button, { backgroundColor: "red" }]}>
            <Text style={styles.buttonText}>Reject</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  title: {
    fontSize: normalize(22),
    fontWeight: "bold",
    color: "white",
  },
  profileIcon: {
    padding: 5,
  },
  notificationIcon: {
    padding: 5,
  },
  unreadBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "black",
    fontSize: normalize(12),
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: hp(3),
  },
  metricItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  metricTitle: {
    fontSize: normalize(15),
    color: "#1F2937",
    fontWeight: "600",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "#10B981",
  },
  chartContainer: {
    marginBottom: hp(3),
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  chartTitle: {
    fontSize: normalize(18),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  chartDetail: {
    fontSize: normalize(15),
    color: "#4B5563",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: wp(80),
    maxWidth: 400,
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
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
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
    borderRadius: wp(15),
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
    fontSize: normalize(22),
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: normalize(16),
    color: "#666",
  },
  profileDetails: {
    marginBottom: 20,
  },
  profileFieldContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: normalize(12),
    color: "#666",
    marginBottom: 2,
  },
  profileText: {
    fontSize: normalize(16),
    color: "#333",
  },
  editInput: {
    flex: 1,
    fontSize: normalize(16),
    color: "#333",
    padding: 5,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 5,
  },
  errorText: {
    color: "red",
    fontSize: normalize(12),
    marginTop: 5,
    marginLeft: 35,
  },
  sidebarButtons: {
    marginBottom: 20,
  },
  button: {
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
  },
  editbutton: {
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
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
    fontSize: normalize(16),
    fontWeight: "bold",
  },
  closeSidebar: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 400,
    maxHeight: 600,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    position: "relative",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: normalize(22),
    fontWeight: "bold",
    color: "#F76D57",
  },
  notificationItem: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  unread: {
    backgroundColor: "#ccc4c4",
    borderColor: "#3F0D12",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  read: {
    backgroundColor: "white",
    borderColor: "#3F0D12",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationText: {
    fontSize: normalize(16),
  },
  notificationDetails: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
    borderWidth: 1,
  },
  notificationDetailText: {
    color: "#F76D57",
    fontSize: normalize(16),
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#3F0D12",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 0.48,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    height: 90,
    width: 100,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeIcon: {
    padding: 5,
  },
  flatListContainer: {
    flexGrow: 1,
  },
});

export default SuperAdminDashboard;
