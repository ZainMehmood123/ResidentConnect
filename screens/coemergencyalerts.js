"use client"
import { useState, useCallback } from "react"
import { View, StyleSheet, ScrollView, useWindowDimensions, Alert, Platform } from "react-native"
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Appbar,
  Chip,
  Avatar,
  Badge,
  IconButton,
  Snackbar,
  Provider as PaperProvider,
  DefaultTheme,
} from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import { useFocusEffect } from "@react-navigation/native"
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#135387",
    accent: "#28A745",
    background: "#F0F4F8",
  },
}

const EmergencyAlertsScreen = () => {
  const [alertType, setAlertType] = useState("")
  const [alertDetails, setAlertDetails] = useState("")
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const { width, height } = useWindowDimensions()

  const isTablet = width >= 768
  const isLandscape = width > height

  const decodeJWT = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAlerts()
    }, []),
  )

  const fetchAlerts = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "No token found, please log in.");
        return;
      }
  
      // Decode JWT to get user email
      const decoded = decodeJWT(token);
      const userEmail = decoded?.email;
  
      if (!userEmail) {
        console.error("Error: User email not found in token.");
        Alert.alert("Error", "Invalid token. Please log in again.");
        return;
      }
  
      console.log("Fetching alerts for user:", userEmail); // Debugging log
  
      setLoading(true);
      const response = await fetch(`http://${ipPort}/api/emergency/showalerts/${userEmail}`);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch alerts");
      }
  
      const data = await response.json();
      console.log("Fetched Alerts:", data.alerts); // Debugging log
      setAlerts(data.alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      Alert.alert("Error", "Error fetching alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  
  

  const validateAlertDetails = (details) => {
    const regex = /^[a-zA-Z0-9\s.,!?-]{10,200}$/
    return regex.test(details)
  }

  const handleAlertDetailsChange = (text) => {
    setAlertDetails(text)
  }

  const handleSendAlert = async () => {
    if (!alertType || !alertDetails) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }
  
    if (!validateAlertDetails(alertDetails)) {
      Alert.alert(
        "Invalid Input",
        "Please enter 10-200 characters. Only letters, numbers, spaces, and basic punctuation (.,!?-) are allowed."
      );
      return;
    }
  
    if (!["fire", "security", "medical", "weather", "traffic", "chemical"].includes(alertType)) {
      Alert.alert("Invalid Alert Type", "Please select a valid alert type.");
      return;
    }
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) {
      Alert.alert("Error", "No token found, please log in.");
      return;
    }

    // Decode JWT to get user email
    const decoded = decodeJWT(token);
    const userEmail = decoded.email; 
  
    setLoading(true);
    console.log("Detail:",alertType,alertDetails,userEmail)
    try {
      const response = await fetch(`http://${ipPort}/api/emergency/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: alertType,
          details: alertDetails,
          userEmail, 
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setAlerts((prevAlerts) => [data.alert, ...prevAlerts]);
        setSnackbarVisible(true);
        setAlertType("");
        setAlertDetails("");
        Alert.alert("Alert Created Successfully.")
      } else {
        Alert.alert("Error", data.message || "Failed to send alert.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to connect to server.");
    }
  
    setLoading(false);
  };

  const shareAlert = async (alertId) => {
    try {
      const response = await fetch(`http://${ipPort}/api/emergency/share-alert/${alertId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      alert(data.message); 
    } catch (error) {
      console.error("Error sharing alert:", error);
    }
  };
  
  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch(`http://${ipPort}/api/emergency/delete-alert/${alertId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
      alert(data.message); 
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };
  
  
  

  const getAlertIcon = (type) => {
    switch (type) {
      case "fire":
        return "fire"
      case "security":
        return "shield-alert"
      case "medical":
        return "medical-bag"
      case "weather":
        return "weather-lightning"
      case "traffic":
        return "car"
      case "chemical":
        return "flask"
      default:
        return "alert-circle"
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case "fire":
        return "#FF3B30"
      case "security":
        return "#FF9500"
      case "medical":
        return "#34C759"
      case "weather":
        return "#5856D6"
      case "traffic":
        return "#FF2D55"
      case "chemical":
        return "#AF52DE"
      default:
        return "#8E8E93"
    }
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content
            title="Emergency Alerts"
            subtitle="Stay informed, stay safe"
            titleStyle={styles.appbarTitle}
            subtitleStyle={styles.appbarSubtitle}
          />
        </Appbar.Header>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View
            style={[
              isTablet || isLandscape ? styles.tabletLayout : styles.phoneLayout,
              { flexDirection: isLandscape ? "row" : "column" },
            ]}
          >
            <Card
              style={[
                styles.inputCard,
                (isTablet || isLandscape) && styles.tabletInputCard,
                isLandscape && { width: "45%" },
              ]}
            >
              <Card.Content>
                <Picker
                  selectedValue={alertType}
                  style={styles.picker}
                  onValueChange={(itemValue) => setAlertType(itemValue)}
                >
                  <Picker.Item label="Select Emergency Type" value="" />
                  <Picker.Item label="🔥 Fire" value="fire" />
                  <Picker.Item label="🛡️ Security Breach" value="security" />
                  <Picker.Item label="🚑 Medical" value="medical" />
                  <Picker.Item label="🌩️ Weather" value="weather" />
                  <Picker.Item label="🚗 Traffic" value="traffic" />
                  <Picker.Item label="🧪 Chemical Spill" value="chemical" />
                </Picker>

                <TextInput
                  label="Alert Details"
                  value={alertDetails}
                  onChangeText={handleAlertDetailsChange}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  mode="outlined"
                  outlineColor={theme.colors.primary}
                />

                <Button
                  mode="contained"
                  onPress={handleSendAlert}
                  loading={loading}
                  
                  style={styles.button}
                >
                  Create Alert
                </Button>
              </Card.Content>
            </Card>

            <View
              style={[
                isTablet || isLandscape ? styles.tabletAlertsContainer : styles.phoneAlertsContainer,
                isLandscape && { width: "55%", paddingLeft: 16 },
              ]}
            >
              <Title style={styles.recentAlertsTitle}>Recent Alerts</Title>
              <ScrollView style={[styles.alertsScrollView, { maxHeight: isLandscape ? height - 100 : "60vh" }]}>
                {alerts.map((item) => (
                  <Card key={item.id} style={styles.alertCard}>
                    <Card.Content>
                      <View style={styles.alertHeader}>
                        <Avatar.Icon
                          size={40}
                          icon={getAlertIcon(item.type)}
                          style={{ backgroundColor: getAlertColor(item.type) }}
                        />
                        <Title style={styles.alertType}>{item.type.toUpperCase()}</Title>
                        <Badge style={[styles.urgencyBadge, { backgroundColor: getAlertColor(item.type) }]}>
                          URGENT
                        </Badge>
                      </View>
                      <Paragraph style={styles.alertDetails}>{item.details}</Paragraph>
                      <Chip icon="clock-outline" style={styles.timestampChip}>
                        {item.timestamp}
                      </Chip>
                    </Card.Content>
                    <Card.Actions>
                      <IconButton
                        icon="share-variant"
                        onPress={() => shareAlert(item._id)}
                      />
                      
                    </Card.Actions>
                  </Card>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          action={{
            label: "OK",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          Alert sent successfully!
        </Snackbar>
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
    height: 56,
    backgroundColor: theme.colors.primary,
  },
  appbarTitle: {
    color: "#FFFFFF",
    fontSize: Platform.OS === "web" ? 20 : 18,
  },
  appbarSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: Platform.OS === "web" ? 14 : 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tabletLayout: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  phoneLayout: {
    flexDirection: "column",
  },
  inputCard: {
    marginBottom: 16,
    elevation: 4,
  },
  tabletInputCard: {
    flex: 1,
    marginRight: 16,
  },
  picker: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    height: 50,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  tabletAlertsContainer: {
    flex: 1,
  },
  phoneAlertsContainer: {
    marginTop: 16,
  },
  recentAlertsTitle: {
    marginBottom: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    fontSize: Platform.OS === "web" ? 24 : 20,
  },
  alertsScrollView: {
    maxHeight: Platform.OS === "web" ? "60vh" : "100%",
  },
  alertCard: {
    marginBottom: 16,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  alertType: {
    marginLeft: 8,
    flex: 1,
    fontSize: Platform.OS === "web" ? 18 : 16,
  },
  urgencyBadge: {
    alignSelf: "flex-start",
  },
  alertDetails: {
    marginBottom: 8,
    fontSize: Platform.OS === "web" ? 16 : 14,
  },
  timestampChip: {
    alignSelf: "flex-start",
  },
})

export default EmergencyAlertsScreen

