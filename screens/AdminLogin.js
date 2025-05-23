// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   Animated,
//   ActivityIndicator,
//   Modal,
//   Image,
//   StyleSheet,
//   Dimensions,
//   Platform,
//   ScrollView,
//   KeyboardAvoidingView,
//   SafeAreaView
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Constants from 'expo-constants';

// // Get screen dimensions
// const { width, height } = Dimensions.get("window");

// // Create responsive size functions
// const wp = (percentage) => {
//   return (percentage * width) / 100;
// };

// const hp = (percentage) => {
//   return (percentage * height) / 100;
// };

// // Responsive font size
// const normalize = (size) => {
//   const scale = width / 375;
//   const newSize = size * scale;
//   if (Platform.OS === 'ios') {
//     return Math.round(newSize);
//   } else {
//     return Math.round(newSize) - 2;
//   }
// };

// const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

// export default function CoAdminLogin({ navigation }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [newshowPassword, newsetShowPassword] = useState(false);
//   const [confirmshowPassword, confirmsetShowPassword] = useState(false);
//   const [societyCode, setSocietyCode] = useState('');
//   const [isEmailFocused, setIsEmailFocused] = useState(false);
//   const [isPasswordFocused, setIsPasswordFocused] = useState(false);
//   const [dimensions, setDimensions] = useState(Dimensions.get('window'));

//   // Animation states for the floating labels
//   const emailLabelAnim = useRef(new Animated.Value(0)).current;
//   const passwordLabelAnim = useRef(new Animated.Value(0)).current;
//   const [isVerificationSent, setIsVerificationSent] = useState(false);
//   const [registeredEmail, setRegisteredEmail] = useState('');
//   const otpemailLabelAnim = useRef(new Animated.Value(0)).current;
//   const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
//   const [isPasswordSectionVisible, setIsPasswordSectionVisible] = useState(false);
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const otpnewpassLabelAnim = useRef(new Animated.Value(0)).current;
//   const otpconfirmpassLabelAnim = useRef(new Animated.Value(0)).current;
//   const [timer, setTimer] = useState(60); // 1-minute timer
//   const [otp1, setOtp1] = useState('');
//   const [otp2, setOtp2] = useState('');
//   const [otp3, setOtp3] = useState('');
//   const [otp4, setOtp4] = useState('');

//   const societyCodeLabelAnim = useRef(new Animated.Value(0)).current;
//   const [isSocietyCodeFocused, setIsSocietyCodeFocused] = useState(false);

//   // Listen for dimension changes
//   useEffect(() => {
//     const updateLayout = () => {
//       // This will trigger a re-render with new dimensions
//       setDimensions(Dimensions.get('window'));
//     };

//     Dimensions.addEventListener('change', updateLayout);

//     return () => {
//       // Clean up event listener
//       if (Dimensions.removeEventListener) {
//         Dimensions.removeEventListener('change', updateLayout);
//       }
//     };
//   }, []);

//   const handleSocietyCodeFocus = () => {
//     animateLabel(societyCodeLabelAnim, 1);
//     setIsSocietyCodeFocused(true);
//   };

//   const handleSocietyCodeBlur = () => {
//     if (!societyCode) {
//       animateLabel(societyCodeLabelAnim, 0);
//     }
//     setIsSocietyCodeFocused(false);
//   };

//   useEffect(() => {
//     let interval;
//     if (isVerificationSent && timer > 0) {
//       interval = setInterval(() => {
//         setTimer((prev) => prev - 1);
//       }, 1000);
//     }

//     return () => clearInterval(interval);
//   }, [isVerificationSent, timer]);

//   const formatTimer = () => {
//     const minutes = Math.floor(timer / 60);
//     const seconds = timer % 60;
//     return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
//   };

//   const resetTimer = () => {
//     setTimer(60); // Reset timer to 60 sec
//   };

//   const handleForgotPassword = async () => {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     if (!emailRegex.test(registeredEmail)) {
//       Alert.alert('Email Error', 'Please enter a valid email address.');
//       return;
//     }
//     if(!registeredEmail){
//       Alert.alert("Please fill in a required field.!")
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`http://${ipPort}/api/otp/send-otp`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email: registeredEmail }),
//       });

//       const data = await response.json();
//       if (response.ok) {
//         console.log(data.message);
//         setIsVerificationSent(true);
//       } else {
//         console.error(data.error);
//         alert('Failed to send OTP: ' + data.error);
//       }
//     } catch (error) {
//       console.error('Error sending OTP:', error);
//       alert('An error occurred while sending OTP.');
//     }
//     finally{
//       setLoading(false)
//     }
//   };

