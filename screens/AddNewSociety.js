import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native"
import Constants from "expo-constants"

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

const AddNewSociety = ({ navigation }) => {
  const [societyName, setSocietyName] = useState("")
  const [address, setAddress] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  // Focus states for input fields
  const [isSocietyNameFocused, setIsSocietyNameFocused] = useState(false)
  const [isAddressFocused, setIsAddressFocused] = useState(false)
  const [isContactNumberFocused, setIsContactNumberFocused] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isWebsiteFocused, setIsWebsiteFocused] = useState(false)

  // Animation references for labels
  const societyNameLabelAnim = useRef(new Animated.Value(0)).current
  const addressLabelAnim = useRef(new Animated.Value(0)).current
  const contactNumberLabelAnim = useRef(new Animated.Value(0)).current
  const emailLabelAnim = useRef(new Animated.Value(0)).current
  const websiteLabelAnim = useRef(new Animated.Value(0)).current

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

  const animateLabel = (animation, toValue) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }

  const handleFocus = (animation) => animateLabel(animation, 1)
  const handleBlur = (animation, value) => {
    if (!value) animateLabel(animation, 0)
  }

  const handleSubmit = async () => {
    if (societyName && address && contactNumber && email) {
      const societyData = {
        society_name: societyName,
        address,
        contact_number: contactNumber,
        email,
        website,
      }

      const nameRegex = /^[A-Za-z][A-Za-z0-9 -]*$/
      if (!nameRegex.test(societyName)) {
        Alert.alert(
          "Name Error",
          "Society name must start with a letter and can only contain letters, digits, spaces, or hyphens.",
        )
        return
      }

      const addressRegex = /^(?=.*[A-Za-z])[A-Za-z0-9\s.,'-]+$/
      if (!addressRegex.test(address)) {
        Alert.alert("Address Error", "Invalid address format.")
        return
      }

      const contactNoRegex = /^\+?\d{1,15}$/
      if (!contactNoRegex.test(contactNumber)) {
        Alert.alert("Contact Number Error", "Invalid contact number format.")
        return
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(email)) {
        Alert.alert("Email Error", "Invalid email address.")
        return
      }

      try {
        const response = await fetch(`http://${ipPort}/api/add-society`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(societyData),
        })

        if (response.ok) {
          console.log("New Society Registered:", societyData)
          navigation.navigate("LandingPage")
        } else {
          Alert.alert("Error", "Error registering society.")
        }
      } catch (error) {
        console.error("Error submitting form:", error)
        Alert.alert("Error", "Error submitting form.")
      }
    } else {
      Alert.alert("Validation Error", "Please fill in all required fields!")
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Image source={require("../assets/final_logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Register New Society</Text>

            {/* Society Name */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: societyNameLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: societyNameLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Society Name
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isSocietyNameFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={societyName}
                onChangeText={setSocietyName}
                placeholder=""
                onFocus={() => {
                  handleFocus(societyNameLabelAnim)
                  setIsSocietyNameFocused(true)
                }}
                onBlur={() => {
                  handleBlur(societyNameLabelAnim, societyName)
                  setIsSocietyNameFocused(false)
                }}
              />
            </View>

            {/* Address */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: addressLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: addressLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Address
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isAddressFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={address}
                onChangeText={setAddress}
                placeholder=""
                onFocus={() => {
                  handleFocus(addressLabelAnim)
                  setIsAddressFocused(true)
                }}
                onBlur={() => {
                  handleBlur(addressLabelAnim, address)
                  setIsAddressFocused(false)
                }}
              />
            </View>

            {/* Contact Number */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: contactNumberLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: contactNumberLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Contact Number
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isContactNumberFocused ? "#20C997" : "#ccc", 
                  borderWidth: 1, 
                }}
                value={contactNumber}
                onChangeText={setContactNumber}
                placeholder=""
                keyboardType="phone-pad"
                onFocus={() => {
                  handleFocus(contactNumberLabelAnim)
                  setIsContactNumberFocused(true)
                }}
                onBlur={() => {
                  handleBlur(contactNumberLabelAnim, contactNumber)
                  setIsContactNumberFocused(false)
                }}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: emailLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], 
                      }),
                    },
                  ],
                  color: emailLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], 
                  }),
                }}
              >
                Email Address
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isEmailFocused ? "#20C997" : "#ccc", 
                  borderWidth: 1, 
                }}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                keyboardType="email-address"
                onFocus={() => {
                  handleFocus(emailLabelAnim)
                  setIsEmailFocused(true)
                }}
                onBlur={() => {
                  handleBlur(emailLabelAnim, email)
                  setIsEmailFocused(false)
                }}
              />
            </View>

            {/* Website */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: websiteLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], 
                      }),
                    },
                  ],
                  color: websiteLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], 
                  }),
                }}
              >
                Website (Optional)
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isWebsiteFocused ? "#20C997" : "#ccc", 
                  borderWidth: 1, 
                }}
                value={website}
                onChangeText={setWebsite}
                placeholder=""
                onFocus={() => {
                  handleFocus(websiteLabelAnim)
                  setIsWebsiteFocused(true)
                }}
                onBlur={() => {
                  handleBlur(websiteLabelAnim, website)
                  setIsWebsiteFocused(false)
                }}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Register Society</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  logo: {
    width: wp(62),
    height: hp(26),
    marginTop: hp(-5),
    marginBottom: hp(-2),
    backgroundColor: "white",
    borderRadius: 100,
  },
  title: {
    fontSize: normalize(28),
    color: "#135387",
    fontWeight: "bold",
    marginBottom: hp(1),
    textAlign: "center",
  },
  inputContainer: {
    position: "relative",
    marginBottom: hp(2.5),
    width: "100%",
    maxWidth: 500, 
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
  button: {
    width: "100%",
    height: hp(6),
    backgroundColor: "#135387",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp(1.2),
    maxWidth: 500, // Maximum width for larger screens
  },
  buttonText: {
    fontSize: normalize(18),
    color: "white",
    fontWeight: "bold",
  },
})

export default AddNewSociety

