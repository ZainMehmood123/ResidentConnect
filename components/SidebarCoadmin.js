import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function Side2({ navigation }) {
  const [activeRoute, setActiveRoute] = useState("coadmindashboard");
  const [expanded, setExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280); // Control the sidebar width via state
  const fadeAnim = new Animated.Value(1);
  const { height } = Dimensions.get("window");

  // Update active route whenever navigation state changes
  useEffect(() => {
    const unsubscribe = navigation.addListener("state", (e) => {
      if (e.data.state.routes && e.data.state.routes.length > 0) {
        const currentRoute = e.data.state.routes[e.data.state.index].name;
        setActiveRoute(currentRoute);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const toggleSidebar = () => {
    // Navigate to "CoAdminDashboard" and remove the dashboard from the sidebar
    navigation.navigate("CoAdminDashboard");

    // Animate text opacity first
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setExpanded(!expanded);
      setSidebarWidth(expanded ? 80 : 280); // Set the new width based on the expanded state

      // Animate text back in after expanding
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        delay: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const navigateTo = (routeName) => {
    setActiveRoute(routeName);
    navigation.navigate(routeName);
  };

  const handleLogout = () => {
    console.log("User logged out");
    navigation.navigate("CoAdminLogin");
  };

  // Define menu items with icons, labels, and routes
  const menuItems = [
    {
      icon: "people-outline",
      label: "Manage Residents",
      route: "ManageResidents",
      category: "main",
    },
    {
      icon: "business-center",
      label: "View Visitor Details",
      route: "viewvisitordetails",
      category: "main",
    },
    {
      icon: "analytics",
      label: "Data Analytics",
      route: "dataanalyticsandreporting",
      category: "main",
    },
    {
      icon: "warning",
      label: "Emergency Alert",
      route: "EmergencyAlertsScreen",
      category: "main",
    },
    {
      icon: "dashboard",
      label: "Dashboard",
      route: "coadmindashboard", // Correct the route to coadmindashboard.js
      category: "main",
    },
  ];

  // Remove the "Dashboard" menu item when sidebar is toggled
  const filteredMenuItems = menuItems.filter(
    (item) => item.route !== "coadmindashboard"
  );

  // Group menu items by category
  const mainMenuItems = filteredMenuItems.filter(
    (item) => item.category === "main"
  );
  const systemMenuItems = filteredMenuItems.filter(
    (item) => item.category === "system"
  );

  const renderMenuItem = (item) => {
    const isActive = activeRoute === item.route;

    return (
      <TouchableOpacity
        key={item.route}
        style={[styles.menuItem, isActive && styles.activeMenuItem]}
        onPress={() => navigateTo(item.route)}
        activeOpacity={0.7}
      >
        <View
          style={[styles.iconContainer, isActive && styles.activeIconContainer]}
        >
          <Icon
            name={item.icon}
            size={24}
            color={isActive ? "#fff" : "#135387"}
          />
        </View>

        {expanded && (
          <Animated.Text
            style={[
              styles.menuText,
              isActive && styles.activeMenuText,
              { opacity: fadeAnim },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Animated.Text>
        )}

        {isActive && expanded && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { width: sidebarWidth }]}>
      <LinearGradient colors={["#f5f7fa", "#ffffff"]} style={styles.gradient}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ minHeight: height - 100 }}
        >
          {/* Header with toggle button */}
          <View style={styles.header}>
            {expanded ? (
              <Text style={styles.headerText}>Menu</Text>
            ) : (
              <Text style={styles.headerInitial}>M</Text>
            )}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleSidebar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={expanded ? "chevron-left" : "chevron-right"}
                size={24}
                color="#135387"
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Main Menu Section */}
          <View style={styles.menuSection}>
            {expanded && (
              <Animated.Text
                style={[styles.menuSectionTitle, { opacity: fadeAnim }]}
              >
                Main Menu
              </Animated.Text>
            )}
            {mainMenuItems.map(renderMenuItem)}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* System Menu Section */}
          <View style={styles.menuSection}>
            {expanded && (
              <Animated.Text
                style={[styles.menuSectionTitle, { opacity: fadeAnim }]}
              >
                
              </Animated.Text>
            )}
            {systemMenuItems.map(renderMenuItem)}
          </View>

          {/* Spacer to push logout to bottom */}
          <View style={styles.spacer} />

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              !expanded && styles.logoutButtonCollapsed,
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#135387", "#1976D2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
              <Icon name="exit-to-app" size={24} color="#fff" />
              {expanded && (
                <Animated.Text
                  style={[styles.logoutText, { opacity: fadeAnim }]}
                >
                  Logout
                </Animated.Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "white",
    overflow: "hidden",
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  gradient: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#135387",
  },
  headerInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#135387",
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(19, 83, 135, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  menuSection: {
    marginTop: 10,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 10,
    marginHorizontal: 10,
    position: "relative",
  },
  activeMenuItem: {
    backgroundColor: "#135387",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
    flex: 1,
  },
  activeMenuText: {
    color: "#fff",
    fontWeight: "bold",
  },
  activeIndicator: {
    position: "absolute",
    right: 15,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    overflow: "hidden",
  },
  logoutButtonCollapsed: {
    alignSelf: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
});
