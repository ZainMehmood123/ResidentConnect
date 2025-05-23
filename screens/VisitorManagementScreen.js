// "use client"

// import { useState, useEffect } from "react"
// import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, useWindowDimensions } from "react-native"
// import {
//   TextInput,
//   Button,
//   Card,
//   Title,
//   Paragraph,
//   Appbar,
//   Portal,
//   Dialog,
//   Provider as PaperProvider,
//   DefaultTheme,
//   Searchbar,
//   IconButton,
//   Avatar,
//   Menu,
//   List,
//   Text,
// } from "react-native-paper"
// import { Picker } from "@react-native-picker/picker"
// import * as ImagePicker from "expo-image-picker"
// import { MaterialCommunityIcons } from "@expo/vector-icons"
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Constants from 'expo-constants';
// const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;


// const theme = {
//   ...DefaultTheme,
//   colors: {
//     ...DefaultTheme.colors,
//     primary: "#135387",
//     accent: "#F5A623",
//     background: "#F0F4F8",
//     error: "#D0021B",
//     text: "#4A4A4A",
//     placeholder: "#9B9B9B",
//     focus: "#28A745", // New focus color
//   },
// }

// const VisitorManagementScreen = () => {
//   const [pendingRequests, setPendingRequests] = useState([])
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [phone, setPhone] = useState("")
//   const [purpose, setPurpose] = useState("")
//   const [relationship, setRelationship] = useState("")
//   const [checkInTime, setCheckInTime] = useState(new Date())
//   const [photo, setPhoto] = useState(null)
//   const [dialogVisible, setDialogVisible] = useState(false)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [showDateMenu, setShowDateMenu] = useState(false)
//   const [focusedInput, setFocusedInput] = useState(null)
//   const { width, height } = useWindowDimensions()
//   const [loading, setLoading] = useState(false);


//   const isTablet = width >= 768

//   useEffect(() => {
//     ;(async () => {
//       const { status } = await ImagePicker.requestCameraPermissionsAsync()
//       if (status !== "granted") {
//         Alert.alert("Permission needed", "Camera permission is required to take photos.")
//       }
//     })()
//   }, [])

//   const validateName = (name) => /^[a-zA-Z\s]{2,50}$/.test(name)
//   const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
//   const validatePhone = (phone) => /^\+?[0-9]{10,14}$/.test(phone)
//   const validatePurpose = (purpose) => purpose.length >= 5 && purpose.length <= 100

//   const decodeJWT = (token) => {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
//       return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//     }).join(''));
  
//     return JSON.parse(jsonPayload);
//   };

//   const handleRequestVisitor = async () => {
//     if (!validateName(name)) {
//       Alert.alert("Invalid Name", "Please enter a valid name (2-50 characters, letters only)");
//       return;
//     }
//     if (!validateEmail(email)) {
//       Alert.alert("Invalid Email", "Please enter a valid email address");
//       return;
//     }
//     if (!validatePhone(phone)) {
//       Alert.alert("Invalid Phone", "Please enter a valid phone number (10-14 digits)");
//       return;
//     }
//     if (!validatePurpose(purpose)) {
//       Alert.alert("Invalid Purpose", "Please enter a valid purpose (5-100 characters)");
//       return;
//     }
//     if (!relationship) {
//       Alert.alert("Missing Relationship", "Please select the visitor's relationship to you");
//       return;
//     }

//     const token = await AsyncStorage.getItem("jwtToken");
//     if (!token) {
//       Alert.alert("Error", "No token found, please log in.");
//       return;
//     }

//     const decoded = decodeJWT(token); // Assuming decodeJWT extracts user email
//     const userEmail = decoded.email;

//     const newRequest = {
//       name,
//       email,
//       phone,
//       purpose,
//       relationship,
//       checkInTime: checkInTime.toISOString(),
//       photo,
//       status: "pending",
//       userEmail, // Store logged-in user's email
//     };

