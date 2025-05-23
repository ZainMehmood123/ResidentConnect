import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import Constants from "expo-constants"

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

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

export default function Signup({ navigation }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [residentcode, setResidentCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [dimensions, setDimensions] = useState(Dimensions.get("window"))

  // Focus states for input fields
  const [isFirstNameFocused, setIsFirstNameFocused] = useState(false)
  const [isLastNameFocused, setIsLastNameFocused] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isResidentCodeFocused, setIsResidentCodeFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)

  // Animation states for the floating labels
  const firstNameLabelAnim = useRef(new Animated.Value(0)).current
  const lastNameLabelAnim = useRef(new Animated.Value(0)).current
  const emailLabelAnim = useRef(new Animated.Value(0)).current
  const residentCodeLabelAnim = useRef(new Animated.Value(0)).current
  const passwordLabelAnim = useRef(new Animated.Value(0)).current
  const confirmPasswordLabelAnim = useRef(new Animated.Value(0)).current

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

  // Handle focus and blur for each input field
  const handleFirstNameFocus = () => animateLabel(firstNameLabelAnim, 1)
  const handleFirstNameBlur = () => {
    if (!firstName) animateLabel(firstNameLabelAnim, 0)
  }

  const handleLastNameFocus = () => animateLabel(lastNameLabelAnim, 1)
  const handleLastNameBlur = () => {
    if (!lastName) animateLabel(lastNameLabelAnim, 0)
  }

  const handleEmailFocus = () => animateLabel(emailLabelAnim, 1)
  const handleEmailBlur = () => {
    if (!email) animateLabel(emailLabelAnim, 0)
  }

  const handleResidentCodeFocus = () => animateLabel(residentCodeLabelAnim, 1)
  const handleResidentCodeBlur = () => {
    if (!residentcode) animateLabel(residentCodeLabelAnim, 0)
  }

  const handlePasswordFocus = () => animateLabel(passwordLabelAnim, 1)
  const handlePasswordBlur = () => {
    if (!password) animateLabel(passwordLabelAnim, 0)
  }

  const handleConfirmPasswordFocus = () => animateLabel(confirmPasswordLabelAnim, 1)
  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) animateLabel(confirmPasswordLabelAnim, 0)
  }

  // Input validation and signup logic
  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !residentcode || !password || !confirmPassword) {
      Alert.alert("Input Error", "Please fill in all fields.")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.")
      return
    }

    const nameRegex = /^[A-Za-z\s]+$/ // Matches first name and last name (letters and spaces only)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/

    // Validate name (first and last name)
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      Alert.alert("Input Error", "Names can only contain letters and spaces.")
      return
    }

    // Validate email
    if (!emailRegex.test(email)) {
      Alert.alert("Input Error", "Please enter a valid email address.")
      return
    }

    // Validate password
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Input Error",
        "Password must be at least 8 characters long and contain uppercase, lowercase, a digit, and a special character.",
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`http://${ipPort}/api/signup/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, residentcode, password }),
      })

      const result = await response.json()
      if (response.ok) {
        navigation.navigate("ResidentLogin")
      } else {
        Alert.alert("Signup Failed", result.message || "An error occurred")
      }
    } catch (error) {
      Alert.alert("Signup Failed", "Unable to connect to the server. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Image source={require("../assets/final_logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Sign Up</Text>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: firstNameLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: firstNameLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                First Name
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isFirstNameFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={firstName}
                onChangeText={setFirstName}
                placeholder=""
                onFocus={() => {
                  handleFirstNameFocus()
                  setIsFirstNameFocused(true)
                }}
                onBlur={() => {
                  handleFirstNameBlur()
                  setIsFirstNameFocused(false)
                }}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: lastNameLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: lastNameLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Last Name
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isLastNameFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={lastName}
                onChangeText={setLastName}
                placeholder=""
                onFocus={() => {
                  handleLastNameFocus()
                  setIsLastNameFocused(true)
                }}
                onBlur={() => {
                  handleLastNameBlur()
                  setIsLastNameFocused(false)
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
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: emailLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Email
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isEmailFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => {
                  handleEmailFocus()
                  setIsEmailFocused(true)
                }}
                onBlur={() => {
                  handleEmailBlur()
                  setIsEmailFocused(false)
                }}
              />
            </View>

            {/* Resident Code */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: residentCodeLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: residentCodeLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Resident Code
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isResidentCodeFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={residentcode}
                onChangeText={setResidentCode}
                placeholder=""
                onFocus={() => {
                  handleResidentCodeFocus()
                  setIsResidentCodeFocused(true)
                }}
                onBlur={() => {
                  handleResidentCodeBlur()
                  setIsResidentCodeFocused(false)
                }}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: passwordLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: passwordLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Password
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isPasswordFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry={!showPassword}
                onFocus={() => {
                  handlePasswordFocus()
                  setIsPasswordFocused(true)
                }}
                onBlur={() => {
                  handlePasswordBlur()
                  setIsPasswordFocused(false)
                }}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? "visibility" : "visibility-off"} size={normalize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: confirmPasswordLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: confirmPasswordLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Confirm Password
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isConfirmPasswordFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder=""
                secureTextEntry={!showConfirmPassword}
                onFocus={() => {
                  handleConfirmPasswordFocus()
                  setIsConfirmPasswordFocused(true)
                }}
                onBlur={() => {
                  handleConfirmPasswordBlur()
                  setIsConfirmPasswordFocused(false)
                }}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon name={showConfirmPassword ? "visibility" : "visibility-off"} size={normalize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Signup Button */}
            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Link to Resident Login */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("ResidentLogin")}>
                <Text style={styles.signupLink}>Login</Text>
              </TouchableOpacity>
            </View>
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
    maxWidth: 500, // Maximum width for larger screens
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
  signupContainer: {
    flexDirection: "row",
    marginTop: hp(2.5),
    flexWrap: "wrap",
    justifyContent: "center",
  },
  signupText: {
    fontSize: normalize(14),
    color: "#807d7d",
  },
  signupLink: {
    fontSize: normalize(14),
    color: "#28A745",
    fontWeight: "bold",
    marginLeft: wp(1.2),
  },
  eyeIcon: {
    position: "absolute",
    right: wp(4),
    top: "30%",
    zIndex: 1,
  },
})