//   const handleVerifyOtp = async () => {
//     const userEnteredOtp = otp1 + otp2 + otp3 + otp4;
//     setLoading(true);

//     if (userEnteredOtp.length === 4) {
//       try {
//         const response = await fetch(`http://${ipPort}/api/otpveri/verify-otp`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ email: registeredEmail, otp: userEnteredOtp }),
//         });
//         console.log("OTP:",userEnteredOtp);

//         const data = await response.json();

//         if (response.ok) {
//           console.log(data.message);
//           setIsPasswordSectionVisible(true);
//         } else {
//           console.error(data.error);
//           alert('Failed to verify OTP: ' + data.error);
//         }
//       } catch (error) {
//         console.error('Error verifying OTP:', error);
//         alert('An error occurred while verifying OTP.');
//       }
//       finally{
//         setLoading(false)
//       }
//     } else {
//       setLoading(false)
//       alert('Please enter a valid 4-digit OTP');
//     }
//   };

//   const handleBackToEmail = () => {
//     setIsVerificationSent(false);
//   };

//   const animateLabel = (animation, toValue) => {
//     Animated.timing(animation, {
//       toValue,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();
//   };

//   const handleEmailFocus = () => animateLabel(emailLabelAnim, 1);
//   const handleEmailBlur = () => {
//     if (!email) animateLabel(emailLabelAnim, 0);
//   };

//   const handlePasswordFocus = () => animateLabel(passwordLabelAnim, 1);
//   const handlePasswordBlur = () => {
//     if (!password) animateLabel(passwordLabelAnim, 0);
//   };

//   const handleNewPasswordFocus = () => animateLabel(otpnewpassLabelAnim, 1);
//   const handleNewPasswordBlur = () => {
//     if (!newPassword) animateLabel(otpnewpassLabelAnim, 0);
//   };

//   const handleConfirmPasswordFocus = () => animateLabel(otpconfirmpassLabelAnim, 1);
//   const handleConfirmPasswordBlur = () => {
//     if (!confirmPassword) animateLabel(otpconfirmpassLabelAnim, 0);
//   };

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please fill in all fields');
//       return;
//     }
//     setLoading(true);
//     try {
//       const response = await fetch(`http://${ipPort}/api/coadmin/login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });
//       const data = await response.json();
//       if (response.ok && data.success) {
//         if (data.token) {
//           await AsyncStorage.setItem('jwtToken', data.token);
//           Alert.alert('Login Successful', `Welcome Society Admin ${email}`);
//           navigation.navigate('CoAdminDashboard');
//         } else {
//           Alert.alert('Login Failed', 'No token received.');
//         }
//       } else {
//         Alert.alert('Login Failed', data.message || 'Invalid email or password');
//       }
//     } catch (error) {
//       Alert.alert('Login Failed', 'Unable to connect to the server. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSaveNewPassword = async () => {
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
//     // Validate password
//     if(!newPassword || !societyCode || !confirmPassword){
//       Alert.alert("Please fill in required field.!")
//       return;
//     }
//     if (!passwordRegex.test(newPassword)) {
//       Alert.alert('Input Error', 'Password must be at least 8 characters long and contain uppercase, lowercase, a digit, and a special character.');
//       return;
//     }

//     if (newPassword === confirmPassword) {
//       try {
//         // Call API to save new password for the user based on email and society code
//         const response = await fetch(`http://${ipPort}/api/coadminreset/update-password`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             email: registeredEmail,
//             societyCode,
//             newPassword: newPassword,
//           }),
//         });

//         const data = await response.json();
//         if (response.ok) {
//           console.log('Password successfully updated');
//           alert(data.message);
//           setIsForgotPasswordModalVisible(false);
//         } else {
//           alert(data.message);
//         }
//       } catch (error) {
//         console.error('Error updating password:', error);
//         alert('Error updating password. Please try again later.');
//       }
//     } else {
//       alert('Passwords do not match');
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={styles.keyboardAvoidingView}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollViewContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.container}>
//             <Image
//               source={require('../assets/final_logo.png')}
//               style={styles.logo}
//               resizeMode="contain"
//             />
//             <Text style={styles.title}>Society Admin Login</Text>