//     try {
//       const response = await fetch(`http://${ipPort}/api/visitor/request`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(newRequest),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || "Failed to send request");
//       }

//       Alert.alert("Success", "✅ Visitor registration request sent to admin");
//       resetForm();
//       setDialogVisible(false);
//     } catch (error) {
//       console.error("Error submitting visitor request:", error);
//       Alert.alert("Error", "Failed to submit visitor request. Please try again.");
//     }
// };


//   const resetForm = () => {
//     setName("")
//     setEmail("")
//     setPhone("")
//     setPurpose("")
//     setRelationship("")
//     setCheckInTime(new Date())
//     setPhoto(null)
//   }

//   const handleTakePhoto = async () => {
//     const result = await ImagePicker.launchCameraAsync({
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     })

//     if (!result.canceled) {
//       setPhoto(result.assets[0].uri)
//     }
//   }
//   const fetchVisitorRequests = async () => {
//     const token = await AsyncStorage.getItem("jwtToken");
//     if (!token) {
//       Alert.alert("Error", "No token found, please log in.");
//       return;
//     }

//     // Decode JWT to get user email
//     const decoded = decodeJWT(token);
//     const userEmail = decoded.email; // Extract email from JWT

//     try {
//       setLoading(true);
      
//       // Fetch visitor requests for the logged-in user
//       const response = await fetch(`http://${ipPort}/api/visitor/requests/${userEmail}`);
//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to fetch visitor requests");
//       }

//       setPendingRequests(data.visitors); // Set state with visitor requests
//     } catch (error) {
//       console.error("Error fetching visitor requests:", error);
//       Alert.alert("Error", "Failed to fetch visitor requests. Please try again.");
//     } finally {
//       setLoading(false);
//     }
// };

//   const filteredRequests = pendingRequests.filter(
//     (request) =>
//       request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       request.phone.includes(searchQuery)
// );

// useEffect(()=>{
//   fetchVisitorRequests()
// },[])
//   const setDate = (date) => {
//     setCheckInTime(date)
//     setShowDateMenu(false)
//   }

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case "pending":
//         return "clock-outline"
//       case "approved":
//         return "check-circle-outline"
//       case "rejected":
//         return "close-circle-outline"
//       default:
//         return "help-circle-outline"
//     }
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "pending":
//         return theme.colors.accent
//       case "approved":
//         return theme.colors.primary
//       case "rejected":
//         return theme.colors.error
//       default:
//         return theme.colors.placeholder
//     }
//   }

//   return (
//     <PaperProvider theme={theme}>
//       <View style={styles.container}>
//         <Appbar.Header style={styles.appbar}>
//           <Appbar.Content
//             title="Visitor Registration 📝"
//             subtitle="Welcome, Resident!"
//             titleStyle={styles.appbarTitle}
//             subtitleStyle={styles.appbarSubtitle}
//           />
//           <Appbar.Action icon="bell-outline" onPress={() => {}} />
//         </Appbar.Header>

//         <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
//           <View style={isTablet ? styles.tabletLayout : styles.phoneLayout}>
//             <Card style={[styles.requestCard, isTablet && styles.tabletCard]}>
//               <Card.Content>
//                 <View style={styles.cardHeader}>
//                   <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
//                   <Title style={styles.cardTitle}>Request Visitor Registration</Title>
//                 </View>
//                 <Paragraph style={styles.cardDescription}>
//                   🏠 Expecting guests? Let's make their visit smooth and secure!
//                 </Paragraph>
//                 <Button
//                   mode="contained"
//                   onPress={() => setDialogVisible(true)}
//                   icon="plus"
//                   style={styles.requestButton}
//                 >
//                   New Visitor Request
//                 </Button>
//               </Card.Content>
//             </Card>

