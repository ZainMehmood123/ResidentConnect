import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Constants from "expo-constants";
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const cosettings = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => console.log("Logged out") },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="person" size={30} color="#FFD700" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Profile</Text>
            <Text style={styles.settingSubtitle}>
              View and update your profile
            </Text>
          </View>
          <Icon name="chevron-right" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* Notification Preferences */}
        <View style={styles.settingItem}>
          <Icon name="notifications" size={30} color="#FFD700" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>
              Enable or disable emergency alerts
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={() => setNotificationsEnabled(!notificationsEnabled)}
            thumbColor={notificationsEnabled ? "#FFD700" : "#888"}
            trackColor={{ false: "#555", true: "#FFD700" }}
          />
        </View>

        {/* Password Update */}
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="lock" size={30} color="#FFD700" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Change Password</Text>
            <Text style={styles.settingSubtitle}>
              Update your account password
            </Text>
          </View>
          <Icon name="chevron-right" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* Theme Settings */}
        <View style={styles.settingItem}>
          <Icon name="brightness-6" size={30} color="#FFD700" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Dark Mode</Text>
            <Text style={styles.settingSubtitle}>
              Switch between light and dark mode
            </Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={() => setDarkModeEnabled(!darkModeEnabled)}
            thumbColor={darkModeEnabled ? "#FFD700" : "#888"}
            trackColor={{ false: "#555", true: "#FFD700" }}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFD700",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginLeft: 15,
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFD700",
  },
  settingSubtitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    backgroundColor: "#FF0000",
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 10,
  },
});

export default cosettings;