//             {/* Email Field */}
//             <View style={styles.inputContainer}>
//               <Animated.Text
//                 style={{
//                   ...styles.label,
//                   transform: [
//                     {
//                       translateY: emailLabelAnim.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [hp(2.5), 0],
//                       }),
//                     },
//                   ],
//                   color: emailLabelAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: ['#aaa', '#000'],
//                   }),
//                 }}
//               >
//                 Email
//               </Animated.Text>
//               <TextInput
//                 style={{
//                   ...styles.input,
//                   borderColor: isEmailFocused ? '#20C997' : '#ccc',
//                   borderWidth: 1,
//                 }}
//                 value={email}
//                 onChangeText={setEmail}
//                 placeholder=""
//                 keyboardType="email-address"
//                 autoCapitalize="none"
//                 onFocus={() => {
//                   handleEmailFocus();
//                   setIsEmailFocused(true);
//                 }}
//                 onBlur={() => {
//                   handleEmailBlur();
//                   setIsEmailFocused(false);
//                 }}
//               />
//             </View>

//             {/* Password Field */}
//             <View style={styles.inputContainer}>
//               <Animated.Text
//                 style={{
//                   ...styles.label,
//                   transform: [
//                     {
//                       translateY: passwordLabelAnim.interpolate({
//                         inputRange: [0, 1],
//                         outputRange: [hp(2.5), 0],
//                       }),
//                     },
//                   ],
//                   color: passwordLabelAnim.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: ['#aaa', '#000'],
//                   }),
//                 }}
//               >
//                 Password
//               </Animated.Text>
//               <TextInput
//                 style={{
//                   ...styles.input,
//                   borderColor: isPasswordFocused ? '#20C997' : '#ccc',
//                   borderWidth: 1,
//                 }}
//                 value={password}
//                 onChangeText={setPassword}
//                 placeholder=""
//                 secureTextEntry={!showPassword}
//                 onFocus={() => {
//                   handlePasswordFocus();
//                   setIsPasswordFocused(true);
//                 }}
//                 onBlur={() => {
//                   handlePasswordBlur();
//                   setIsPasswordFocused(false);
//                 }}
//               />
//               <TouchableOpacity
//                 style={styles.eyeIcon}
//                 onPress={() => setShowPassword(!showPassword)}
//               >
//                 <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={normalize(20)} color="#aaa" />
//               </TouchableOpacity>
//             </View>

//             <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//               {loading ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <Text style={styles.buttonText}>Login</Text>
//               )}
//             </TouchableOpacity>

//             <View style={styles.signupContainer}>
//               <Text style={styles.signupText}>Back to Home?</Text>
//               <TouchableOpacity onPress={() => navigation.navigate('LandingPage')}>
//                 <Text style={styles.signupLink}>Home</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Button to trigger the Forgot Password modal */}
//             <TouchableOpacity
//               style={styles.forgotPasswordButton}
//               onPress={() => setIsForgotPasswordModalVisible(true)}
//             >
//               <Text style={styles.forgotPasswordButtonText}>Forgot Password?</Text>
//             </TouchableOpacity>

//             {/* Modal for Forgot Password */}
//             <Modal
//               visible={isForgotPasswordModalVisible}
//               animationType="slide"
//               transparent={true}
//               onRequestClose={() => setIsForgotPasswordModalVisible(false)}
//             >
//               <View style={styles.modalBackground}>
//                 <View style={styles.modalContent}>
//                   <Text style={styles.modalTitle}>
//                     {isPasswordSectionVisible
//                       ? 'Reset Your Password'
//                       : isVerificationSent
//                       ? 'Enter Verification Code'
//                       : 'Forgot Password'}
//                   </Text>

//                   {/* Cross Icon for Verification and Create New Password Sections */}
//                   {(isPasswordSectionVisible || isVerificationSent) && (
//                     <TouchableOpacity
//                       style={styles.closeIcon}
//                       onPress={() => setIsForgotPasswordModalVisible(false)}
//                     >
//                       <Text style={styles.closeIconText}>X</Text>
//                     </TouchableOpacity>
//                   )}

//                   {/* Conditional rendering based on the verification state */}
//                   {!isPasswordSectionVisible ? (
//                     !isVerificationSent ? (
//                       // Forgot Password Section (Email Input)
//                       <View style={styles.inputContainer}>
//                         <Animated.Text
//                           style={{
//                             ...styles.label,
//                             transform: [
//                               {
//                                 translateY: otpemailLabelAnim.interpolate({
//                                   inputRange: [0, 1],
//                                   outputRange: [hp(2.5), 0],
//                                 }),
//                               },
//                             ],
//                             color: otpemailLabelAnim.interpolate({
//                               inputRange: [0, 1],
//                               outputRange: ['#aaa', '#000'],
//                             }),
//                           }}
//                         >
//                           Email
//                         </Animated.Text>
//                         <TextInput
//                           style={styles.input}
//                           value={registeredEmail}
//                           onChangeText={setRegisteredEmail}
//                           placeholder=""
//                           keyboardType="email-address"
//                           autoCapitalize="none"
//                           onFocus={() => otpemailLabelAnim.setValue(1)}
//                           onBlur={() => otpemailLabelAnim.setValue(0)}
//                         />