//             <Card style={[styles.pendingRequestsCard, isTablet && styles.tabletCard]}>
//               <Card.Content>
//                 <View style={styles.cardHeader}>
//                   <MaterialCommunityIcons name="format-list-bulleted" size={24} color={theme.colors.primary} />
//                   <Title style={styles.cardTitle}>Your Pending Requests</Title>
//                 </View>
//                 <Searchbar
//                   placeholder="Search requests"
//                   onChangeText={setSearchQuery}
//                   value={searchQuery}
//                   style={styles.searchBar}
//                 />
//                 <ScrollView style={styles.requestList}>
//                   {filteredRequests.map((request) => (
//                     <List.Item
//                       key={request.id}
//                       title={request.name}
//                       description={`${request.relationship} • ${request.checkInTime}`}
//                       left={(props) => (
//                         <Avatar.Icon
//                           {...props}
//                           icon={getStatusIcon(request.status)}
//                           color={getStatusColor(request.status)}
//                           style={{ backgroundColor: "transparent" }}
//                         />
//                       )}
//                       right={(props) => (
//                         <IconButton
//                           {...props}
//                           icon="information-outline"
//                           onPress={() => {
//                             // Show request details
//                           }}
//                         />
//                       )}
//                     />
//                   ))}
//                 </ScrollView>
//               </Card.Content>
//             </Card>

//           </View>
//         </ScrollView>

//         <Portal>
//           <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
//             <Dialog.Title>🆕 New Visitor Request</Dialog.Title>
//             <Dialog.ScrollArea>
//               <ScrollView contentContainerStyle={styles.dialogScrollViewContent}>
//                 <TextInput
//                   label="Visitor's Name"
//                   value={name}
//                   onChangeText={setName}
//                   style={styles.input}
//                   mode="outlined"
//                   left={<TextInput.Icon icon="account" />}
//                   onFocus={() => setFocusedInput("name")}
//                   onBlur={() => setFocusedInput(null)}
//                   outlineColor={focusedInput === "name" ? theme.colors.focus : theme.colors.placeholder}
//                 />

//                 <TextInput
//                   label="Visitor's Email"
//                   value={email}
//                   onChangeText={setEmail}
//                   style={styles.input}
//                   mode="outlined"
//                   keyboardType="email-address"
//                   left={<TextInput.Icon icon="email" />}
//                   onFocus={() => setFocusedInput("email")}
//                   onBlur={() => setFocusedInput(null)}
//                   outlineColor={focusedInput === "email" ? theme.colors.focus : theme.colors.placeholder}
//                 />

//                 <TextInput
//                   label="Visitor's Phone"
//                   value={phone}
//                   onChangeText={setPhone}
//                   style={styles.input}
//                   mode="outlined"
//                   keyboardType="phone-pad"
//                   left={<TextInput.Icon icon="phone" />}
//                   onFocus={() => setFocusedInput("phone")}
//                   onBlur={() => setFocusedInput(null)}
//                   outlineColor={focusedInput === "phone" ? theme.colors.focus : theme.colors.placeholder}
//                 />

//                 <TextInput
//                   label="Purpose of Visit"
//                   value={purpose}
//                   onChangeText={setPurpose}
//                   style={styles.input}
//                   mode="outlined"
//                   multiline
//                   left={<TextInput.Icon icon="clipboard-text" />}
//                   onFocus={() => setFocusedInput("purpose")}
//                   onBlur={() => setFocusedInput(null)}
//                   outlineColor={focusedInput === "purpose" ? theme.colors.focus : theme.colors.placeholder}
//                 />

//                 <Picker
//                   selectedValue={relationship}
//                   onValueChange={(itemValue) => setRelationship(itemValue)}
//                   style={styles.picker}
//                 >
//                   <Picker.Item label="Select Relationship" value="" />
//                   <Picker.Item label="👪 Family" value="Family" />
//                   <Picker.Item label="👥 Friend" value="Friend" />
//                   <Picker.Item label="💼 Colleague" value="Colleague" />
//                   <Picker.Item label="🔧 Service Provider" value="Service Provider" />
//                   <Picker.Item label="📦 Delivery" value="Delivery" />
//                   <Picker.Item label="🤝 Other" value="Other" />
//                 </Picker>

