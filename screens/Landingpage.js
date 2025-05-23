import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  FlatList,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { BlurView } from "expo-blur";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
const { width, height } = Dimensions.get("window");

// Responsive size functions
const wp = (percentage) => (percentage * width) / 100;
const hp = (percentage) => (percentage * height) / 100;
const normalize = (size) => {
  const scale = width / 375;
  return Math.round(Platform.OS === "ios" ? size * scale : size * scale - 2);
};

const LandingPage = ({ route, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [societies, setSocieties] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await fetch(
          `http://${ipPort}/api/registered-societies`
        );
        const data = await response.json();
        setSocieties(data);
      } catch (error) {
        console.error("Error fetching societies:", error);
        alert("Failed to fetch societies");
      }
    };

    fetchSocieties();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, translateY]);

  useEffect(() => {
    if (route.params?.societyName) {
      const newSociety = {
        id: (societies.length + 1).toString(),
        name: route.params.societyName,
      };
      setSocieties((prevSocieties) => [...prevSocieties, newSociety]);
    }
  }, [route.params?.societyName, societies.length]);

  const handleSelectSociety = (societyName) => {
    setModalVisible(false);
    navigation.navigate("Landing", { societyName });
  };

  const handleAddNewSociety = () => {
    setModalVisible(false);
    navigation.navigate("AddNewSociety");
  };

  const handleSuperAdminLogin = () => {
    navigation.navigate("Superadminlogin");
  };

  const renderSocietyItem = ({ item, index }) => {
    const itemScale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(itemScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(itemScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.societyItemContainer,
          { transform: [{ scale: itemScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.societyItem}
          onPress={() => handleSelectSociety(item.society_name)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <LinearGradient
            colors={["#135387", "#1E88E5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.societyItemGradient}
          >
            <FontAwesome5 name="building" size={24} color="#FFB000" />
            <Text style={styles.societyName}>{item.society_name}</Text>
            <Ionicons name="chevron-forward" size={24} color="#FFB000" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["white", "#1E88E5"]} style={styles.gradient}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY }],
            },
          ]}
        >
          <Image source={require("../assets/SA.png")} style={styles.logo} />
          <View style={styles.innerContainer}>
            <Text style={styles.appName}>ResidentConnect</Text>
            <Text style={styles.description}>
              "Welcome to ResidentConnect! Manage your society efficiently and
              stay connected with your neighbors."
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.buttonText}>Select a society</Text>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Login as a Super Admin?</Text>
              <TouchableOpacity onPress={handleSuperAdminLogin}>
                <Text style={styles.signupLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <BlurView intensity={100} style={styles.modalOverlay} tint="dark">
            <Animated.View
              style={[
                styles.modalContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.modalTitle}>Select a Society</Text>
              <FlatList
                data={societies}
                keyExtractor={(item) => item._id}
                style={styles.societyList}
                renderItem={renderSocietyItem}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <LottieView
                      source={require("../assets/empty-animation.json")}
                      autoPlay
                      loop
                      style={styles.emptyAnimation}
                    />
                    <Text style={styles.emptyText}>
                      No societies found. Please add one.
                    </Text>
                  </View>
                }
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewSociety}
              >
                <LinearGradient
                  colors={["#28A745", "#218838"]}
                  style={styles.addButtonGradient}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#ffffff"
                  />
                  <Text style={styles.addButtonText}>Add New Society</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    width: wp(60),
    height: hp(30),
    resizeMode: "contain",
    marginBottom: hp(2),
  },
  innerContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    margin: wp(5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appName: {
    fontSize: normalize(32),
    color: "#135387",
    fontWeight: "bold",
    marginBottom: hp(2),
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  description: {
    fontSize: normalize(18),
    fontStyle: "italic",
    color: "#333",
    textAlign: "center",
    marginBottom: hp(3),
    paddingHorizontal: wp(5),
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#135387",
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: normalize(18),
    color: "#ffffff",
    fontWeight: "bold",
    marginRight: 10,
  },
  signupContainer: {
    flexDirection: "row",
    marginTop: hp(2),
  },
  signupText: {
    fontSize: normalize(16),
    color: "#333",
  },
  signupLink: {
    fontSize: normalize(16),
    color: "#28A745",
    fontWeight: "bold",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: wp(5),
    width: "90%",
    maxHeight: hp(80),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: normalize(24),
    fontWeight: "bold",
    color: "#135387",
    marginBottom: hp(2),
    textAlign: "center",
  },
  societyList: {
    maxHeight: hp(50),
  },
  societyItemContainer: {
    marginBottom: 10,
  },
  societyItem: {
    borderRadius: 15,
    overflow: "hidden",
  },
  societyItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  societyName: {
    fontSize: normalize(16),
    color: "#ffffff",
    fontWeight: "bold",
    flex: 1,
    marginLeft: 10,
  },
  addButton: {
    borderRadius: 25,
    marginTop: hp(2),
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: hp(2),
  },
  addButtonText: {
    fontSize: normalize(16),
    color: "#ffffff",
    fontWeight: "bold",
    marginLeft: 10,
  },
  closeButton: {
    backgroundColor: "#FFB000",
    paddingVertical: hp(2),
    borderRadius: 25,
    marginTop: hp(2),
  },
  closeButtonText: {
    fontSize: normalize(16),
    color: "#135387",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  emptyText: {
    color: "#333",
    textAlign: "center",
    marginTop: hp(2),
    fontSize: normalize(14),
  },
});

export default LandingPage;
