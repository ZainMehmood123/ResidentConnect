import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import IoniconsVectorIcons from "react-native-vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

function ViewVisitorDetails({ navigation }) {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileSidebarVisible, setProfileSidebarVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visitorStats, setVisitorStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    total: 0,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  // Screen dimensions for responsive design
  const { width, height } = Dimensions.get("window");

  // Fetch visitors from the database
  const fetchVisitors = useCallback(async () => {
    try {
      // Determine the endpoint based on statusFilter
      let endpoint = `http://${ipPort}/api/visitor/requests`;
      if (statusFilter !== "all") {
        endpoint = `http://${ipPort}/api/visitor/requests/status/${statusFilter}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setVisitors(data.visitors);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      Alert.alert("Error", "Failed to fetch visitors. Please try again.");
    }
  }, [statusFilter]);

  // Calculate stats when visitors change
  useEffect(() => {
    const stats = {
      approved: visitors.filter((v) => v.status === "approved").length,
      pending: visitors.filter((v) => v.status === "pending").length,
      rejected: visitors.filter((v) => v.status === "rejected").length,
      total: visitors.length,
    };
    setVisitorStats(stats);
  }, [visitors]);

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  // Fetch visitors when component mounts or statusFilter changes
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Filter visitors when search query or sort order changes
  useEffect(() => {
    filterVisitors();
  }, [searchQuery, sortOrder, visitors]);

  // Fetch profile data
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

  // Fetch token and profile data on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        fetchProfileData(token);
      } else {
        Alert.alert("Error", "No token found, please log in.");
        setLoading(false);
      }
    };
    fetchToken();
  }, [fetchProfileData]);

  // Filter visitors based on search query
  const filterVisitors = () => {
    let filtered = [...visitors];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (visitor) =>
          visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visitor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visitor.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visitor.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sort order
    if (sortOrder === "newest") {
      filtered.sort(
        (a, b) => new Date(b.checkInTime) - new Date(a.checkInTime)
      );
    } else if (sortOrder === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.checkInTime) - new Date(b.checkInTime)
      );
    } else if (sortOrder === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredVisitors(filtered);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
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

  // Handle profile picture update
  const handleUpdateProfilePicture = async () => {
    Alert.alert("Feature", "Profile picture update would be implemented here");
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditableData({ ...profileData });
    setIsEditing(false);
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors().then(() => setRefreshing(false));
  };

  // Handle visitor approval
  const handleApproveVisitor = async (visitor) => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/visitor/requests/${visitor._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedVisitors = visitors.map((v) =>
          v._id === visitor._id ? { ...v, status: "approved" } : v
        );
        setVisitors(updatedVisitors);
        setDetailsModalVisible(false);
        setSnackbarMessage(`${visitor.name} has been approved`);
        setSnackbarVisible(true);
      } else {
        throw new Error("Failed to approve visitor");
      }
    } catch (error) {
      console.error("Error approving visitor:", error);
      Alert.alert("Error", "Failed to approve visitor. Please try again.");
    }
  };

  // Handle visitor rejection
  const handleRejectVisitor = async (visitor) => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/visitor/requests/${visitor._id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedVisitors = visitors.map((v) =>
          v._id === visitor._id ? { ...v, status: "rejected" } : v
        );
        setVisitors(updatedVisitors);
        setDetailsModalVisible(false);
        setSnackbarMessage(`${visitor.name} has been rejected`);
        setSnackbarVisible(true);
      } else {
        throw new Error("Failed to reject visitor");
      }
    } catch (error) {
      console.error("Error rejecting visitor:", error);
      Alert.alert("Error", "Failed to reject visitor. Please try again.");
    }
  };

  // Handle visitor deletion
  const handleDeleteVisitor = async () => {
    try {
      const response = await fetch(
        `http://${ipPort}/api/visitor/requests/${selectedVisitor._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedVisitors = visitors.filter(
          (v) => v._id !== selectedVisitor._id
        );
        setVisitors(updatedVisitors);
        setConfirmDeleteModalVisible(false);
        setSnackbarMessage(`${selectedVisitor.name} has been deleted`);
        setSnackbarVisible(true);
      } else {
        throw new Error("Failed to delete visitor");
      }
    } catch (error) {
      console.error("Error deleting visitor:", error);
      Alert.alert("Error", "Failed to delete visitor. Please try again.");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#28A745";
      case "pending":
        return "#FFC107";
      case "rejected":
        return "#DC3545";
      default:
        return "#6C757D";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render visitor card
  const renderVisitorCard = (visitor, index) => {
    const isEven = index % 2 === 0;
    const cardStyle = [
      styles.visitorCard,
      isEven ? styles.visitorCardEven : styles.visitorCardOdd,
      { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
    ];

    return (
      <Animated.View key={visitor._id} style={cardStyle}>
        <TouchableOpacity
          style={styles.visitorCardContent}
          onPress={() => {
            setSelectedVisitor(visitor);
            setDetailsModalVisible(true);
          }}
        >
          <View style={styles.visitorImageContainer}>
            <Image
              source={{
                uri: visitor.photo || "https://via.placeholder.com/150",
              }}
              style={styles.visitorImage}
            />
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(visitor.status) },
              ]}
            />
          </View>
          <View style={styles.visitorInfo}>
            <Text style={styles.visitorName}>{visitor.name}</Text>
            <Text style={styles.visitorDetail}>{visitor.email}</Text>
            <Text style={styles.visitorDetail}>{visitor.phone}</Text>
            <View style={styles.visitorPurposeContainer}>
              <Text style={styles.visitorPurpose}>{visitor.purpose}</Text>
            </View>
          </View>
          <View style={styles.visitorTimeContainer}>
            <Text style={styles.visitorTimeLabel}>Check-in:</Text>
            <Text style={styles.visitorTime}>
              {formatDate(visitor.checkInTime)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setSelectedVisitor(visitor);
              setConfirmDeleteModalVisible(true);
            }}
          >
            <IoniconsVectorIcons
              name="trash-outline"
              size={20}
              color="#DC3545"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.navigate("Side2")}>
          <Ionicons name="menu-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Visitor Management</Text>
        <TouchableOpacity
          onPress={() => setProfileSidebarVisible(true)}
          style={styles.profileIcon}
        >
          <Ionicons name="person-circle-outline" size={30} color="#FFC107" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#135387"]}
          />
        }
      >
        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#28A745" />
            <Text style={styles.statNumber}>{visitorStats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#FFC107" />
            <Text style={styles.statNumber}>{visitorStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={24} color="#DC3545" />
            <Text style={styles.statNumber}>{visitorStats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#135387" />
            <Text style={styles.statNumber}>{visitorStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </Animated.View>

        {/* Search and Filter */}
        <Animated.View
          style={[
            styles.searchFilterContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search visitors..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === "all" && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === "approved" && styles.filterButtonActive,
                statusFilter === "approved" && {
                  backgroundColor: "rgba(40, 167, 69, 0.1)",
                },
              ]}
              onPress={() => setStatusFilter("approved")}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={statusFilter === "approved" ? "#28A745" : "#666"}
                style={styles.filterButtonIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === "approved" && styles.filterButtonTextActive,
                  statusFilter === "approved" && { color: "#28A745" },
                ]}
              >
                Approved
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === "pending" && styles.filterButtonActive,
                statusFilter === "pending" && {
                  backgroundColor: "rgba(255, 193, 7, 0.1)",
                },
              ]}
              onPress={() => setStatusFilter("pending")}
            >
              <Ionicons
                name="time"
                size={16}
                color={statusFilter === "pending" ? "#FFC107" : "#666"}
                style={styles.filterButtonIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === "pending" && styles.filterButtonTextActive,
                  statusFilter === "pending" && { color: "#FFC107" },
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === "rejected" && styles.filterButtonActive,
                statusFilter === "rejected" && {
                  backgroundColor: "rgba(220, 53, 69, 0.1)",
                },
              ]}
              onPress={() => setStatusFilter("rejected")}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={statusFilter === "rejected" ? "#DC3545" : "#666"}
                style={styles.filterButtonIcon}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === "rejected" && styles.filterButtonTextActive,
                  statusFilter === "rejected" && { color: "#DC3545" },
                ]}
              >
                Rejected
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortOrder === "newest" && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder("newest")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === "newest" && styles.sortButtonTextActive,
                ]}
              >
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortOrder === "oldest" && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder("oldest")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === "oldest" && styles.sortButtonTextActive,
                ]}
              >
                Oldest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortOrder === "name" && styles.sortButtonActive,
              ]}
              onPress={() => setSortOrder("name")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOrder === "name" && styles.sortButtonTextActive,
                ]}
              >
                Name
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Visitor List */}
        <View style={styles.visitorListContainer}>
          <Text style={styles.sectionTitle}>
            Visitor List{" "}
            {filteredVisitors.length > 0 ? `(${filteredVisitors.length})` : ""}
          </Text>
          {filteredVisitors.length > 0 ? (
            filteredVisitors.map((visitor, index) =>
              renderVisitorCard(visitor, index)
            )
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="search" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No visitors found</Text>
              <Text style={styles.emptyStateSubText}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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

      {/* Visitor Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#135387" />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.visitorDetailHeader}>
                  <Image
                    source={{
                      uri:
                        selectedVisitor.photo ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.visitorDetailImage}
                  />
                  <View style={styles.visitorDetailHeaderInfo}>
                    <Text style={styles.visitorDetailName}>
                      {selectedVisitor.name}
                    </Text>
                    <View style={styles.visitorDetailStatusContainer}>
                      <Ionicons
                        name={getStatusIcon(selectedVisitor.status)}
                        size={16}
                        color={getStatusColor(selectedVisitor.status)}
                        style={styles.visitorDetailStatusIcon}
                      />
                      <Text
                        style={[
                          styles.visitorDetailStatus,
                          { color: getStatusColor(selectedVisitor.status) },
                        ]}
                      >
                        {selectedVisitor.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.visitorDetailSection}>
                  <Text style={styles.visitorDetailSectionTitle}>
                    Contact Information
                  </Text>
                  <View style={styles.visitorDetailItem}>
                    <Ionicons
                      name="mail"
                      size={20}
                      color="#135387"
                      style={styles.visitorDetailItemIcon}
                    />
                    <View style={styles.visitorDetailItemContent}>
                      <Text style={styles.visitorDetailItemLabel}>Email</Text>
                      <Text style={styles.visitorDetailItemValue}>
                        {selectedVisitor.email}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.visitorDetailItem}>
                    <Ionicons
                      name="call"
                      size={20}
                      color="#135387"
                      style={styles.visitorDetailItemIcon}
                    />
                    <View style={styles.visitorDetailItemContent}>
                      <Text style={styles.visitorDetailItemLabel}>Phone</Text>
                      <Text style={styles.visitorDetailItemValue}>
                        {selectedVisitor.phone}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.visitorDetailSection}>
                  <Text style={styles.visitorDetailSectionTitle}>
                    Visit Information
                  </Text>
                  <View style={styles.visitorDetailItem}>
                    <Ionicons
                      name="briefcase"
                      size={20}
                      color="#135387"
                      style={styles.visitorDetailItemIcon}
                    />
                    <View style={styles.visitorDetailItemContent}>
                      <Text style={styles.visitorDetailItemLabel}>Purpose</Text>
                      <Text style={styles.visitorDetailItemValue}>
                        {selectedVisitor.purpose}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.visitorDetailItem}>
                    <Ionicons
                      name="people"
                      size={20}
                      color="#135387"
                      style={styles.visitorDetailItemIcon}
                    />
                    <View style={styles.visitorDetailItemContent}>
                      <Text style={styles.visitorDetailItemLabel}>
                        Relationship
                      </Text>
                      <Text style={styles.visitorDetailItemValue}>
                        {selectedVisitor.relationship || "N/A"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.visitorDetailItem}>
                    <Ionicons
                      name="time"
                      size={20}
                      color="#135387"
                      style={styles.visitorDetailItemIcon}
                    />
                    <View style={styles.visitorDetailItemContent}>
                      <Text style={styles.visitorDetailItemLabel}>
                        Check-in Time
                      </Text>
                      <Text style={styles.visitorDetailItemValue}>
                        {formatDate(selectedVisitor.checkInTime)}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedVisitor.status === "pending" && (
                  <View style={styles.visitorDetailActions}>
                    <TouchableOpacity
                      style={[
                        styles.visitorDetailActionButton,
                        styles.approveButton,
                      ]}
                      onPress={() => handleApproveVisitor(selectedVisitor)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color="#fff"
                        style={styles.visitorDetailActionButtonIcon}
                      />
                      <Text style={styles.visitorDetailActionButtonText}>
                        Approve
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.visitorDetailActionButton,
                        styles.rejectButton,
                      ]}
                      onPress={() => handleRejectVisitor(selectedVisitor)}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color="#fff"
                        style={styles.visitorDetailActionButtonIcon}
                      />
                      <Text style={styles.visitorDetailActionButtonText}>
                        Reject
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        visible={confirmDeleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setConfirmDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="warning" size={40} color="#DC3545" />
              <Text style={styles.confirmModalTitle}>Confirm Deletion</Text>
            </View>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete {selectedVisitor?.name}'s visitor
              record? This action cannot be undone.
            </Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setConfirmDeleteModalVisible(false)}
              >
                <Text style={styles.confirmModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.deleteButton]}
                onPress={handleDeleteVisitor}
              >
                <Text style={styles.confirmModalButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
      {snackbarVisible && (
        <Animated.View
          style={[
            styles.snackbar,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          <TouchableOpacity onPress={() => setSnackbarVisible(false)}>
            <Text style={styles.snackbarAction}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// Profile Sidebar Component
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
            (text) => setEditableData({ ...editableData, name: text })
          )}
          {renderProfileField(
            "calendar",
            "Date of Birth",
            editableData?.DOB,
            isEditing,
            (text) => setEditableData({ ...editableData, DOB: text })
          )}
          {renderProfileField(
            "user",
            "Gender",
            editableData?.Gender,
            isEditing,
            (text) => setEditableData({ ...editableData, Gender: text })
          )}
          {renderProfileField(
            "envelope",
            "Email",
            editableData?.email,
            isEditing,
            (text) => setEditableData({ ...editableData, email: text })
          )}
          {renderProfileField(
            "phone",
            "Contact",
            editableData?.contact,
            isEditing,
            (text) => setEditableData({ ...editableData, contact: text })
          )}
          {renderProfileField(
            "lightbulb-o",
            "Skills",
            editableData?.Password,
            isEditing,
            (text) => setEditableData({ ...editableData, Password: text })
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

// Helper function to render profile fields
function renderProfileField(iconName, label, value, isEditing, onChangeText) {
  return (
    <View style={styles.detailRow}>
      <FontAwesome name={iconName} size={20} style={styles.icon} />
      {isEditing ? (
        <TextInput
          style={styles.editInput}
          placeholder={label}
          value={value}
          onChangeText={onChangeText}
        />
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.profileText}>{value || "Not Available"}</Text>
        </View>
      )}
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
    paddingTop: Platform.OS === "ios" ? 50 : 15,
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 5,
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  searchFilterContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  clearSearchButton: {
    padding: 5,
  },
  filterScrollView: {
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: "rgba(19, 83, 135, 0.1)",
  },
  filterButtonIcon: {
    marginRight: 5,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#135387",
    fontWeight: "bold",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  sortButton: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortButtonActive: {
    backgroundColor: "rgba(19, 83, 135, 0.1)",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
  },
  sortButtonTextActive: {
    color: "#135387",
    fontWeight: "bold",
  },
  visitorListContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#135387",
  },
  visitorCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  visitorCardEven: {
    borderLeftWidth: 5,
    borderLeftColor: "#135387",
  },
  visitorCardOdd: {
    borderLeftWidth: 5,
    borderLeftColor: "#1E88E5",
  },
  visitorCardContent: {
    flexDirection: "row",
    padding: 15,
  },
  visitorImageContainer: {
    position: "relative",
    marginRight: 15,
  },
  visitorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 15,
    height: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "white",
  },
  visitorInfo: {
    flex: 1,
    justifyContent: "center",
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  visitorDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  visitorPurposeContainer: {
    backgroundColor: "rgba(19, 83, 135, 0.1)",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  visitorPurpose: {
    fontSize: 12,
    color: "#135387",
  },
  visitorTimeContainer: {
    justifyContent: "center",
    marginRight: 10,
  },
  visitorTimeLabel: {
    fontSize: 12,
    color: "#666",
  },
  visitorTime: {
    fontSize: 12,
    color: "#333",
    marginBottom: 5,
  },
  deleteButton: {
    justifyContent: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 10,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#135387",
  },
  modalCloseButton: {
    padding: 5,
  },
  modalContent: {
    padding: 15,
  },
  visitorDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  visitorDetailImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  visitorDetailHeaderInfo: {
    flex: 1,
  },
  visitorDetailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  visitorDetailStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  visitorDetailStatusIcon: {
    marginRight: 5,
  },
  visitorDetailStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  visitorDetailSection: {
    marginBottom: 20,
  },
  visitorDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  visitorDetailItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  visitorDetailItemIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  visitorDetailItemContent: {
    flex: 1,
  },
  visitorDetailItemLabel: {
    fontSize: 12,
    color: "#666",
  },
  visitorDetailItemValue: {
    fontSize: 16,
    color: "#333",
  },
  visitorDetailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  visitorDetailActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flex: 1,
    marginHorizontal: 8,
  },
  approveButton: {
    backgroundColor: "#28A745",
  },
  rejectButton: {
    backgroundColor: "#DC3545",
  },
  visitorDetailActionButtonIcon: {
    marginRight: 5,
  },
  visitorDetailActionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  confirmModalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmModalHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#DC3545",
    marginTop: 10,
  },
  confirmModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#6C757D",
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  confirmModalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  snackbar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  snackbarText: {
    color: "white",
    flex: 1,
  },
  snackbarAction: {
    color: "#FFC107",
    fontWeight: "bold",
    marginLeft: 10,
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
});

export default ViewVisitorDetails;
