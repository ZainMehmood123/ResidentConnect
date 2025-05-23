import { useEffect, useState, useRef } from "react"
import {
  View,
  TextInput,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import Constants from "expo-constants"
import { LinearGradient } from "expo-linear-gradient"

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

// Get screen dimensions
const { width, height } = Dimensions.get("window")

// Create responsive size functions
const wp = (percentage) => {
  return (percentage * width) / 100
}

const hp = (percentage) => {
  return (percentage * height) / 100
}

// Responsive font size
const normalize = (size) => {
  const scale = width / 375 // 375 is standard width
  const newSize = size * scale
  if (Platform.OS === "ios") {
    return Math.round(newSize)
  } else {
    return Math.round(newSize) - 2
  }
}

const ResourceSharingScreen = ({ navigation }) => {
  const [resources, setResources] = useState([])
  const [newResource, setNewResource] = useState({
    item: "",
    description: "",
    status: "Available",
    location: "",
    contact: "",
    image: null,
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchText, setSearchText] = useState("")
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  // Validation states
  const [errors, setErrors] = useState({
    item: "",
    description: "",
    location: "",
    contact: "",
  })

  // Regex patterns for validation
  const nameRegex = /^[a-zA-Z0-9\s\-,.]{3,50}$/
  const descriptionRegex = /^[\w\s.,!?()-]{10,500}$/
  const locationRegex = /^[a-zA-Z0-9\s\-,.#]{5,100}$/
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/

  // Animation states for the floating labels in the form
  const itemLabelAnim = useRef(new Animated.Value(0)).current
  const descriptionLabelAnim = useRef(new Animated.Value(0)).current
  const locationLabelAnim = useRef(new Animated.Value(0)).current
  const contactLabelAnim = useRef(new Animated.Value(0)).current

  // Focus states for input fields
  const [isItemFocused, setIsItemFocused] = useState(false)
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false)
  const [isLocationFocused, setIsLocationFocused] = useState(false)
  const [isContactFocused, setIsContactFocused] = useState(false)

  // Listen for dimension changes
  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get("window"))
    }

    Dimensions.addEventListener("change", updateLayout)

    return () => {
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener("change", updateLayout)
      }
    }
  }, [])

  // Notify all residents when a resource is shared
  const notifyResidents = (resource) => {
    const notificationMessage = `New resource shared: ${resource.item} (${resource.description}) at ${resource.location}`
    setNotifications([...notifications, notificationMessage])
    Alert.alert("Notification", notificationMessage)
  }

  const decodeJWT = (token) => {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    return JSON.parse(jsonPayload)
  }

  const animateLabel = (animation, toValue) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  // Validation functions
  const validateItem = (text) => {
    if (!text.trim()) {
      setErrors((prev) => ({ ...prev, item: "Resource name is required" }))
      return false
    } else if (!nameRegex.test(text)) {
      setErrors((prev) => ({ ...prev, item: "Resource name must be 3-50 characters" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, item: "" }))
      return true
    }
  }

  const validateDescription = (text) => {
    if (!text.trim()) {
      setErrors((prev) => ({ ...prev, description: "Description is required" }))
      return false
    } else if (!descriptionRegex.test(text)) {
      setErrors((prev) => ({ ...prev, description: "Description must be 10-500 characters" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, description: "" }))
      return true
    }
  }

  const validateLocation = (text) => {
    if (!text.trim()) {
      setErrors((prev) => ({ ...prev, location: "Location is required" }))
      return false
    } else if (!locationRegex.test(text)) {
      setErrors((prev) => ({ ...prev, location: "Please enter a valid location (5-100 characters)" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, location: "" }))
      return true
    }
  }

  const validateContact = (text) => {
    if (!text.trim()) {
      setErrors((prev) => ({ ...prev, contact: "Contact information is required" }))
      return false
    } else if (!emailRegex.test(text) && !phoneRegex.test(text)) {
      setErrors((prev) => ({ ...prev, contact: "Please enter a valid email or phone number" }))
      return false
    } else {
      setErrors((prev) => ({ ...prev, contact: "" }))
      return true
    }
  }

  // Handle focus and blur for each input field
  const handleItemFocus = () => {
    animateLabel(itemLabelAnim, 1)
    setIsItemFocused(true)
  }
  const handleItemBlur = () => {
    if (!newResource.item) animateLabel(itemLabelAnim, 0)
    setIsItemFocused(false)
    validateItem(newResource.item)
  }

  const handleDescriptionFocus = () => {
    animateLabel(descriptionLabelAnim, 1)
    setIsDescriptionFocused(true)
  }
  const handleDescriptionBlur = () => {
    if (!newResource.description) animateLabel(descriptionLabelAnim, 0)
    setIsDescriptionFocused(false)
    validateDescription(newResource.description)
  }

  const handleLocationFocus = () => {
    animateLabel(locationLabelAnim, 1)
    setIsLocationFocused(true)
  }
  const handleLocationBlur = () => {
    if (!newResource.location) animateLabel(locationLabelAnim, 0)
    setIsLocationFocused(false)
    validateLocation(newResource.location)
  }

  const handleContactFocus = () => {
    animateLabel(contactLabelAnim, 1)
    setIsContactFocused(true)
  }
  const handleContactBlur = () => {
    if (!newResource.contact) animateLabel(contactLabelAnim, 0)
    setIsContactFocused(false)
    validateContact(newResource.contact)
  }

  const validateForm = () => {
    const isItemValid = validateItem(newResource.item)
    const isDescriptionValid = validateDescription(newResource.description)
    const isLocationValid = validateLocation(newResource.location)
    const isContactValid = validateContact(newResource.contact)

    return isItemValid && isDescriptionValid && isLocationValid && isContactValid
  }

  const handleCreateResource = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please correct the errors in the form.")
      return
    }

    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("jwtToken")
      if (!token) {
        Alert.alert("Error", "No token found, please log in.")
        return
      }

      // Decode JWT to get user email
      const decoded = decodeJWT(token)
      const userEmail = decoded.email // Extracting email from JWT token

      const newListing = {
        id: Date.now().toString(),
        ...newResource,
        userEmail, // Attach the logged-in user's email
      }

      const response = await fetch(`http://${ipPort}/api/resources/sharing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token for authentication
        },
        body: JSON.stringify(newListing),
      })

      const data = await response.json()

      if (response.ok) {
        setResources([...resources, data]) // Update the frontend
        setNewResource({
          item: "",
          description: "",
          status: "Available",
          location: "",
          contact: "",
          image: null,
        })
        setErrors({
          item: "",
          description: "",
          location: "",
          contact: "",
        })
        setShowCreateForm(false)
        notifyResidents(data)
        Alert.alert("Success", "Resource has been successfully added.")
      } else {
        Alert.alert("Error", data.message || "Failed to add resource.")
      }
    } catch (error) {
      console.error("Error creating resource:", error)
      Alert.alert("Error", "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestResource = async (resourceId) => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("jwtToken")

      if (!token) {
        Alert.alert("Error", "No token found, please log in.")
        return
      }

      // Send DELETE request to backend
      const response = await fetch(`http://${ipPort}/api/resources/${resourceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Remove the resource from the UI
        setResources((prevResources) => prevResources.filter((resource) => resource._id !== resourceId))
        Alert.alert("Resource Deleted", "The resource has been successfully removed.")
      } else {
        Alert.alert("Error", data.message || "Failed to delete resource.")
      }
    } catch (error) {
      console.error("Error deleting resource:", error)
      Alert.alert("Error", "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Function to update resource status to 'Shared'
  const handleResourceShared = (resourceId) => {
    const updatedResources = resources.map((resource) =>
      resource.id === resourceId ? { ...resource, status: "Shared" } : resource,
    )

    setResources(updatedResources)
    Alert.alert("Resource Shared", "The resource is now shared with others.")
  }

  // Function to pick an image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setNewResource({ ...newResource, image: result.assets[0].uri })
    }
  }

  const fetchUserResources = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem("jwtToken")
      if (!token) {
        Alert.alert("Error", "No token found, please log in.")
        return
      }

      // Decode JWT token to get the email
      const decoded = decodeJWT(token)
      const userEmail = decoded.email

      // Fetch resources for the logged-in user
      const response = await fetch(`http://${ipPort}/api/resources/user/${userEmail}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Send token for authentication
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResources(data) // Update state with user-specific resources
      } else {
        Alert.alert("Error", data.message || "Failed to fetch resources.")
      }
    } catch (error) {
      console.error("Error fetching user resources:", error)
      Alert.alert("Error", "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserResources()
  }, [])

  // Render item for the resource list
  const renderResource = ({ item }) => (
    <View style={styles.resourceCard}>
      {item.image && <Image source={{ uri: item.image }} style={styles.resourceImage} />}
      <Text style={styles.resourceTitle}>{item.item}</Text>
      <Text style={styles.resourceDescription}>{item.description}</Text>
      <View style={styles.resourceDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color="#135387" />
          <Text style={styles.resourceLocation}>{item.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color="#135387" />
          <Text style={styles.resourceContact}>{item.contact}</Text>
        </View>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.resourceStatus, { color: item.status === "Available" ? "#28A745" : "#FFB000" }]}>
          {item.status}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {item.status === "Available" && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleRequestResource(item._id)}>
            <Ionicons name="trash-outline" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        )}

        {item.status === "Requested" && (
          <TouchableOpacity style={styles.shareButton} onPress={() => handleResourceShared(item._id)}>
            <Ionicons name="checkmark-circle-outline" size={16} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Mark as Shared</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation && navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resource Sharing</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={0.1} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Resource List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#135387" />
            <Text style={styles.loadingText}>Loading resources...</Text>
          </View>
        ) : resources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#135387" />
            <Text style={styles.emptyText}>No resources found</Text>
            <Text style={styles.emptySubText}>Add a new resource to share with others</Text>
          </View>
        ) : (
          <FlatList
            data={resources.filter(
              (resource) => resource.item && resource.item.toLowerCase().includes(searchText.toLowerCase()),
            )}
            renderItem={renderResource}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Add Resource Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateForm(true)}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>

        {/* Modal for creating a resource */}
        <Modal visible={showCreateForm} animationType="slide" transparent={true}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Resource</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowCreateForm(false)}>
                  <Ionicons name="close" size={24} color="#135387" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Resource Name Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text
                    style={{
                      ...styles.label,
                      transform: [
                        {
                          translateY: itemLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [hp(2.5), 0], // Responsive label position
                          }),
                        },
                      ],
                      color: itemLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#aaa", "#000"], // Adjust label color
                      }),
                    }}
                  >
                    Resource Name
                  </Animated.Text>
                  <TextInput
                    style={{
                      ...styles.input,
                      borderColor: errors.item ? "#FF3B30" : isItemFocused ? "#20C997" : "#ccc",
                      borderWidth: 1, // Ensure the border is visible
                    }}
                    value={newResource.item}
                    onChangeText={(text) => {
                      setNewResource({ ...newResource, item: text })
                      if (isItemFocused) validateItem(text)
                    }}
                    placeholder=""
                    onFocus={handleItemFocus}
                    onBlur={handleItemBlur}
                    maxLength={50}
                  />
                  {errors.item ? <Text style={styles.errorText}>{errors.item}</Text> : null}
                </View>

                {/* Description Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text
                    style={{
                      ...styles.label,
                      transform: [
                        {
                          translateY: descriptionLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [hp(2.5), 0], // Responsive label position
                          }),
                        },
                      ],
                      color: descriptionLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#aaa", "#000"], // Adjust label color
                      }),
                    }}
                  >
                    Description
                  </Animated.Text>
                  <TextInput
                    style={{
                      ...styles.input,
                      borderColor: errors.description ? "#FF3B30" : isDescriptionFocused ? "#20C997" : "#ccc",
                      borderWidth: 1, // Ensure the border is visible
                      height: hp(12), // Taller input for description
                      textAlignVertical: "top", // Start text from top
                    }}
                    value={newResource.description}
                    onChangeText={(text) => {
                      setNewResource({ ...newResource, description: text })
                      if (isDescriptionFocused) validateDescription(text)
                    }}
                    placeholder=""
                    multiline={true}
                    numberOfLines={4}
                    onFocus={handleDescriptionFocus}
                    onBlur={handleDescriptionBlur}
                    maxLength={500}
                  />
                  {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
                </View>

                {/* Location Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text
                    style={{
                      ...styles.label,
                      transform: [
                        {
                          translateY: locationLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [hp(2.5), 0], // Responsive label position
                          }),
                        },
                      ],
                      color: locationLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#aaa", "#000"], // Adjust label color
                      }),
                    }}
                  >
                    Location
                  </Animated.Text>
                  <TextInput
                    style={{
                      ...styles.input,
                      borderColor: errors.location ? "#FF3B30" : isLocationFocused ? "#20C997" : "#ccc",
                      borderWidth: 1, // Ensure the border is visible
                    }}
                    value={newResource.location}
                    onChangeText={(text) => {
                      setNewResource({ ...newResource, location: text })
                      if (isLocationFocused) validateLocation(text)
                    }}
                    placeholder=""
                    onFocus={handleLocationFocus}
                    onBlur={handleLocationBlur}
                    maxLength={100}
                  />
                  {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
                </View>

                {/* Contact Input */}
                <View style={styles.inputContainer}>
                  <Animated.Text
                    style={{
                      ...styles.label,
                      transform: [
                        {
                          translateY: contactLabelAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [hp(2.5), 0], // Responsive label position
                          }),
                        },
                      ],
                      color: contactLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["#aaa", "#000"], // Adjust label color
                      }),
                    }}
                  >
                    Contact Info (Email or Phone)
                  </Animated.Text>
                  <TextInput
                    style={{
                      ...styles.input,
                      borderColor: errors.contact ? "#FF3B30" : isContactFocused ? "#20C997" : "#ccc",
                      borderWidth: 1, // Ensure the border is visible
                    }}
                    value={newResource.contact}
                    onChangeText={(text) => {
                      setNewResource({ ...newResource, contact: text })
                      if (isContactFocused) validateContact(text)
                    }}
                    placeholder=""
                    onFocus={handleContactFocus}
                    onBlur={handleContactBlur}
                    keyboardType="email-address"
                  />
                  {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : null}
                </View>

                {/* Image Upload Button */}
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Select Image</Text>
                </TouchableOpacity>

                {/* Image Preview */}
                {newResource.image && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: newResource.image }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setNewResource({ ...newResource, image: null })}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateResource} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Create Resource</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateForm(false)}>
                    <Ionicons name="close-circle-outline" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    paddingTop: Platform.OS === "ios" ? 50 : 15,
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "white",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    margin: 15,
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
    fontSize: normalize(16),
    color: "#333",
  },
  clearSearchButton: {
    padding: 5,
  },
  listContainer: {
    padding: 15,
    paddingTop: 5,
  },
  resourceCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
  },
  resourceTitle: {
    fontSize: normalize(18),
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 5,
  },
  resourceDescription: {
    fontSize: normalize(14),
    color: "#666",
    marginBottom: 10,
    lineHeight: 20,
  },
  resourceDetails: {
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  resourceLocation: {
    fontSize: normalize(14),
    color: "#333",
    marginLeft: 5,
  },
  resourceContact: {
    fontSize: normalize(14),
    color: "#333",
    marginLeft: 5,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  resourceStatus: {
    fontSize: normalize(14),
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    backgroundColor: "#28A745",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: "white",
    fontSize: normalize(14),
    fontWeight: "500",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#135387",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "#135387",
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    position: "relative",
    marginBottom: hp(3.5), // Increased to accommodate error text
    width: "100%",
  },
  label: {
    position: "absolute",
    top: -hp(1.2),
    left: wp(4),
    fontSize: normalize(14),
    color: "#aaa",
    backgroundColor: "#fff",
    paddingHorizontal: wp(1.2),
    zIndex: 1,
  },
  input: {
    width: "100%",
    height: hp(6),
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: wp(4),
    fontSize: normalize(16),
    color: "#000",
    borderWidth: 1,
    borderColor: "#aaa",
    position: "relative",
    zIndex: 0,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: normalize(12),
    marginTop: 5,
    marginLeft: 5,
  },
  imageButton: {
    backgroundColor: "#135387",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 15,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 15,
  },
  actionButtonsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: normalize(16),
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: normalize(18),
    fontWeight: "bold",
    color: "#135387",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
})

export default ResourceSharingScreen

