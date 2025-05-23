import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get screen dimensions
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
  const scale = width / 375; // 375 is standard width
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 2;
  }
};

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

export default function ResidentLogin({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const [newshowPassword, newsetShowPassword] = useState(false);
  const [confirmshowPassword, confirmsetShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animation states for the floating labels
  const usernameLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false); // Track if the reset link was sent
  const [registeredEmail, setRegisteredEmail] = useState("");
  const otpemailLabelAnim = useRef(new Animated.Value(0)).current;
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false); // Define modal visibility state
  const [isPasswordSectionVisible, setIsPasswordSectionVisible] =
    useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const otpnewpassLabelAnim = useRef(new Animated.Value(0)).current;
  const otpconfirmpassLabelAnim = useRef(new Animated.Value(0)).current;
  const [timer, setTimer] = useState(60); // 1-minute timer
  const [otp1, setOtp1] = useState("");
  const [otp2, setOtp2] = useState("");
  const [otp3, setOtp3] = useState("");
  const [otp4, setOtp4] = useState("");

  // Listen for dimension changes
  useEffect(() => {
    const updateLayout = () => {
      // This will trigger a re-render with new dimensions
      setDimensions(Dimensions.get('window'));
    };

    Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      // Clean up event listener
      // Note: In newer React Native versions, this cleanup might be different
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    let interval;
    if (isVerificationSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval); // Cleanup interval on component unmount or timer reset
  }, [isVerificationSent, timer]);
  
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };
  
  const resetTimer = () => {
    setTimer(60); // Reset timer to 60 sec
  };

  const handleForgotPassword = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(registeredEmail)) {
      Alert.alert("Email Error", "Please enter a valid email address.");
      return;
    }
    if (!registeredEmail) {
      Alert.alert("Please fill in a required field.!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://${ipPort}/api/otp/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await response.json();
      console.log("Dtaa:", data);
      if (response.ok) {
        console.log(data.message); // Success message
        setIsVerificationSent(true); // Move to the verification section
      } else {
        console.error(data.error); // Error message
        alert("Failed to send OTP: " + data.error);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    // Concatenate the OTP from the input fields
    const userEnteredOtp = otp1 + otp2 + otp3 + otp4;

    // Call the verify OTP function with the concatenated OTP
    setLoading(true);
    if (userEnteredOtp.length === 4) {
      try {
        const response = await fetch(
          `http://${ipPort}/api/otpveri/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: registeredEmail,
              otp: userEnteredOtp,
            }),
          }
        );
        console.log("OTP:", userEnteredOtp);

        const data = await response.json();

        if (response.ok) {
          console.log(data.message); // Success message
          setIsPasswordSectionVisible(true); // Show the password section
        } else {
          console.error(data.error); // Error message
          alert("Failed to verify OTP: " + data.error);
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        alert("An error occurred while verifying OTP.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      alert("Please enter a valid 4-digit OTP");
    }
  };

  const handleBackToEmail = () => {
    setIsVerificationSent(false); // Go back to email section
  };

  const animateLabel = (animation, toValue) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleUsernameFocus = () => animateLabel(usernameLabelAnim, 1);
  const handleUsernameBlur = () => {
    if (!username) animateLabel(usernameLabelAnim, 0);
  };

  const handlePasswordFocus = () => animateLabel(passwordLabelAnim, 1);
  const handlePasswordBlur = () => {
    if (!password) animateLabel(passwordLabelAnim, 0);
  };

  const handleNewPasswordFocus = () => animateLabel(otpnewpassLabelAnim, 1);
  const handleNewPasswordBlur = () => {
    if (!newPassword) animateLabel(otpnewpassLabelAnim, 0);
  };

  const handleConfirmPasswordFocus = () =>
    animateLabel(otpconfirmpassLabelAnim, 1);
  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) animateLabel(otpconfirmpassLabelAnim, 0);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Input Error", "Please enter both username and password.");
      return;
    }

    const requestBody = {
      username,
      password,
    };
    setLoading(true);

    try {
      console.log("Data sent to backend:", requestBody);

      const response = await fetch(`http://${ipPort}/api/residentlogin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (response.ok && data.success) {
        Alert.alert("Login Successful", `Welcome, ${data.username || "User"}!`);

        // Store the token securely in AsyncStorage
        await AsyncStorage.setItem("jwtToken", data.token);
        console.log(data.token);

        // Navigate to Dashboard or any authenticated screen
        navigation.navigate("DashboardScreen");
      } else {
        Alert.alert(
          "Login Failed",
          data.message || "Invalid username or password"
        );
      }
    } catch (error) {
      console.error("Frontend error:", error);
      Alert.alert("Login Failed", "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPassword = async () => {
    if (newPassword === confirmPassword) {
      console.log(registeredEmail, newPassword);
      try {
        // Call API to save new password for the user based on email (you should get email from OTP)
        const response = await fetch(
          `http://${ipPort}/api/residentreset/residentupdate-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: registeredEmail, // The email from the OTP flow
              newPassword: newPassword, // The new password entered by the user
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log("Password successfully updated");
          alert(data.message);
          setIsVerificationSent(true);
          setIsForgotPasswordModalVisible(false); // Close the modal after saving
        } else {
          alert(data.message); // Show error message from the backend
        }
      } catch (error) {
        console.error("Error updating password:", error);
        alert("Error updating password. Please try again later.");
      }
    } else {
      alert("Passwords do not match");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              source={require("../assets/final_logo.png")} // Ensure this path is correct
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Resident Login</Text>

            {/* Username Field */}
            <View style={styles.inputContainer}>
              <Animated.Text
                style={{
                  ...styles.label,
                  transform: [
                    {
                      translateY: usernameLabelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [hp(2.5), 0], // Responsive label position
                      }),
                    },
                  ],
                  color: usernameLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#aaa", "#000"], // Adjust label color
                  }),
                }}
              >
                Username
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isUsernameFocused ? "#20C997" : "#ccc", // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={username}
                onChangeText={setUsername}
                placeholder=""
                onFocus={() => {
                  handleUsernameFocus();
                  setIsUsernameFocused(true); // Set focus state
                }}
                onBlur={() => {
                  handleUsernameBlur();
                  setIsUsernameFocused(false); // Reset focus state
                }}
              />
            </View>

            {/* Password Field */}
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
                secureTextEntry={!showPassword} // Toggle visibility based on state
                onFocus={() => {
                  handlePasswordFocus();
                  setIsPasswordFocused(true); // Set focus state
                }}
                onBlur={() => {
                  handlePasswordBlur();
                  setIsPasswordFocused(false); // Reset focus state
                }}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)} // Toggle password visibility
              >
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={normalize(20)}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            {/* Button to trigger the Forgot Password modal */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => setIsForgotPasswordModalVisible(true)}
            >
              <Text style={styles.forgotPasswordButtonText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Modal for Forgot Password */}
            <Modal
              visible={isForgotPasswordModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIsForgotPasswordModalVisible(false)}
            >
              <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    {isPasswordSectionVisible
                      ? "Reset Your Password"
                      : isVerificationSent
                      ? "Enter Verification Code"
                      : "Forgot Password"}
                  </Text>

                  {/* Cross Icon for Verification and Create New Password Sections */}
                  {(isPasswordSectionVisible || isVerificationSent) && (
                    <TouchableOpacity
                      style={styles.closeIcon}
                      onPress={() => setIsForgotPasswordModalVisible(false)}
                    >
                      <Text style={styles.closeIconText}>X</Text>
                    </TouchableOpacity>
                  )}

                  {/* Conditional rendering based on the verification state */}
                  {!isPasswordSectionVisible ? (
                    !isVerificationSent ? (
                      // Forgot Password Section (Email Input)
                      <View style={styles.inputContainer}>
                        <Animated.Text
                          style={{
                            ...styles.label,
                            transform: [
                              {
                                translateY: otpemailLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [hp(2.5), 0], // Responsive label position
                                }),
                              },
                            ],
                            color: otpemailLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"], // Adjust label color
                            }),
                          }}
                        >
                          Email
                        </Animated.Text>
                        <TextInput
                          style={styles.input}
                          value={registeredEmail}
                          onChangeText={setRegisteredEmail}
                          placeholder="" // Keep placeholder empty for animated label
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => otpemailLabelAnim.setValue(1)} // Trigger animation on focus
                          onBlur={() => otpemailLabelAnim.setValue(0)} // Reset animation on blur
                        />
                        <TouchableOpacity
                          style={styles.generateButton}
                          onPress={handleForgotPassword}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.generateButtonText}>Send OTP</Text>
                          )}
                        </TouchableOpacity>

                        {/* Close Button for Forgot Password Section */}
                        <TouchableOpacity
                          style={styles.closeModalButton}
                          onPress={() => setIsForgotPasswordModalVisible(false)}
                        >
                          <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      // Verification Section (After clicking "Send Reset Link")
                      <View style={styles.verificationContainer}>
                        <Text style={styles.verificationText}>
                          Enter the verification code sent to your email
                        </Text>

                        {/* Timer Display */}
                        {timer > 0 ? (
                          <Text style={styles.timerText}>
                            Time left: {formatTimer()}
                          </Text>
                        ) : (
                          <Text style={styles.timerTextExpired}>
                            OTP expired. Please request a new code.
                          </Text>
                        )}

                        <View style={styles.verificationCodeContainer}>
                          <TextInput
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp1}
                            onChangeText={(text) => setOtp1(text)} // Update otp1 state
                          />
                          <TextInput
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp2}
                            onChangeText={(text) => setOtp2(text)} // Update otp2 state
                          />
                          <TextInput
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp3}
                            onChangeText={(text) => setOtp3(text)} // Update otp3 state
                          />
                          <TextInput
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp4}
                            onChangeText={(text) => setOtp4(text)} // Update otp4 state
                          />
                        </View>

                        {timer === 0 ? (
                          <Text
                            style={styles.resendText}
                            onPress={() => {
                              handleBackToEmail();
                              resetTimer();
                            }}
                          >
                            Didn't receive a code? Back
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          style={styles.sendButton}
                          onPress={handleVerifyOtp} // Call handleVerifyOtp when the button is pressed
                          disabled={timer === 0} // Disable button if timer has expired
                        >
                          {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.sendButtonText}>Verify</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )
                  ) : (
                    // New Password Section (After verification)
                    <View style={styles.passwordResetContainer}>
                      <Text style={styles.verificationText}>Create New Password</Text>
                      <View style={styles.inputContainer}>
                        <Animated.Text
                          style={{
                            ...styles.label,
                            transform: [
                              {
                                translateY: otpnewpassLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [hp(2.5), 0], // Responsive label position
                                }),
                              },
                            ],
                            color: otpnewpassLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"], // Adjust label color
                            }),
                          }}
                        >
                          New Password
                        </Animated.Text>
                        <TextInput
                          style={styles.input}
                          placeholder=""
                          value={newPassword}
                          secureTextEntry={!newshowPassword}
                          onChangeText={setNewPassword}
                          onFocus={handleNewPasswordFocus}
                          onBlur={handleNewPasswordBlur}
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => newsetShowPassword(!newshowPassword)}
                        >
                          <Icon
                            name={newshowPassword ? "visibility" : "visibility-off"}
                            size={normalize(20)}
                            color="#aaa"
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.inputContainer}>
                        <Animated.Text
                          style={{
                            ...styles.label,
                            transform: [
                              {
                                translateY: otpconfirmpassLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [hp(2.5), 0], // Responsive label position
                                }),
                              },
                            ],
                            color: otpconfirmpassLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"], // Adjust label color
                            }),
                          }}
                        >
                          Confirm Password
                        </Animated.Text>
                        <TextInput
                          style={styles.input}
                          placeholder=""
                          secureTextEntry={!confirmshowPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={handleConfirmPasswordFocus}
                          onBlur={handleConfirmPasswordBlur}
                        />
                        <TouchableOpacity
                          style={styles.eyeIcon}
                          onPress={() => confirmsetShowPassword(!confirmshowPassword)}
                        >
                          <Icon
                            name={
                              confirmshowPassword ? "visibility" : "visibility-off"
                            }
                            size={normalize(20)}
                            color="#aaa"
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveNewPassword} // Call a function to handle saving the new password
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
    width: wp(65),
    height: hp(30),
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
  forgotPasswordButton: {
    marginTop: hp(2.5),
  },
  forgotPasswordButtonText: {
    fontSize: normalize(16),
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(4),
  },
  modalContent: {
    width: "90%",
    maxWidth: 500, // Maximum width for larger screens
    padding: wp(5),
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: normalize(19),
    fontWeight: "bold",
    marginBottom: hp(1.6),
    textAlign: "center",
  },
  generateButton: {
    paddingVertical: hp(1.5),
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    marginTop: hp(2.5),
  },
  generateButtonText: {
    color: "#fff",
    fontSize: normalize(16),
    fontWeight: "bold",
  },
  closeModalButton: {
    paddingVertical: hp(1.5),
    alignItems: "center",
    backgroundColor: "#f44336",
    borderRadius: 5,
    marginTop: hp(1.8),
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: normalize(16),
    fontWeight: "bold",
  },
  verificationContainer: {
    padding: wp(5),
  },
  verificationText: {
    fontSize: normalize(18),
    color: "red",
    textAlign: "center",
    marginBottom: hp(1.2),
  },
  verificationCodeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(1.2),
    marginBottom: hp(1.2),
  },
  verificationCodeInput: {
    width: wp(11),
    height: wp(11),
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    fontSize: normalize(17),
    fontWeight: "bold",
    borderRadius: 5,
  },
  resendText: {
    textAlign: "center",
    marginTop: hp(1.2),
    color: "#f44336",
  },
  sendButton: {
    backgroundColor: "#ff5722",
    padding: hp(1.2),
    borderRadius: 5,
    alignItems: "center",
    marginTop: hp(1.2),
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: normalize(16),
  },
  passwordResetContainer: {
    padding: wp(5),
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: hp(1.2),
    alignItems: "center",
    borderRadius: 5,
    marginTop: hp(1.2),
  },
  saveButtonText: {
    color: "#fff",
    fontSize: normalize(16),
  },
  closeIcon: {
    position: "absolute",
    top: hp(2.3),
    right: wp(4),
    zIndex: 1,
  },
  closeIconText: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "red",
  },
  timerText: {
    color: "green",
    fontSize: normalize(16),
    marginVertical: hp(1.2),
    textAlign: "center",
  },
  timerTextExpired: {
    color: "red",
    fontSize: normalize(16),
    marginVertical: hp(1.2),
    textAlign: "center",
  },
});
