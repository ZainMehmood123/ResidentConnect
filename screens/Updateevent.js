"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { useNavigation } from "@react-navigation/native"

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

const AnimatedTextInput = ({ label, icon, value, onChangeText, multiline = false, ...props }) => {
  const [isFocused, setIsFocused] = useState(false)
  const animatedIsFocused = useRef(new Animated.Value(value === "" ? 0 : 1)).current

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value !== "" ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [isFocused, value, animatedIsFocused])

  const labelStyle = {
    position: "absolute",
    left: 40,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 30 : 17, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ["#999", "#135387"],
    }),
    backgroundColor: "white",
    paddingHorizontal: 4,
  }

  return (
    <View style={[styles.inputContainer, multiline && styles.multilineInputContainer]}>
      <Icon name={icon} size={24} color="#135387" style={styles.inputIcon} />
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        {...props}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  )
}

const UpdateEvent = () => {
  const [eventId, setEventId] = useState("")
  const [eventName, setEventName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const navigation = useNavigation()

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  const handleUpdateEvent = async () => {
    if (!eventId || !eventName || !eventDescription || !eventDate || !eventTime || !eventLocation) {
      Alert.alert("Validation Error", "All fields are required 🚫")
      return
    }

    const eventNameRegex = /^[A-Za-z\s]+$/
    const eventDescriptionRegex = /^.{10,500}$/
    const eventDateRegex = /^\d{4}-\d{2}-\d{2}$/
    const eventTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    const eventLocationRegex = /^[A-Za-z0-9\s,.'-]+$/

    if (!eventNameRegex.test(eventName)) {
      Alert.alert("Validation Error", "Event name must contain only letters and spaces 🔤")
      return
    }

    if (!eventDescriptionRegex.test(eventDescription)) {
      Alert.alert("Validation Error", "Event description must be between 10 and 500 characters 📝")
      return
    }

    if (!eventDateRegex.test(eventDate)) {
      Alert.alert("Validation Error", "Event date must be in the format YYYY-MM-DD 📅")
      return
    }

    if (!eventTimeRegex.test(eventTime)) {
      Alert.alert("Validation Error", "Event time must be in the format HH:MM ⏰")
      return
    }

    if (!eventLocationRegex.test(eventLocation)) {
      Alert.alert("Validation Error", "Event location can contain letters, numbers, and common punctuation 📍")
      return
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken")
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again. 🔒")
        return
      }

      const decoded = decodeJWT(token)
      const email = decoded?.email
      if (!email) {
        Alert.alert("Error", "Invalid token. Please log in again. 🔑")
        return
      }

      const response = await fetch(`http://${ipPort}/api/updateevents/update-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          eventName,
          eventDescription,
          eventDate,
          eventTime,
          eventLocation,
          userEmail: email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        Alert.alert(
          "Event Updated",
          `Event Name: ${data.updatedEvent.name}\nEvent ID: ${data.updatedEvent.id} has been updated successfully. 🎉`,
        )
        navigation.navigate("Eventmanagement")
      } else {
        Alert.alert("Error", "Event update failed. Please try again. ❌")
      }
    } catch (error) {
      console.error("Error in update event:", error)
      Alert.alert("Error", "Something went wrong. Please try again later. 😕")
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Update an Event 🔄</Text>

        <View style={styles.formContainer}>
          <AnimatedTextInput label="Event ID" icon="fingerprint" value={eventId} onChangeText={setEventId} />

          <AnimatedTextInput label="Event Name" icon="event" value={eventName} onChangeText={setEventName} />

          <AnimatedTextInput
            label="Event Description"
            icon="description"
            value={eventDescription}
            onChangeText={setEventDescription}
            multiline
            numberOfLines={4}
          />

          <AnimatedTextInput
            label="Event Date (YYYY-MM-DD)"
            icon="date-range"
            value={eventDate}
            onChangeText={setEventDate}
          />

          <AnimatedTextInput
            label="Event Time (HH:MM)"
            icon="access-time"
            value={eventTime}
            onChangeText={setEventTime}
          />

          <AnimatedTextInput
            label="Event Location"
            icon="location-on"
            value={eventLocation}
            onChangeText={setEventLocation}
          />

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateEvent}>
            <Text style={styles.buttonText}>Update Event</Text>
            <Icon name="edit" size={24} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.stickerContainer}>
          <Image source={{ uri: "https://example.com/update-sticker.png" }} style={styles.sticker} />
          <Text style={styles.stickerText}>Make it even better! 🚀</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#135387",
    textAlign: "center",
    marginBottom: 30,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderColor: "#28A745",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "white",
    height: 60,
  },
  multilineInputContainer: {
    height: 120,
    alignItems: "flex-start",
  },
  inputIcon: {
    padding: 10,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
    paddingTop: 10,
  },
  textArea: {
    height: 100,
    paddingTop: 25,
  },
  updateButton: {
    backgroundColor: "#135387",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  stickerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  sticker: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  stickerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#135387",
    marginTop: 10,
  },
})

export default UpdateEvent

