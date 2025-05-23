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

const DeleteEvent = () => {
  const [eventId, setEventId] = useState("")
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

  const handleDeleteEvent = async () => {
    if (!eventId) {
      Alert.alert("Validation Error", "Event ID is required")
      return
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken")
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.")
        return
      }

      const decoded = decodeJWT(token)
      const email = decoded?.email
      if (!email) {
        Alert.alert("Error", "Invalid token. Please log in again.")
        return
      }

      const response = await fetch(`http://${ipPort}/api/eventsdelete/delete-event`, {
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
        Alert.alert("Event Deleted", `Event ID: ${data.eventId} has been deleted successfully. 🗑️`)
        navigation.navigate("Eventmanagement")
      } else {
        Alert.alert("Error", "Event deletion failed. Please try again. ❌")
      }
    } catch (error) {
      console.error("Error in delete event:", error)
      Alert.alert("Error", "Something went wrong. Please try again later. 😕")
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Delete an Event 🗑️</Text>

        <View style={styles.formContainer}>
          <AnimatedTextInput label="Event ID" icon="fingerprint" value={eventId} onChangeText={setEventId} />

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
            <Text style={styles.buttonText}>Delete Event</Text>
            <Icon name="delete-forever" size={24} color="white" style={styles.buttonIcon} />
          </TouchableOpacity>

          <View style={styles.warningContainer}>
            <Icon name="warning" size={24} color="#FFB000" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Warning: This action cannot be undone. Please make sure you want to delete this event.
            </Text>
          </View>
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
  deleteButton: {
    backgroundColor: "#d9534f",
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderColor: "#FFB000",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: "#856404",
    fontSize: 14,
  },
})

export default DeleteEvent;