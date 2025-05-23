// import React, { useState, useEffect } from "react";
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   ScrollView, 
//   Animated, 
//   Dimensions,
//   Platform
// } from "react-native";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { LinearGradient } from "expo-linear-gradient";

// export default function Sidebar({ navigation }) {
//   const [activeRoute, setActiveRoute] = useState("DashboardScreen");
//   const [expanded, setExpanded] = useState(true);
//   const animatedWidth = new Animated.Value(expanded ? 280 : 80);
//   const fadeAnim = new Animated.Value(1);
//   const { height } = Dimensions.get('window');

//   // Get current route on mount and when navigation state changes
//   useEffect(() => {
//     const unsubscribe = navigation.addListener('state', (e) => {
//       const currentRoute = e.data.state.routes[e.data.state.index].name;
//       setActiveRoute(currentRoute);
//     });

//     return unsubscribe;
//   }, [navigation]);

//   const toggleSidebar = () => {
//     // Animate text opacity
//     Animated.timing(fadeAnim, {
//       toValue: 0,
//       duration: 100,
//       useNativeDriver: true,
//     }).start(() => {
//       setExpanded(!expanded);
      
//       // Animate sidebar width
//       Animated.timing(animatedWidth, {
//         toValue: expanded ? 80 : 280,
//         duration: 300,
//         useNativeDriver: false,
//       }).start();
      
//       // Animate text back in
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 200,
//         delay: 200,
//         useNativeDriver: true,
//       }).start();
//     });
//   };

//   const navigateTo = (routeName) => {
//     setActiveRoute(routeName);
//     navigation.navigate(routeName);
//   };

//   const handleLogout = () => {
//     console.log("User logged out");
//     navigation.navigate('ResidentLogin');
//   };

//   const menuItems = [
//     { icon: "dashboard", label: "Dashboard", route: "DashboardScreen" },
//     { icon: "event", label: "Event Management", route: "Eventmanagement" },
//     { icon: "report-problem", label: "Report Issue", route: "ReportIssueScreen" },
//     { icon: "monetization-on", label: "Fundraising", route: "Fundraising" },
//     { icon: "share", label: "Resource Sharing", route: "ResourceSharingScreen" },
//     { icon: "warning", label: "Emergency Alerts", route: "EmergencyAlertsScreen" },
//     { icon: "people", label: "Resident Directory", route: "ResidentDirectoryScreen" },
//     { icon: "business-center", label: "Visitor Management", route: "VisitorManagementScreen" },
//     { icon: "feedback", label: "Feedback", route: "Feedback" },
//   ];

//   // Group menu items by category
//   const mainMenuItems = menuItems.slice(0, 4);
//   const communityMenuItems = menuItems.slice(4);

//   const renderMenuItem = (item) => {
//     const isActive = activeRoute === item.route;
    
//     return (
//       <TouchableOpacity
//         key={item.route}
//         style={[
//           styles.menuItem,
//           isActive && styles.activeMenuItem
//         ]}
//         onPress={() => navigateTo(item.route)}
//         activeOpacity={0.7}
//       >
//         <View style={styles.iconContainer}>
//           <Icon name={item.icon} size={24} color={isActive ? "#fff" : "#135387"} />
//         </View>
        
//         {expanded && (
//           <Animated.Text 
//             style={[
//               styles.menuText, 
//               isActive && styles.activeMenuText,
//               { opacity: fadeAnim }
//             ]}
//             numberOfLines={1}
//           >
//             {item.label}
//           </Animated.Text>
//         )}
        
//         {isActive && expanded && (
//           <View style={styles.activeIndicator} />
//         )}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <Animated.View style={[styles.container, { width: animatedWidth }]}>
//       <LinearGradient
//         colors={['#f5f7fa', '#ffffff']}
//         style={styles.gradient}
//       >
//         <ScrollView 
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ minHeight: height - 100 }}
//         >
//           {/* Header with toggle button */}
//           <View style={styles.header}>
//             {expanded ? (
//               <Text style={styles.headerText}>Menu</Text>
//             ) : (
//               <Text style={styles.headerInitial}>M</Text>
//             )}
//             <TouchableOpacity 
//               style={styles.toggleButton} 
//               onPress={toggleSidebar}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//             >
//               <Icon 
//                 name={expanded ? "chevron-left" : "chevron-right"} 
//                 size={24} 
//                 color="#135387" 
//               />
//             </TouchableOpacity>
//           </View>

//           {/* Divider */}
//           <View style={styles.divider} />

//           {/* Main Menu Section */}
//           <View style={styles.menuSection}>
//             {expanded && (
//               <Animated.Text style={[styles.menuSectionTitle, { opacity: fadeAnim }]}>
//                 Main Menu
//               </Animated.Text>
//             )}
//             {mainMenuItems.map(renderMenuItem)}
//           </View>

//           {/* Divider */}
//           <View style={styles.divider} />

//           {/* Community Menu Section */}
//           <View style={styles.menuSection}>
//             {expanded && (
//               <Animated.Text style={[styles.menuSectionTitle, { opacity: fadeAnim }]}>
//                 Community
//               </Animated.Text>
//             )}
//             {communityMenuItems.map(renderMenuItem)}
//           </View>

//           {/* Spacer to push logout to bottom */}
//           <View style={styles.spacer} />