//                 <Menu
//                   visible={showDateMenu}
//                   onDismiss={() => setShowDateMenu(false)}
//                   anchor={
//                     <TouchableOpacity onPress={() => setShowDateMenu(true)} style={styles.dateButton}>
//                       <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary} />
//                       <Paragraph>Expected Arrival: {checkInTime.toLocaleString()}</Paragraph>
//                     </TouchableOpacity>
//                   }
//                 >
//                   <Menu.Item onPress={() => setDate(new Date())} title="Now" />
//                   <Menu.Item onPress={() => setDate(new Date(Date.now() + 3600000))} title="In 1 hour" />
//                   <Menu.Item onPress={() => setDate(new Date(Date.now() + 7200000))} title="In 2 hours" />
//                   <Menu.Item onPress={() => setDate(new Date(Date.now() + 86400000))} title="Tomorrow" />
//                 </Menu>

//                 <Button mode="contained" onPress={handleTakePhoto} style={styles.photoButton} icon="camera">
//                   📸 Take Visitor's Photo
//                 </Button>
//                 {photo && <Avatar.Image size={100} source={{ uri: photo }} style={styles.photo} />}
//               </ScrollView>
//             </Dialog.ScrollArea>
//             <Dialog.Actions>
//               <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
//               <Button onPress={handleRequestVisitor}>Send Request</Button>
//             </Dialog.Actions>
//           </Dialog>
//         </Portal>
//       </View>
//     </PaperProvider>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   appbar: {
//     elevation: 4,
//     backgroundColor: theme.colors.primary,
//   },
//   appbarTitle: {
//     color: "#FFFFFF",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   appbarSubtitle: {
//     color: "rgba(255, 255, 255, 0.7)",
//     fontSize: 14,
//   },
//   content: {
//     flex: 1,
//   },
//   contentContainer: {
//     padding: 16,
//     flexGrow: 1,
//   },
//   tabletLayout: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },
//   phoneLayout: {
//     flexDirection: "column",
//   },
//   requestCard: {
//     marginBottom: 16,
//     elevation: 4,
//     borderRadius: 8,
//   },
//   pendingRequestsCard: {
//     flex: 1,
//     marginBottom: 16,
//     elevation: 4,
//     borderRadius: 8,
//   },
//   tabletCard: {
//     width: "48%",
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   cardTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: theme.colors.primary,
//     marginLeft: 8,
//   },
//   cardDescription: {
//     marginBottom: 16,
//     color: theme.colors.text,
//   },
//   requestButton: {
//     marginTop: 16,
//   },
//   searchBar: {
//     marginBottom: 16,
//     backgroundColor: "#FFFFFF",
//   },
//   requestList: {
//     maxHeight: 300,
//   },
//   input: {
//     marginBottom: 16,
//   },
//   picker: {
//     marginBottom: 16,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 4,
//   },
//   dateButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//     padding: 12,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 4,
//   },
//   photoButton: {
//     marginBottom: 16,
//   },
//   photo: {
//     alignSelf: "center",
//     marginBottom: 16,
//   },
//   dialogScrollViewContent: {
//     padding: 16,
//   },
// })

// export default VisitorManagementScreen



"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, useWindowDimensions, ActivityIndicator } from "react-native"
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Appbar,
  Portal,
  Dialog,
  Provider as PaperProvider,
  DefaultTheme,
  Searchbar,
  IconButton,
  Avatar,
  Menu,
  List,
  Text,
  Divider,
  Badge,
  Chip,
  Surface,
} from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import * as ImagePicker from "expo-image-picker"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;


const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#135387",
    accent: "#F5A623",
    background: "#F0F4F8",
    error: "#D0021B",
    text: "#4A4A4A",
    placeholder: "#9B9B9B",
    focus: "#28A745", // Focus color
  },
}