//                         <TouchableOpacity style={styles.generateButton} onPress={handleForgotPassword} disabled={loading}>
//                           {loading ? (
//                             <ActivityIndicator size="small" color="#fff" />
//                           ) : (
//                             <Text style={styles.generateButtonText}>Send OTP</Text>
//                           )}
//                         </TouchableOpacity>

//                         {/* Close Button for Forgot Password Section */}
//                         <TouchableOpacity
//                           style={styles.closeModalButton}
//                           onPress={() => setIsForgotPasswordModalVisible(false)}
//                         >
//                           <Text style={styles.closeModalButtonText}>Close</Text>
//                         </TouchableOpacity>
//                       </View>
//                     ) : (
//                       // Verification Section (After clicking "Send Reset Link")
//                       <View style={styles.verificationContainer}>
//                         <Text style={styles.verificationText}>
//                           Enter the verification code sent to your email
//                         </Text>

//                         {/* Timer Display */}
//                         {timer > 0 ? (
//                           <Text style={styles.timerText}>
//                             Time left: {formatTimer()}
//                           </Text>
//                         ) : (
//                           <Text style={styles.timerTextExpired}>
//                             OTP expired. Please request a new code.
//                           </Text>
//                         )}

//                         <View style={styles.verificationCodeContainer}>
//                           <TextInput
//                             style={styles.verificationCodeInput}
//                             maxLength={1}
//                             keyboardType="numeric"
//                             value={otp1}
//                             onChangeText={(text) => setOtp1(text)}
//                           />
//                           <TextInput
//                             style={styles.verificationCodeInput}
//                             maxLength={1}
//                             keyboardType="numeric"
//                             value={otp2}
//                             onChangeText={(text) => setOtp2(text)}
//                           />
//                           <TextInput
//                             style={styles.verificationCodeInput}
//                             maxLength={1}
//                             keyboardType="numeric"
//                             value={otp3}
//                             onChangeText={(text) => setOtp3(text)}
//                           />
//                           <TextInput
//                             style={styles.verificationCodeInput}
//                             maxLength={1}
//                             keyboardType="numeric"
//                             value={otp4}
//                             onChangeText={(text) => setOtp4(text)}
//                           />
//                         </View>

//                         {timer === 0 ? (
//                           <Text style={styles.resendText} onPress={() => { handleBackToEmail(); resetTimer(); }}>
//                             Didn't receive a code? Back
//                           </Text>
//                         ) : null}

//                         <TouchableOpacity
//                           style={styles.sendButton}
//                           onPress={handleVerifyOtp}
//                           disabled={timer === 0}
//                         >
//                           {loading ? (
//                             <ActivityIndicator size="small" color="#fff" />
//                           ) : (
//                             <Text style={styles.sendButtonText}>Verify</Text>
//                           )}
//                         </TouchableOpacity>
//                       </View>
//                     )
//                   ) : (
//                     // New Password Section (After verification)
//                     <View style={styles.passwordResetContainer}>
//                       <Text style={styles.verificationText}>Create New Password</Text>
//                       <View style={styles.inputContainer}>
//                         <Animated.Text
//                           style={{
//                             ...styles.label,
//                             transform: [
//                               {
//                                 translateY: societyCodeLabelAnim.interpolate({
//                                   inputRange: [0, 1],
//                                   outputRange: [hp(2.5), 0],
//                                 }),
//                               },
//                             ],
//                             color: societyCodeLabelAnim.interpolate({
//                               inputRange: [0, 1],
//                               outputRange: ['#aaa', '#000'],
//                             }),
//                           }}
//                         >
//                           Society Code
//                         </Animated.Text>
//                         <TextInput
//                           style={{
//                             ...styles.input,
//                             borderColor: isSocietyCodeFocused ? '#20C997' : '#ccc',
//                             borderWidth: 1,
//                           }}
//                           placeholder=""
//                           value={societyCode}
//                           onChangeText={setSocietyCode}
//                           onFocus={handleSocietyCodeFocus}
//                           onBlur={handleSocietyCodeBlur}
//                         />
//                       </View>

