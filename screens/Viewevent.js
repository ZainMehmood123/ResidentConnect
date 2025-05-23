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
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { useNavigation } from "@react-navigation/native"

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

const AnimatedTextInput = ({ label, icon, value, onChangeText, ...props }) => {
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
      outputRange: [17, -8],
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
    <View style={styles.inputContainer}>
      <Icon name={icon} size={24} color="#135387" style={styles.inputIcon} />
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        {...props}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  )
}

const ViewEvent = () => {
  const [eventId, setEventId] = useState("")
  const [eventDetails, setEventDetails] = useState(null)
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

  const handleViewEvent = async () => {
    if (!eventId) {
      Alert.alert("Validation Error", "Event ID is required 🚫")
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

      const response = await fetch(`http://${ipPort}/api/viewevents/view-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          userEmail: email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEventDetails(data.event)
        Alert.alert("Event Details", `Event ID: ${data.event.id} has been fetched successfully. 🎉`)
      } else {
        Alert.alert("Error", "Event not found. Please check the Event ID. 🔍")
      }
    } catch (error) {
      console.error("Error in view event:", error)
      Alert.alert("Error", "Something went wrong. Please try again later. 😕")
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>View Event 👀</Text>

        <View style={styles.formContainer}>
          <AnimatedTextInput label="Event ID" icon="fingerprint" value={eventId} onChangeText={setEventId} />

          <TouchableOpacity style={styles.viewButton} onPress={handleViewEvent}>
            <Text style={styles.buttonText}>View Event</Text>
            <Icon name="visibility" size={24} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>

          {eventDetails && (
            <View style={styles.eventDetails}>
              <Text style={styles.eventTitle}>📅 Event Details</Text>
              <View style={styles.eventItem}>
                <Icon name="event" size={20} color="#135387" />
                <Text style={styles.eventText}>
                  <Text style={styles.bold}>Name:</Text> {eventDetails.name}
                </Text>
              </View>
              <View style={styles.eventItem}>
                <Icon name="description" size={20} color="#135387" />
                <Text style={styles.eventText}>
                  <Text style={styles.bold}>Description:</Text> {eventDetails.description}
                </Text>
              </View>
              <View style={styles.eventItem}>
                <Icon name="date-range" size={20} color="#135387" />
                <Text style={styles.eventText}>
                  <Text style={styles.bold}>Date:</Text> {eventDetails.date}
                </Text>
              </View>
              <View style={styles.eventItem}>
                <Icon name="access-time" size={20} color="#135387" />
                <Text style={styles.eventText}>
                  <Text style={styles.bold}>Time:</Text> {eventDetails.time}
                </Text>
              </View>
              <View style={styles.eventItem}>
                <Icon name="location-on" size={20} color="#135387" />
                <Text style={styles.eventText}>
                  <Text style={styles.bold}>Location:</Text> {eventDetails.location}
                </Text>
              </View>
            </View>
          )}
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
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
    paddingTop: 10,
  },
  viewButton: {
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
  eventDetails: {
    marginTop: 20,
    backgroundColor: "#F2E9E1",
    padding: 15,
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 10,
    textAlign: "center",
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  eventText: {
    fontSize: 16,
    color: "#3F0D12",
    marginLeft: 10,
    flex: 1,
  },
  bold: {
    fontWeight: "bold",
  },
})

export default ViewEvent;