import React, { useState, useRef, useEffect } from 'react';
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
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

export default function SuperAdminLogin({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Animation states for the floating labels
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;

  // Listen for dimension changes
  useEffect(() => {
    const updateLayout = () => {
      setDimensions(Dimensions.get('window'));
    };

    Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', updateLayout);
      }
    };
  }, []);

  const animateLabel = (animation, toValue) => {
    Animated.timing(animation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleEmailFocus = () => animateLabel(emailLabelAnim, 1);
  const handleEmailBlur = () => {
    if (!email) animateLabel(emailLabelAnim, 0);
  };

  const handlePasswordFocus = () => animateLabel(passwordLabelAnim, 1);
  const handlePasswordBlur = () => {
    if (!password) animateLabel(passwordLabelAnim, 0);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://${ipPort}/api/superadminlogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', `Welcome Admin to dashboard page.`);
        await AsyncStorage.setItem('jwtToken', data.token);
        navigation.navigate('SuperAdminDashboard');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Login Failed', 'Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
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
              source={require('../assets/final_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Super Admin Login</Text>

            {/* Email Field */}
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
                    outputRange: ['#aaa', '#000'], // Adjust label color
                  }),
                }}
              >
                Email
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isEmailFocused ? '#20C997' : '#ccc', // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => {
                  handleEmailFocus();
                  setIsEmailFocused(true);
                }}
                onBlur={() => {
                  handleEmailBlur();
                  setIsEmailFocused(false);
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
                        outputRange: [hp(2.5), 0],
                      }),
                    },
                  ],
                  color: passwordLabelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#aaa', '#000'],
                  }),
                }}
              >
                Password
              </Animated.Text>
              <TextInput
                style={{
                  ...styles.input,
                  borderColor: isPasswordFocused ? '#20C997' : '#ccc', // Green border on focus
                  borderWidth: 1, // Ensure the border is visible
                }}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry={!showPassword}
                onFocus={() => {
                  handlePasswordFocus();
                  setIsPasswordFocused(true);
                }}
                onBlur={() => {
                  handlePasswordBlur();
                  setIsPasswordFocused(false);
                }}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={normalize(20)} color="#aaa" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Back to Home?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LandingPage')}>
                <Text style={styles.signupLink}>Home</Text>
              </TouchableOpacity>
            </View>
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
});