//                       <View style={styles.inputContainer}>
//                         <Animated.Text
//                           style={{
//                             ...styles.label,
//                             transform: [
//                               {
//                                 translateY: otpnewpassLabelAnim.interpolate({
//                                   inputRange: [0, 1],
//                                   outputRange: [hp(2.5), 0],
//                                 }),
//                               },
//                             ],
//                             color: otpnewpassLabelAnim.interpolate({
//                               inputRange: [0, 1],
//                               outputRange: ['#aaa', '#000'],
//                             }),
//                           }}
//                         >
//                           New Password
//                         </Animated.Text>
//                         <TextInput
//                           style={styles.input}
//                           placeholder=""
//                           value={newPassword}
//                           secureTextEntry={!newshowPassword}
//                           onChangeText={setNewPassword}
//                           onFocus={handleNewPasswordFocus}
//                           onBlur={handleNewPasswordBlur}
//                         />
//                         <TouchableOpacity
//                           style={styles.eyeIcon}
//                           onPress={() => newsetShowPassword(!newshowPassword)}
//                         >
//                           <Icon name={newshowPassword ? 'visibility' : 'visibility-off'} size={normalize(20)} color="#aaa" />
//                         </TouchableOpacity>
//                       </View>

//                       <View style={styles.inputContainer}>
//                         <Animated.Text
//                           style={{
//                             ...styles.label,
//                             transform: [
//                               {
//                                 translateY: otpconfirmpassLabelAnim.interpolate({
//                                   inputRange: [0, 1],
//                                   outputRange: [hp(2.5), 0],
//                                 }),
//                               },
//                             ],
//                             color: otpconfirmpassLabelAnim.interpolate({
//                               inputRange: [0, 1],
//                               outputRange: ['#aaa', '#000'],
//                             }),
//                           }}
//                         >
//                           Confirm Password
//                         </Animated.Text>
//                         <TextInput
//                           style={styles.input}
//                           placeholder=""
//                           secureTextEntry={!confirmshowPassword}
//                           value={confirmPassword}
//                           onChangeText={setConfirmPassword}
//                           onFocus={handleConfirmPasswordFocus}
//                           onBlur={handleConfirmPasswordBlur}
//                         />
//                         <TouchableOpacity
//                           style={styles.eyeIcon}
//                           onPress={() => confirmsetShowPassword(!confirmshowPassword)}
//                         >
//                           <Icon name={confirmshowPassword ? 'visibility' : 'visibility-off'} size={normalize(20)} color="#aaa" />
//                         </TouchableOpacity>
//                       </View>

