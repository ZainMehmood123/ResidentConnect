"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import MapView, { Marker } from "react-native-maps"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO
import Slider from "@react-native-community/slider"
import * as FileSystem from "expo-file-system"
const { width } = Dimensions.get("window")

const ReportIssueScreen = () => {
  const [issueType, setIssueType] = useState("Electricity")
  const [timeResolutionOption, setTimeResolutionOption] = useState(null)
  const [exactTimeResolution, setExactTimeResolution] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionError, setDescriptionError] = useState("")
  const [images, setImages] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [contactInfo, setContactInfo] = useState("")
  const [contactInfoError, setContactInfoError] = useState("")
  const [mapVisible, setMapVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [sliderDate, setSliderDate] = useState(new Date())
  const [sliderValue, setSliderValue] = useState(0)

  // Regex patterns
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{11}$/
  const descriptionRegex = /^.{10,500}$/ // Between 10 and 500 characters

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission to access location is required!")
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      setLocation(loc.coords)
    }
    getLocation()
  }, [])

  const validateDescription = (text) => {
    setDescription(text)
    if (!descriptionRegex.test(text)) {
      setDescriptionError("Description must be between 10 and 500 characters")
    } else {
      setDescriptionError("")
    }
  }

  const validateContactInfo = (text) => {
    setContactInfo(text)
    if (!emailRegex.test(text) && !phoneRegex.test(text)) {
      setContactInfoError("Please enter a valid email or phone number")
    } else {
      setContactInfoError("")
    }
  }

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      Alert.alert("Permission to access camera roll is required!")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true })

    if (!result.canceled) {
      const newImages = await Promise.all(
        result.assets.map(async (asset) => {
          const fileName = asset.uri.split("/").pop() // Extract filename
          const newPath = `${FileSystem.documentDirectory}${fileName}` // Move to permanent storage

          await FileSystem.moveAsync({
            from: asset.uri,
            to: newPath,
          })

          return newPath // Return new persistent path
        }),
      )

      setImages((prevImages) => [...prevImages, ...newImages]) // Store new paths
    }
  }

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index))
  }

  const handleSliderChange = (value) => {
    const currentDate = new Date()
    const newDate = new Date(currentDate.getTime() + value * 60 * 60 * 1000) // Add hours to current date
    setSliderValue(value)
    setSliderDate(newDate)
    setExactTimeResolution(newDate.toISOString())
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

  const validateForm = () => {
    let isValid = true

    // Validate description
    if (!descriptionRegex.test(description)) {
      setDescriptionError("Description must be between 10 and 500 characters")
      isValid = false
    } else {
      setDescriptionError("")
    }

    // Validate contact info
    if (!emailRegex.test(contactInfo) && !phoneRegex.test(contactInfo)) {
      setContactInfoError("Please enter a valid email or phone number")
      isValid = false
    } else {
      setContactInfoError("")
    }

    return isValid
  }

  const handleSubmitPress = () => {
    if (validateForm()) {
      setConfirmationVisible(true)
    } else {
      Alert.alert("Error", "Please correct the errors in the form before submitting.")
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please correct the errors in the form before submitting.")
      return
    }

    const token = await AsyncStorage.getItem("jwtToken")
    if (!token) {
      Alert.alert("Error", "No token found, please log in.")
      return
    }

    // Decode JWT to get user email
    const decoded = decodeJWT(token)
    const userEmail = decoded.email

    setLoading(true)

    try {
      const formattedLocation = location ? { lat: location.latitude, lng: location.longitude } : null

      const response = await fetch(`http://${ipPort}/api/report/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueType,
          timeResolution: timeResolutionOption === "exact" ? exactTimeResolution : null,
          description,
          images,
          location: formattedLocation,
          contactInfo,
          userEmail,
        }),
      })

      if (response.ok) {
        Alert.alert("Success", "Your issue has been reported successfully.")
        resetForm()
      } else {
        const data = await response.json()
        console.log("API response:", data)
        Alert.alert("Error", data.message || "Failed to report the issue.")
      }
    } catch (error) {
      console.error("Error:", error)
      Alert.alert("Error", "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDescription("")
    setDescriptionError("")
    setImages([])
    setContactInfo("")
    setContactInfoError("")
    setExactTimeResolution("")
    setTimeResolutionOption(null)
    setSliderValue(0)
    setSliderDate(new Date())
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Report an Issue</Text>

        <Text style={styles.label}>Type of Issue:</Text>
        <Picker selectedValue={issueType} onValueChange={(value) => setIssueType(value)} style={styles.picker}>
          <Picker.Item label="Electricity" value="Electricity" />
          <Picker.Item label="Gas Leak" value="Gas Leak" />
          <Picker.Item label="Road Damage" value="Road Damage" />
          <Picker.Item label="Traffic Signal Issue" value="Traffic Signal Issue" />
          <Picker.Item label="Garbage Collection" value="Garbage Collection" />
          <Picker.Item label="Noise Complaint" value="Noise Complaint" />
          <Picker.Item label="Tree Fallen" value="Tree Fallen" />
          <Picker.Item label="Street Light Outage" value="Street Light Outage" />
          <Picker.Item label="Flooding" value="Flooding" />
          <Picker.Item label="Water" value="Water" />
          <Picker.Item label="Plumber" value="Plumber" />
          <Picker.Item label="Internet" value="Internet" />
          <Picker.Item label="Other" value="Other" />
        </Picker>

        <Text style={styles.label}>Expected Resolution Time:</Text>
        <Picker
          selectedValue={timeResolutionOption}
          onValueChange={(value) => setTimeResolutionOption(value)}
          style={styles.picker}
        >
          <Picker.Item label="No Preference" value={null} />
          <Picker.Item label="Specify Exact Time" value="exact" />
        </Picker>

        {timeResolutionOption === "exact" && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Resolution Time: {sliderDate.toLocaleString()}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={48}
              step={1}
              value={sliderValue}
              onValueChange={handleSliderChange}
              minimumTrackTintColor="#FFB000"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#135387"
            />
          </View>
        )}

        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, descriptionError ? styles.inputError : null]}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={validateDescription}
          placeholder="Provide a detailed description of the issue (10-500 characters)."
          placeholderTextColor="#aaa"
        />
        {descriptionError ? <Text style={styles.errorText}>{descriptionError}</Text> : null}

        <Text style={styles.label}>Contact Information:</Text>
        <TextInput
          style={[styles.input, contactInfoError ? styles.inputError : null]}
          value={contactInfo}
          onChangeText={validateContactInfo}
          placeholder="Enter your valid email or phone number."
          placeholderTextColor="#aaa"
          keyboardType="email-address"
        />
        {contactInfoError ? <Text style={styles.errorText}>{contactInfoError}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Upload Images</Text>
        </TouchableOpacity>

        <ScrollView horizontal style={styles.imagePreviewContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                <Text style={styles.removeImageText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {location && (
          <TouchableOpacity onPress={() => setMapVisible(!mapVisible)}>
            <Text style={styles.mapToggleText}>{mapVisible ? "Hide Map" : "Show Location on Map"}</Text>
          </TouchableOpacity>
        )}

        {mapVisible && location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={location} draggable />
          </MapView>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitPress}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={confirmationVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmationVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Submission</Text>
            <Text style={styles.modalText}>Are you sure you want to submit this report?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#FFB000" }]}
                onPress={() => {
                  setConfirmationVisible(false)
                  handleSubmit()
                }}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setConfirmationVisible(false)}
              >
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#135387",
    textShadowColor: "#aaa",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    fontSize: 18,
    marginBottom: 5,
    color: "#135387",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    marginTop: -3,
  },
  button: {
    backgroundColor: "#28A745",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
  },
  imageWrapper: {
    position: "relative",
    marginRight: 10,
  },
  image: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#135387",
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#FFB000",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  picker: {
    height: 55,
    width: "100%",
    marginBottom: 20,
  },
  mapToggleText: {
    color: "#135387",
    textAlign: "center",
    fontSize: 18,
    marginVertical: 10,
  },
  map: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    color: "#135387",
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
})

export default ReportIssueScreen