const VisitorManagementScreen = () => {
  const [pendingRequests, setPendingRequests] = useState([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [purpose, setPurpose] = useState("")
  const [relationship, setRelationship] = useState("")
  const [checkInTime, setCheckInTime] = useState(new Date())
  const [photo, setPhoto] = useState(null)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)
  const { width, height } = useWindowDimensions()
  const [loading, setLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false)

  const isTablet = width >= 768

  useEffect(() => {
    ;(async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take photos.")
      }
    })()
  }, [])

  // Updated regex patterns for better validation
  const validateName = (name) => /^[a-zA-Z\s\-']{2,50}$/.test(name) // Allow hyphens and apostrophes
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^(\+\d{1,3}[- ]?)?\d{10,14}$/.test(phone) // More flexible phone format
  const validatePurpose = (purpose) => purpose.trim().length >= 5 && purpose.trim().length <= 100

  const decodeJWT = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  };

  const handleRequestVisitor = async () => {
    if (!validateName(name)) {
      Alert.alert("Invalid Name", "Please enter a valid name (2-50 characters, letters, spaces, hyphens, and apostrophes only)");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number (10-14 digits, may include country code)");
      return;
    }
    if (!validatePurpose(purpose)) {
      Alert.alert("Invalid Purpose", "Please enter a valid purpose (5-100 characters)");
      return;
    }
    if (!relationship) {
      Alert.alert("Missing Relationship", "Please select the visitor's relationship to you");
      return;
    }

    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      Alert.alert("Error", "No token found, please log in.");
      return;
    }

    const decoded = decodeJWT(token); // Assuming decodeJWT extracts user email
    const userEmail = decoded.email;

    const newRequest = {
      name,
      email,
      phone,
      purpose,
      relationship,
      checkInTime: checkInTime.toISOString(),
      photo,
      status: "pending",
      userEmail, // Store logged-in user's email
    };

    try {
      const response = await fetch(`http://${ipPort}/api/visitor/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRequest),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send request");
      }

      Alert.alert("Success", "✅ Visitor registration request sent to admin");
      resetForm();
      setDialogVisible(false);
      fetchVisitorRequests(); // Refresh the list
    } catch (error) {
      console.error("Error submitting visitor request:", error);
      Alert.alert("Error", "Failed to submit visitor request. Please try again.");
    }
  };


  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setPurpose("")
    setRelationship("")
    setCheckInTime(new Date())
    setPhoto(null)
  }

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      setPhoto(result.assets[0].uri)
    }
  }
  
  const fetchVisitorRequests = async () => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      Alert.alert("Error", "No token found, please log in.");
      return;
    }

    // Decode JWT to get user email
    const decoded = decodeJWT(token);
    const userEmail = decoded.email; // Extract email from JWT

    try {
      setLoading(true);
      
      // Fetch visitor requests for the logged-in user
      const response = await fetch(`http://${ipPort}/api/visitor/requests/${userEmail}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch visitor requests");
      }

      setPendingRequests(data.visitors); // Set state with visitor requests
    } catch (error) {
      console.error("Error fetching visitor requests:", error);
      Alert.alert("Error", "Failed to fetch visitor requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = pendingRequests.filter(
    (request) =>
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery)
  );

  useEffect(() => {
    fetchVisitorRequests()
  }, [])
  
  const setDate = (date) => {
    setCheckInTime(date)
    setShowDateMenu(false)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "clock-outline"
      case "approved":
        return "check-circle-outline"
      case "rejected":
        return "close-circle-outline"
      default:
        return "help-circle-outline"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return theme.colors.accent
      case "approved":
        return theme.colors.focus
      case "rejected":
        return theme.colors.error
      default:
        return theme.colors.placeholder
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      default:
        return "Unknown"
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setDetailsDialogVisible(true);
  }

  const getRelationshipEmoji = (relationship) => {
    switch (relationship) {
      case "Family":
        return "👪"
      case "Friend":
        return "👥"
      case "Colleague":
        return "💼"
      case "Service Provider":
        return "🔧"
      case "Delivery":
        return "📦"
      case "Other":
        return "🤝"
      default:
        return "👤"
    }
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content
            title="Visitor Registration 📝"
            subtitle="Welcome, Resident!"
            titleStyle={styles.appbarTitle}
            subtitleStyle={styles.appbarSubtitle}
          />
          <Appbar.Action icon="bell-outline" onPress={() => {}} />
        </Appbar.Header>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={isTablet ? styles.tabletLayout : styles.phoneLayout}>
            <Card style={[styles.requestCard, isTablet && styles.tabletCard]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
                  <Title style={styles.cardTitle}>Request Visitor Registration</Title>
                </View>
                <Paragraph style={styles.cardDescription}>
                  🏠 Expecting guests? Let's make their visit smooth and secure!
                </Paragraph>
                <View style={styles.cardFeatures}>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.primary} />
                    <Text style={styles.featureText}>Enhanced Security</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="clock-fast" size={20} color={theme.colors.primary} />
                    <Text style={styles.featureText}>Quick Check-in</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MaterialCommunityIcons name="bell-ring" size={20} color={theme.colors.primary} />
                    <Text style={styles.featureText}>Arrival Notifications</Text>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={() => setDialogVisible(true)}
                  icon="plus"
                  style={styles.requestButton}
                  labelStyle={styles.buttonLabel}
                >
                  New Visitor Request
                </Button>
              </Card.Content>
            </Card>

            <Card style={[styles.pendingRequestsCard, isTablet && styles.tabletCard]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="format-list-bulleted" size={24} color={theme.colors.primary} />
                  <Title style={styles.cardTitle}>Your Visitor Requests</Title>
                </View>
                <Searchbar
                  placeholder="Search by name, email or phone"
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchBar}
                  icon="magnify"
                />
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading your requests...</Text>
                  </View>
                ) : filteredRequests.length > 0 ? (
                  <ScrollView style={styles.requestList}>
                    {filteredRequests.map((request, index) => (
                      <Surface key={request.id || index} style={styles.requestItem}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestNameContainer}>
                            <Text style={styles.requestName}>{request.name}</Text>
                            <Chip 
                              style={[styles.statusChip, { backgroundColor: `${getStatusColor(request.status)}20` }]}
                              textStyle={{ color: getStatusColor(request.status) }}
                              icon={() => <MaterialCommunityIcons name={getStatusIcon(request.status)} size={16} color={getStatusColor(request.status)} />}
                            >
                              {getStatusText(request.status)}
                            </Chip>
                          </View>
                          <IconButton
                            icon="information-outline"
                            color={theme.colors.primary}
                            size={20}
                            onPress={() => showRequestDetails(request)}
                            style={styles.infoButton}
                          />
                        </View>
                        
                        <View style={styles.requestDetails}>
                          <View style={styles.requestDetail}>
                            <MaterialCommunityIcons name="account-outline" size={16} color={theme.colors.text} />
                            <Text style={styles.detailText}>
                              {getRelationshipEmoji(request.relationship)} {request.relationship}
                            </Text>
                          </View>
                          <View style={styles.requestDetail}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.text} />
                            <Text style={styles.detailText}>
                              {formatDate(request.checkInTime)}
                            </Text>
                          </View>
                        </View>
                        
                        <Divider style={styles.divider} />
                      </Surface>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.colors.placeholder} />
                    <Text style={styles.emptyText}>No visitor requests found</Text>
                    <Text style={styles.emptySubtext}>Create a new request to get started</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>🆕 New Visitor Request</Dialog.Title>
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView contentContainerStyle={styles.dialogScrollViewContent}>
                <TextInput
                  label="Visitor's Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  onFocus={() => setFocusedInput("name")}
                  onBlur={() => setFocusedInput(null)}
                  outlineColor={focusedInput === "name" ? "#28A745" : theme.colors.placeholder}
                  activeOutlineColor="#28A745"
                  theme={{
                    colors: {
                      primary: "#28A745",
                    }
                  }}
                />

                <TextInput
                  label="Visitor's Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  left={<TextInput.Icon icon="email" />}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  outlineColor={focusedInput === "email" ? "#28A745" : theme.colors.placeholder}
                  activeOutlineColor="#28A745"
                  theme={{
                    colors: {
                      primary: "#28A745",
                    }
                  }}
                />

                <TextInput
                  label="Visitor's Phone"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={<TextInput.Icon icon="phone" />}
                  onFocus={() => setFocusedInput("phone")}
                  onBlur={() => setFocusedInput(null)}
                  outlineColor={focusedInput === "phone" ? "#28A745" : theme.colors.placeholder}
                  activeOutlineColor="#28A745"
                  theme={{
                    colors: {
                      primary: "#28A745",
                    }
                  }}
                />

                <TextInput
                  label="Purpose of Visit"
                  value={purpose}
                  onChangeText={setPurpose}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="clipboard-text" />}
                  onFocus={() => setFocusedInput("purpose")}
                  onBlur={() => setFocusedInput(null)}
                  outlineColor={focusedInput === "purpose" ? "#28A745" : theme.colors.placeholder}
                  activeOutlineColor="#28A745"
                  theme={{
                    colors: {
                      primary: "#28A745",
                    }
                  }}
                />

                <Text style={styles.pickerLabel}>Relationship to Visitor</Text>
                <View style={[
                  styles.pickerContainer, 
                  focusedInput === "relationship" && { borderColor: "#28A745", borderWidth: 2 }
                ]}>
                  <Picker
                    selectedValue={relationship}
                    onValueChange={(itemValue) => setRelationship(itemValue)}
                    style={styles.picker}
                    onFocus={() => setFocusedInput("relationship")}
                    onBlur={() => setFocusedInput(null)}
                  >
                    <Picker.Item label="Select Relationship" value="" />
                    <Picker.Item label="👪 Family" value="Family" />
                    <Picker.Item label="👥 Friend" value="Friend" />
                    <Picker.Item label="💼 Colleague" value="Colleague" />
                    <Picker.Item label="🔧 Service Provider" value="Service Provider" />
                    <Picker.Item label="📦 Delivery" value="Delivery" />
                    <Picker.Item label="🤝 Other" value="Other" />
                  </Picker>
                </View>

                <Text style={styles.dateLabel}>Expected Arrival Time</Text>
                <Menu
                  visible={showDateMenu}
                  onDismiss={() => setShowDateMenu(false)}
                  anchor={
                    <TouchableOpacity 
                      onPress={() => {
                        setShowDateMenu(true);
                        setFocusedInput("date");
                      }} 
                      style={[
                        styles.dateButton,
                        focusedInput === "date" && { borderColor: "#28A745", borderWidth: 2 }
                      ]}
                    >
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={24} 
                        color={focusedInput === "date" ? "#28A745" : theme.colors.primary} 
                      />
                      <Text style={styles.dateText}>{checkInTime.toLocaleString()}</Text>
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item onPress={() => setDate(new Date())} title="Now" />
                  <Menu.Item onPress={() => setDate(new Date(Date.now() + 3600000))} title="In 1 hour" />
                  <Menu.Item onPress={() => setDate(new Date(Date.now() + 7200000))} title="In 2 hours" />
                  <Menu.Item onPress={() => setDate(new Date(Date.now() + 86400000))} title="Tomorrow" />
                </Menu>

                <Button 
                  mode="contained" 
                  onPress={handleTakePhoto} 
                  style={styles.photoButton} 
                  icon="camera"
                  labelStyle={styles.buttonLabel}
                  color={focusedInput === "photo" ? "#28A745" : theme.colors.primary}
                  onPressIn={() => setFocusedInput("photo")}
                  onPressOut={() => setFocusedInput(null)}
                >
                  📸 Take Visitor's Photo
                </Button>
                
                {photo && (
                  <View style={styles.photoPreviewContainer}>
                    <Avatar.Image size={100} source={{ uri: photo }} style={styles.photo} />
                    <IconButton
                      icon="close-circle"
                      color={theme.colors.error}
                      size={24}
                      onPress={() => setPhoto(null)}
                      style={styles.removePhotoButton}
                    />
                  </View>
                )}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)} color={theme.colors.placeholder}>Cancel</Button>
              <Button 
                onPress={handleRequestVisitor} 
                mode="contained"
                color="#28A745"
              >
                Send Request
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={detailsDialogVisible} onDismiss={() => setDetailsDialogVisible(false)} style={styles.detailsDialog}>
            <Dialog.Title style={styles.dialogTitle}>Visitor Details</Dialog.Title>
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              {selectedRequest && (
                <ScrollView contentContainerStyle={styles.detailsScrollViewContent}>
                  <View style={styles.visitorDetailHeader}>
                    {selectedRequest.photo ? (
                      <Avatar.Image size={80} source={{ uri: selectedRequest.photo }} style={styles.detailPhoto} />
                    ) : (
                      <Avatar.Icon size={80} icon="account" style={styles.detailPhoto} />
                    )}
                    <View style={styles.visitorHeaderInfo}>
                      <Text style={styles.visitorName}>{selectedRequest.name}</Text>
                      <Chip 
                        style={[styles.statusChip, { backgroundColor: `${getStatusColor(selectedRequest.status)}20` }]}
                        textStyle={{ color: getStatusColor(selectedRequest.status) }}
                      >
                        {getStatusText(selectedRequest.status)}
                      </Chip>
                    </View>
                  </View>

                  <Divider style={styles.detailsDivider} />
                  
                  <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Relationship</Text>
                        <Text style={styles.detailValue}>
                          {getRelationshipEmoji(selectedRequest.relationship)} {selectedRequest.relationship}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedRequest.email}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="phone-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedRequest.phone}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Expected Arrival</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedRequest.checkInTime)}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Purpose of Visit</Text>
                        <Text style={styles.detailValue}>{selectedRequest.purpose}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              )}
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setDetailsDialogVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  appbar: {
    elevation: 4,
    backgroundColor: theme.colors.primary,
  },
  appbarTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  appbarSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  tabletLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  phoneLayout: {
    flexDirection: "column",
  },
  requestCard: {
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  pendingRequestsCard: {
    flex: 1,
    marginBottom: 16,
    elevation: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  tabletCard: {
    width: "48%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: 8,
  },
  cardDescription: {
    marginBottom: 16,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  cardFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  requestButton: {
    marginTop: 8,
    borderRadius: 8,
    elevation: 2,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 2,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    elevation: 2,
    borderRadius: 8,
  },
  requestList: {
    maxHeight: 400,
  },
  requestItem: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
    padding: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: 8,
  },
  statusChip: {
    height: 32,
    marginVertical: 4,
  },
  infoButton: {
    margin: 0,
  },
  requestDetails: {
    marginBottom: 8,
  },
  requestDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  divider: {
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  pickerLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
  },
  picker: {
    marginBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  dateLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
  },
  dateText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  photoButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  photoPreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: 'relative',
  },
  photo: {
    alignSelf: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  dialogScrollViewContent: {
    padding: 16,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogTitle: {
    textAlign: 'center',
    color: theme.colors.primary,
    fontSize: 20,
  },
  dialogScrollArea: {
    maxHeight: 500,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: theme.colors.placeholder,
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  detailsDialog: {
    borderRadius: 12,
  },
  detailsScrollViewContent: {
    padding: 16,
  },
  visitorDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailPhoto: {
    marginRight: 16,
    backgroundColor: theme.colors.primary,
  },
  visitorHeaderInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  detailsDivider: {
    marginVertical: 12,
  },
  detailsSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
  },
})

export default VisitorManagementScreen