//                       <TouchableOpacity
//                         style={styles.saveButton}
//                         onPress={handleSaveNewPassword} password
//                       >
//                         <Text style={styles.saveButtonText}>Save</Text>
//                       </TouchableOpacity>
//                     </View>
//                   )}
//                 </View>
//               </View>
//             </Modal>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "white",
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollViewContent: {
//     flexGrow: 1,
//     justifyContent: "center",
//   },
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//     paddingHorizontal: wp(5),
//     paddingVertical: hp(2),
//   },
//   logo: {
//     width: wp(62),
//     height: hp(26),
//     marginTop: hp(-5),
//     marginBottom: hp(-2),
//     backgroundColor: "white",
//     borderRadius: 100,
//   },
//   title: {
//     fontSize: normalize(28),
//     color: "#135387",
//     fontWeight: "bold",
//     marginBottom: hp(1),
//     textAlign: "center",
//   },
//   inputContainer: {
//     position: "relative",
//     marginBottom: hp(2.5),
//     width: "100%",
//     maxWidth: 500,
//   },
//   label: {
//     position: "absolute",
//     top: -hp(1.2),
//     left: wp(4),
//     fontSize: normalize(14),
//     color: "#aaa",
//     backgroundColor: "#fff",
//     paddingHorizontal: wp(1.2),
//     zIndex: 1,
//   },
//   input: {
//     width: "100%",
//     height: hp(6),
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     paddingHorizontal: wp(4),
//     fontSize: normalize(16),
//     color: "#000",
//     borderWidth: 1,
//     borderColor: "#aaa",
//     position: "relative",
//     zIndex: 0,
//   },
//   button: {
//     width: "100%",
//     height: hp(6),
//     backgroundColor: "#135387",
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: hp(1.2),
//     maxWidth: 500,
//   },
//   buttonText: {
//     fontSize: normalize(18),
//     color: "white",
//     fontWeight: "bold",
//   },
//   signupContainer: {
//     flexDirection: "row",
//     marginTop: hp(2.5),
//     flexWrap: "wrap",
//     justifyContent: "center",
//   },
//   signupText: {
//     fontSize: normalize(14),
//     color: "#807d7d",
//   },
//   signupLink: {
//     fontSize: normalize(14),
//     color: "#28A745",
//     fontWeight: "bold",
//     marginLeft: wp(1.2),
//   },
//   eyeIcon: {
//     position: "absolute",
//     right: wp(4),
//     top: "30%",
//     zIndex: 1,
//   },
//   forgotPasswordButton: {
//     marginTop: hp(2.5),
//   },
//   forgotPasswordButtonText: {
//     fontSize: normalize(16),
//     color: "#007BFF",
//     textDecorationLine: "underline",
//   },
//   modalBackground: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.5)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: wp(4),
//   },
//   modalContent: {
//     width: "90%",
//     maxWidth: 500,
//     padding: wp(5),
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalTitle: {
//     fontSize: normalize(19),
//     fontWeight: "bold",
//     marginBottom: hp(1.6),
//     textAlign: "center",
//   },
//   generateButton: {
//     paddingVertical: hp(1.5),
//     alignItems: "center",
//     backgroundColor: "#4CAF50",
//     borderRadius: 5,
//     marginTop: hp(2.5),
//   },
//   generateButtonText: {
//     color: "#fff",
//     fontSize: normalize(16),
//     fontWeight: "bold",
//   },
//   closeModalButton: {
//     paddingVertical: hp(1.5),
//     alignItems: "center",
//     backgroundColor: "#f44336",
//     borderRadius: 5,
//     marginTop: hp(1.8),
//   },
//   closeModalButtonText: {
//     color: "#fff",
//     fontSize: normalize(16),
//     fontWeight: "bold",
//   },
//   verificationContainer: {
//     padding: wp(5),
//   },
//   verificationText: {
//     fontSize: normalize(18),
//     color: "red",
//     textAlign: "center",
//     marginBottom: hp(1.2),
//   },
//   verificationCodeContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: hp(1.2),
//     marginBottom: hp(1.2),
//   },
//   verificationCodeInput: {
//     width: wp(11),
//     height: wp(11),
//     borderWidth: 1,
//     borderColor: "#ccc",
//     textAlign: "center",
//     fontSize: normalize(17),
//     fontWeight: "bold",
//     borderRadius: 5,
//   },
//   resendText: {
//     textAlign: "center",
//     marginTop: hp(1.2),
//     color: "#f44336",
//   },
//   sendButton: {
//     backgroundColor: "#ff5722",
//     padding: hp(1.2),
//     borderRadius: 5,
//     alignItems: "center",
//     marginTop: hp(1.2),
//   },
//   sendButtonText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: normalize(16),
//   },
//   passwordResetContainer: {
//     padding: wp(5),
//   },
//   saveButton: {
//     backgroundColor: "#4CAF50",
//     paddingVertical: hp(1.2),
//     alignItems: "center",
//     borderRadius: 5,
//     marginTop: hp(1.2),
//   },
//   saveButtonText: {
//     color: "#fff",
//     fontSize: normalize(16),
//   },
//   closeIcon: {
//     position: "absolute",
//     top: hp(2.3),
//     right: wp(4),
//     zIndex: 1,
//   },
//   closeIconText: {
//     fontSize: normalize(20),
//     fontWeight: "bold",
//     color: "red",
//   },
//   timerText: {
//     color: "green",
//     fontSize: normalize(16),
//     marginVertical: hp(1.2),
//     textAlign: "center",
//   },
//   timerTextExpired: {
//     color: "red",
//     fontSize: normalize(16),
//     marginVertical: hp(1.2),
//     textAlign: "center",
//   },
// });

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

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
  const scale = width / 375;
  const newSize = size * scale;
  if (Platform.OS === "ios") {
    return Math.round(newSize);
  } else {
    return Math.round(newSize) - 2;
  }
};

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

export default function CoAdminLogin({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newshowPassword, newsetShowPassword] = useState(false);
  const [confirmshowPassword, confirmsetShowPassword] = useState(false);
  const [societyCode, setSocietyCode] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  // Animation states for the floating labels
  const emailLabelAnim = useRef(new Animated.Value(0)).current;
  const passwordLabelAnim = useRef(new Animated.Value(0)).current;
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const otpemailLabelAnim = useRef(new Animated.Value(0)).current;
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] =
    useState(false);
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

  const societyCodeLabelAnim = useRef(new Animated.Value(0)).current;
  const [isSocietyCodeFocused, setIsSocietyCodeFocused] = useState(false);

  // Listen for dimension changes
  useEffect(() => {
    const updateLayout = () => {
      // This will trigger a re-render with new dimensions
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateLayout);

    return () => {
      // Clean up event listener
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener("change", updateLayout);
      }
    };
  }, []);

  const handleSocietyCodeFocus = () => {
    animateLabel(societyCodeLabelAnim, 1);
    setIsSocietyCodeFocused(true);
  };

  const handleSocietyCodeBlur = () => {
    if (!societyCode) {
      animateLabel(societyCodeLabelAnim, 0);
    }
    setIsSocietyCodeFocused(false);
  };

  useEffect(() => {
    let interval;
    if (isVerificationSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
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
      Alert.alert("Input Error", "Please fill in a required field.");
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
      if (response.ok) {
        setIsVerificationSent(true);
      } else {
        Alert.alert(
          "Failed to Send OTP",
          data.error || "Unknown error occurred"
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const userEnteredOtp = otp1 + otp2 + otp3 + otp4;
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

        const data = await response.json();

        if (response.ok) {
          setIsPasswordSectionVisible(true);
        } else {
          Alert.alert(
            "Failed to Verify OTP",
            data.error || "Unknown error occurred"
          );
        }
      } catch (error) {
        Alert.alert("Error", "An error occurred while verifying OTP.");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      Alert.alert("Input Error", "Please enter a valid 4-digit OTP");
    }
  };

  const handleBackToEmail = () => {
    setIsVerificationSent(false);
  };

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
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://${ipPort}/api/coadmin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.token) {
          await AsyncStorage.setItem("jwtToken", data.token);
          Alert.alert("Login Successful", `Welcome Society Admin ${email}`);
          navigation.navigate("CoAdminDashboard");
        } else {
          Alert.alert("Login Failed", "No token received.");
        }
      } else {
        Alert.alert(
          "Login Failed",
          data.message || "Invalid email or password"
        );
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Unable to connect to the server. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewPassword = async () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    // Validate password
    if (!newPassword || !societyCode || !confirmPassword) {
      Alert.alert("Input Error", "Please fill in required field.");
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        "Input Error",
        "Password must be at least 8 characters long and contain uppercase, lowercase, a digit, and a special character."
      );
      return;
    }

    if (newPassword === confirmPassword) {
      try {
        // Call API to save new password for the user based on email and society code
        const response = await fetch(
          `http://${ipPort}/api/coadminreset/update-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: registeredEmail,
              societyCode,
              newPassword: newPassword,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          Alert.alert(
            "Success",
            data.message || "Password updated successfully"
          );
          setIsForgotPasswordModalVisible(false);
        } else {
          Alert.alert("Error", data.message || "Failed to update password.");
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "Error updating password. Please try again later."
        );
      }
    } else {
      Alert.alert("Input Error", "Passwords do not match");
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
              source={require("../assets/final_logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Society Admin Login</Text>

            {/* Email Field */}
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
                Email
              </Animated.Text>
              <TextInput
                testID="emailInput"
                style={{
                  ...styles.input,
                  borderColor: isEmailFocused ? "#20C997" : "#ccc",
                  borderWidth: 1,
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
                    outputRange: ["#aaa", "#000"],
                  }),
                }}
              >
                Password
              </Animated.Text>
              <TextInput
                testID="passwordInput"
                style={{
                  ...styles.input,
                  borderColor: isPasswordFocused ? "#20C997" : "#ccc",
                  borderWidth: 1,
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
                testID="passwordEyeIcon"
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={normalize(20)}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="loginButton"
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
              <Text style={styles.signupText}>Back to Home?</Text>
              <TouchableOpacity
                testID="homeLink"
                onPress={() => navigation.navigate("LandingPage")}
              >
                <Text style={styles.signupLink}>Home</Text>
              </TouchableOpacity>
            </View>

            {/* Button to trigger the Forgot Password modal */}
            <TouchableOpacity
              testID="forgotPasswordButton"
              style={styles.forgotPasswordButton}
              onPress={() => setIsForgotPasswordModalVisible(true)}
            >
              <Text style={styles.forgotPasswordButtonText}>
                Forgot Password?
              </Text>
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
                      testID="modalCloseIcon"
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
                                  outputRange: [hp(2.5), 0],
                                }),
                              },
                            ],
                            color: otpemailLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"],
                            }),
                          }}
                        >
                          Email
                        </Animated.Text>
                        <TextInput
                          testID="modalEmailInput"
                          style={styles.input}
                          value={registeredEmail}
                          onChangeText={setRegisteredEmail}
                          placeholder=""
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => otpemailLabelAnim.setValue(1)}
                          onBlur={() => otpemailLabelAnim.setValue(0)}
                        />

                        <TouchableOpacity
                          testID="sendOtpButton"
                          style={styles.generateButton}
                          onPress={handleForgotPassword}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.generateButtonText}>
                              Send OTP
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Close Button for Forgot Password Section */}
                        <TouchableOpacity
                          testID="modalCloseButton"
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
                            testID="otpInput1"
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp1}
                            onChangeText={(text) => setOtp1(text)}
                          />
                          <TextInput
                            testID="otpInput2"
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp2}
                            onChangeText={(text) => setOtp2(text)}
                          />
                          <TextInput
                            testID="otpInput3"
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp3}
                            onChangeText={(text) => setOtp3(text)}
                          />
                          <TextInput
                            testID="otpInput4"
                            style={styles.verificationCodeInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={otp4}
                            onChangeText={(text) => setOtp4(text)}
                          />
                        </View>

                        {timer === 0 ? (
                          <Text
                            testID="resendOtpLink"
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
                          testID="verifyOtpButton"
                          style={styles.sendButton}
                          onPress={handleVerifyOtp}
                          disabled={timer === 0}
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
                      <Text style={styles.verificationText}>
                        Create New Password
                      </Text>
                      <View style={styles.inputContainer}>
                        <Animated.Text
                          style={{
                            ...styles.label,
                            transform: [
                              {
                                translateY: societyCodeLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [hp(2.5), 0],
                                }),
                              },
                            ],
                            color: societyCodeLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"],
                            }),
                          }}
                        >
                          Society Code
                        </Animated.Text>
                        <TextInput
                          testID="societyCodeInput"
                          style={{
                            ...styles.input,
                            borderColor: isSocietyCodeFocused
                              ? "#20C997"
                              : "#ccc",
                            borderWidth: 1,
                          }}
                          placeholder=""
                          value={societyCode}
                          onChangeText={setSocietyCode}
                          onFocus={handleSocietyCodeFocus}
                          onBlur={handleSocietyCodeBlur}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Animated.Text
                          style={{
                            ...styles.label,
                            transform: [
                              {
                                translateY: otpnewpassLabelAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [hp(2.5), 0],
                                }),
                              },
                            ],
                            color: otpnewpassLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"],
                            }),
                          }}
                        >
                          New Password
                        </Animated.Text>
                        <TextInput
                          testID="newPasswordInput"
                          style={styles.input}
                          placeholder=""
                          value={newPassword}
                          secureTextEntry={!newshowPassword}
                          onChangeText={setNewPassword}
                          onFocus={handleNewPasswordFocus}
                          onBlur={handleNewPasswordBlur}
                        />
                        <TouchableOpacity
                          testID="newPasswordEyeIcon"
                          style={styles.eyeIcon}
                          onPress={() => newsetShowPassword(!newshowPassword)}
                        >
                          <Icon
                            name={
                              newshowPassword ? "visibility" : "visibility-off"
                            }
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
                                translateY: otpconfirmpassLabelAnim.interpolate(
                                  {
                                    inputRange: [0, 1],
                                    outputRange: [hp(2.5), 0],
                                  }
                                ),
                              },
                            ],
                            color: otpconfirmpassLabelAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["#aaa", "#000"],
                            }),
                          }}
                        >
                          Confirm Password
                        </Animated.Text>
                        <TextInput
                          testID="confirmPasswordInput"
                          style={styles.input}
                          placeholder=""
                          secureTextEntry={!confirmshowPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={handleConfirmPasswordFocus}
                          onBlur={handleConfirmPasswordBlur}
                        />
                        <TouchableOpacity
                          testID="confirmPasswordEyeIcon"
                          style={styles.eyeIcon}
                          onPress={() =>
                            confirmsetShowPassword(!confirmshowPassword)
                          }
                        >
                          <Icon
                            name={
                              confirmshowPassword
                                ? "visibility"
                                : "visibility-off"
                            }
                            size={normalize(20)}
                            color="#aaa"
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        testID="saveButton"
                        style={styles.saveButton}
                        onPress={handleSaveNewPassword}
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
    maxWidth: 500,
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
    maxWidth: 500,
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
