"use client";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const { width } = Dimensions.get("window");

const Eventmanagement = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["white", "#1E88E5"]} style={styles.header}>
        <Image
          source={require("../assets/final_logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Event Management </Text>
      </LinearGradient>

      <View style={styles.content}>
        <LottieView
          source={require("../assets/event-animation.json")}
          autoPlay
          loop
          style={styles.animation}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Createevent")}
        >
          <Icon
            name="add-circle-outline"
            size={30}
            color="white"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Create an Event 📅</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Updateevent")}
        >
          <Icon name="edit" size={30} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Update an Event 🔄</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Deleteevent")}
        >
          <Icon
            name="delete"
            size={30}
            color="white"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Delete an Event 🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Viewevent")}
        >
          <Icon
            name="visibility"
            size={30}
            color="white"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>View an Event 👀</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Manage your events with ease! 🚀</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  header: {
    padding: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6 * (250 / 320), // Maintain aspect ratio
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#135387",
    textAlign: "center",
    marginBottom: 10,
    textShadowOffset: { width: -1, height: 1 },
  },
  content: {
    padding: 20,
  },
  animation: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#135387",
    borderRadius: 15,
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    marginLeft: 15,
  },
  buttonIcon: {
    color: "white",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: "#135387",
    fontWeight: "bold",
  },
});

export default Eventmanagement;
