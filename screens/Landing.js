import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet, SafeAreaView } from "react-native"
import Constants from "expo-constants"

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO
const { width, height } = Dimensions.get("window")

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.05,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: height * 0.02,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#135387",
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.275,
    borderRadius: 25,
    marginVertical: height * 0.015,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    fontSize: Math.min(width * 0.05, 24),
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
})

export default function Landing({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/SA.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CoAdminLogin")}>
            <Text style={styles.buttonText}>Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ResidentLogin")}>
            <Text style={styles.buttonText}>Resident</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