//           {/* Logout Button */}
//           <TouchableOpacity 
//             style={[
//               styles.logoutButton,
//               !expanded && styles.logoutButtonCollapsed
//             ]} 
//             onPress={handleLogout}
//             activeOpacity={0.8}
//           >
//             <LinearGradient
//               colors={['#ff3b30', '#ff5e3a']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={styles.logoutGradient}
//             >
//               <Icon name="exit-to-app" size={24} color="#fff" />
//               {expanded && (
//                 <Animated.Text style={[styles.logoutText, { opacity: fadeAnim }]}>
//                   Logout
//                 </Animated.Text>
//               )}
//             </LinearGradient>
//           </TouchableOpacity>
//         </ScrollView>
//       </LinearGradient>
//     </Animated.View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "white",
//     overflow: "hidden",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 5,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   gradient: {
//     flex: 1,
//     paddingVertical: 20,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingBottom: 15,
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#135387",
//   },
//   headerInitial: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#135387",
//   },
//   toggleButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "rgba(19, 83, 135, 0.1)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.1)",
//     marginVertical: 10,
//     marginHorizontal: 20,
//   },
//   menuSection: {
//     marginTop: 10,
//   },
//   menuSectionTitle: {
//     fontSize: 12,
//     fontWeight: "bold",
//     color: "#888",
//     textTransform: "uppercase",
//     marginLeft: 20,
//     marginBottom: 10,
//     letterSpacing: 1,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     marginVertical: 2,
//     borderRadius: 10,
//     marginHorizontal: 10,
//     position: "relative",
//   },
//   activeMenuItem: {
//     backgroundColor: "#135387",
//   },
//   iconContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     alignItems: "center",
//     justifyContent: "center",
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.1,
//         shadowRadius: 2,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   menuText: {
//     fontSize: 16,
//     marginLeft: 15,
//     color: "#333",
//     flex: 1,
//   },
//   activeMenuText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   activeIndicator: {
//     position: "absolute",
//     right: 15,
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: "#fff",
//   },
//   spacer: {
//     flex: 1,
//     minHeight: 20,
//   },
//   logoutButton: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//     borderRadius: 30,
//     overflow: "hidden",
//   },
//   logoutButtonCollapsed: {
//     alignSelf: "center",
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   logoutGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//   },
//   logoutText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     marginLeft: 10,
//   },
// });

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Dimensions,
  Platform
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function Sidebar({ navigation }) {
  const [activeRoute, setActiveRoute] = useState("DashboardScreen");
  const [expanded, setExpanded] = useState(true);
  const animatedWidth = new Animated.Value(expanded ? 280 : 80);
  const fadeAnim = new Animated.Value(1);
  const { height } = Dimensions.get('window');

  // Get current route on mount and when navigation state changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      const currentRoute = e.data.state.routes[e.data.state.index].name;
      setActiveRoute(currentRoute);
    });

    return unsubscribe;
  }, [navigation]);

  const toggleSidebar = () => {
    // Animate text opacity
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setExpanded(!expanded);
      
      // Animate sidebar width
      Animated.timing(animatedWidth, {
        toValue: expanded ? 80 : 280,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      // Animate text back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        delay: 200,
        useNativeDriver: true,
      }).start();
      
      // Navigate to DashboardScreen after toggling
      navigation.navigate('DashboardScreen');
    });
  };

  const navigateTo = (routeName) => {
    setActiveRoute(routeName);
    navigation.navigate(routeName);
  };

  const handleLogout = () => {
    console.log("User logged out");
    navigation.navigate('ResidentLogin');
  };

  const menuItems = [
    { icon: "dashboard", label: "Dashboard", route: "DashboardScreen" },
    { icon: "event", label: "Event Management", route: "Eventmanagement" },
    { icon: "report-problem", label: "Report Issue", route: "ReportIssueScreen" },
    { icon: "monetization-on", label: "Fundraising", route: "Fundraising" },
    { icon: "share", label: "Resource Sharing", route: "ResourceSharingScreen" },
    { icon: "warning", label: "Emergency Alerts", route: "EmergencyAlertsScreen" },
    { icon: "people", label: "Resident Directory", route: "ResidentDirectoryScreen" },
    { icon: "business-center", label: "Visitor Management", route: "VisitorManagementScreen" },
    { icon: "feedback", label: "Feedback", route: "Feedback" },
  ];

  // Group menu items by category
  const mainMenuItems = menuItems.slice(0, 4);
  const communityMenuItems = menuItems.slice(4);

  const renderMenuItem = (item) => {
    const isActive = activeRoute === item.route;
    
    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.menuItem,
          isActive && styles.activeMenuItem
        ]}
        onPress={() => navigateTo(item.route)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={24} color={isActive ? "#fff" : "#135387"} />
        </View>
        
        {expanded && (
          <Animated.Text 
            style={[
              styles.menuText, 
              isActive && styles.activeMenuText,
              { opacity: fadeAnim }
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Animated.Text>
        )}
        
        {isActive && expanded && (
          <View style={styles.activeIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[styles.container, { width: animatedWidth }]}>
      <LinearGradient
        colors={['#f5f7fa', '#ffffff']}
        style={styles.gradient}
      >
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
              <Animated.Text style={[styles.menuSectionTitle, { opacity: fadeAnim }]}>
                Main Menu
              </Animated.Text>
            )}
            {mainMenuItems.map(renderMenuItem)}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Community Menu Section */}
          <View style={styles.menuSection}>
            {expanded && (
              <Animated.Text style={[styles.menuSectionTitle, { opacity: fadeAnim }]}>
                Community
              </Animated.Text>
            )}
            {communityMenuItems.map(renderMenuItem)}
          </View>

          {/* Spacer to push logout to bottom */}
          <View style={styles.spacer} />

          {/* Logout Button */}
          <TouchableOpacity 
            style={[
              styles.logoutButton,
              !expanded && styles.logoutButtonCollapsed
            ]} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff3b30', '#ff5e3a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutGradient}
            >
              <Icon name="exit-to-app" size={24} color="#fff" />
              {expanded && (
                <Animated.Text style={[styles.logoutText, { opacity: fadeAnim }]}>
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
    flex: 1,
    backgroundColor: "white",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
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
