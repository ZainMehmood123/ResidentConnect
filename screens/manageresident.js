// import React, { useState, useEffect } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native"
// import { Ionicons } from "@expo/vector-icons"
// import Constants from "expo-constants"
// import { LinearGradient } from "expo-linear-gradient"

// const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

// const ManageResidents = ({ navigation }) => {
//   const [residents, setResidents] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchResidents = async () => {
//       try {
//         const response = await fetch(`http://${ipPort}/api/manageresidents/accounts`)
//         const data = await response.json()
//         console.log("Response Data:", data)

//         if (Array.isArray(data)) {
//           const mappedResidents = data.map((resident) => ({
//             id: resident._id,
//             name: `${resident.firstName} ${resident.lastName}`,
//             status: resident.status,
//           }))
//           setResidents(mappedResidents)
//         } else {
//           Alert.alert("Error", "Received data is not in the expected format")
//         }
//       } catch (error) {
//         Alert.alert("Error", "Failed to fetch residents")
//         console.error(error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchResidents()
//   }, [])

//   const handleActivate = (id) => {
//     Alert.alert("Activate Account", `Are you sure you want to activate Resident ID: ${id}?`, [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Activate",
//         onPress: async () => {
//           try {
//             const response = await fetch(`http://${ipPort}/api/manageresidents/activate/${id}`, {
//               method: "PUT",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({ status: "Active" }),
//             })

//             const data = await response.json()
//             if (response.status === 200) {
//               Alert.alert("Success", "Resident account activated successfully.")
//               setResidents((prevResidents) =>
//                 prevResidents.map((resident) => (resident.id === id ? { ...resident, status: "Active" } : resident)),
//               )
//             } else {
//               Alert.alert("Error", data.message || "Failed to activate resident account.")
//             }
//           } catch (error) {
//             Alert.alert("Error", "There was an error activating the account.")
//             console.error(error)
//           }
//         },
//       },
//     ])
//   }

//   const handleDeactivate = async (id) => {
//     Alert.alert("Deactivate Account", `Are you sure you want to deactivate Resident ID: ${id}?`, [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Deactivate",
//         onPress: async () => {
//           try {
//             const response = await fetch(`http://${ipPort}/api/manageresidents/deactivate/${id}`, {
//               method: "PUT",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify({ status: "Inactive" }),
//             })

//             const data = await response.json()
//             if (response.ok) {
//               Alert.alert("Success", `Resident ID: ${id} has been deactivated.`)
//               setResidents((prevResidents) =>
//                 prevResidents.map((resident) => (resident.id === id ? { ...resident, status: "Inactive" } : resident)),
//               )
//             } else {
//               Alert.alert("Error", data.message || "Failed to deactivate resident")
//             }
//           } catch (error) {
//             Alert.alert("Error", "Failed to deactivate the account")
//             console.error(error)
//           }
//         },
//       },
//     ])
//   }

//   const renderResident = ({ item }) => (
//     <LinearGradient colors={["#f7f7f7", "#e0e0e0"]} style={styles.residentCard}>
//       <View style={styles.residentInfo}>
//         <View style={styles.nameContainer}>
//           <Ionicons name="person-circle-outline" size={24} color="#4a4a4a" />
//           <Text style={styles.residentName}>{item.name}</Text>
//         </View>
//         <View style={[styles.statusBadge, { backgroundColor: item.status === "Active" ? "#4CAF50" : "#F44336" }]}>
//           <Text style={styles.residentStatus}>{item.status === "Active" ? "🟢 Active" : "🔴 Inactive"}</Text>
//         </View>
//       </View>
//       <View style={styles.actionButtons}>
//         <TouchableOpacity onPress={() => handleActivate(item.id)} style={[styles.actionButton, styles.activateButton]}>
//           <Ionicons name="checkmark-circle" size={20} color="white" />
//           <Text style={styles.actionText}>Activate</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           onPress={() => handleDeactivate(item.id)}
//           style={[styles.actionButton, styles.deactivateButton]}
//         >
//           <Ionicons name="close-circle" size={20} color="white" />
//           <Text style={styles.actionText}>Deactivate</Text>
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   )

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6200EE" />
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={["#135387", "#135387"]} style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="white" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Manage Residents</Text>
//       </LinearGradient>
//       <FlatList
//         data={residents}
//         keyExtractor={(item) => item.id}
//         renderItem={renderResident}
//         contentContainerStyle={styles.list}
//       />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f0f0f0",
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#f0f0f0",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     paddingTop: 20,
//   },
//   backButton: {
//     marginRight: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "white",
//     flex: 1,
//     textAlign: "center",
//   },
//   list: {
//     padding: 16,
//   },
//   residentCard: {
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   residentInfo: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   nameContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   residentName: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//     marginLeft: 8,
//   },
//   statusBadge: {
//     paddingVertical: 4,
//     paddingHorizontal: 8,
//     borderRadius: 16,
//   },
//   residentStatus: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "white",
//   },
//   actionButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   actionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   activateButton: {
//     backgroundColor: "#4CAF50",
//   },
//   deactivateButton: {
//     backgroundColor: "#F44336",
//   },
//   actionText: {
//     fontSize: 14,
//     fontWeight: "600",
//     marginLeft: 8,
//     color: "white",
//   },
// })

// export default ManageResidents



"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Platform,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Constants from "expo-constants"
import { LinearGradient } from "expo-linear-gradient"

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

// Get screen dimensions
const { width, height } = Dimensions.get("window")

// Create responsive size functions
const wp = (percentage) => {
  return (percentage * width) / 100
}

const hp = (percentage) => {
  return (percentage * height) / 100
}

// Responsive font size
const normalize = (size) => {
  const scale = width / 375 // 375 is standard width
  const newSize = size * scale
  if (Platform.OS === "ios") {
    return Math.round(newSize)
  } else {
    return Math.round(newSize) - 2
  }
}

const ManageResidents = ({ navigation }) => {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await fetch(`http://${ipPort}/api/manageresidents/accounts`)
        const data = await response.json()
        console.log("Response Data:", data)

        if (Array.isArray(data)) {
          const mappedResidents = data.map((resident) => ({
            id: resident._id,
            name: `${resident.firstName} ${resident.lastName}`,
            status: resident.status,
          }))
          setResidents(mappedResidents)
        } else {
          Alert.alert("Error", "Received data is not in the expected format")
        }
      } catch (error) {
        Alert.alert("Error", "Failed to fetch residents")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchResidents()
  }, [])

  const handleActivate = (id) => {
    Alert.alert("Activate Account", `Are you sure you want to activate this resident?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Activate",
        onPress: async () => {
          try {
            const response = await fetch(`http://${ipPort}/api/manageresidents/activate/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "Active" }),
            })

            const data = await response.json()
            if (response.status === 200) {
              Alert.alert("Success", "Resident account activated successfully.")
              setResidents((prevResidents) =>
                prevResidents.map((resident) => (resident.id === id ? { ...resident, status: "Active" } : resident)),
              )
            } else {
              Alert.alert("Error", data.message || "Failed to activate resident account.")
            }
          } catch (error) {
            Alert.alert("Error", "There was an error activating the account.")
            console.error(error)
          }
        },
      },
    ])
  }

  const handleDeactivate = async (id) => {
    Alert.alert("Deactivate Account", `Are you sure you want to deactivate this resident?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        onPress: async () => {
          try {
            const response = await fetch(`http://${ipPort}/api/manageresidents/deactivate/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "Inactive" }),
            })

            const data = await response.json()
            if (response.ok) {
              Alert.alert("Success", `Resident has been deactivated.`)
              setResidents((prevResidents) =>
                prevResidents.map((resident) => (resident.id === id ? { ...resident, status: "Inactive" } : resident)),
              )
            } else {
              Alert.alert("Error", data.message || "Failed to deactivate resident")
            }
          } catch (error) {
            Alert.alert("Error", "Failed to deactivate the account")
            console.error(error)
          }
        },
      },
    ])
  }

  const filteredResidents = residents.filter((resident) =>
    resident.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderResident = ({ item }) => (
    <View style={styles.residentCard}>
      <View style={styles.residentInfo}>
        <View style={styles.nameContainer}>
          <Ionicons name="person-circle-outline" size={normalize(24)} color="#135387" />
          <Text style={styles.residentName}>{item.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === "Active" ? "#4CAF50" : "#F44336" }]}>
          <Text style={styles.residentStatus}>{item.status === "Active" ? "Active" : "Inactive"}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => handleActivate(item.id)}
          style={[styles.actionButton, styles.activateButton]}
          disabled={item.status === "Active"}
        >
          <Ionicons name="checkmark-circle" size={normalize(20)} color="white" />
          <Text style={styles.actionText}>Activate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeactivate(item.id)}
          style={[styles.actionButton, styles.deactivateButton]}
          disabled={item.status === "Inactive"}
        >
          <Ionicons name="close-circle" size={normalize(20)} color="white" />
          <Text style={styles.actionText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={normalize(24)} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Residents</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={normalize(20)} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search residents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={normalize(20)} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#135387" />
          </View>
        ) : filteredResidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={normalize(60)} color="#135387" />
            <Text style={styles.emptyText}>No residents found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredResidents}
            keyExtractor={(item) => item.id}
            renderItem={renderResident}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: wp(4),
    paddingTop: Platform.OS === "ios" ? hp(5) : hp(2),
  },
  backButton: {
    padding: wp(2),
  },
  title: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: wp(10),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    paddingHorizontal: wp(4),
    height: hp(6),
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(16),
    color: "#333",
  },
  clearSearchButton: {
    padding: wp(1),
  },
  list: {
    padding: wp(4),
  },
  residentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  residentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  residentName: {
    fontSize: normalize(16),
    fontWeight: "600",
    color: "#333",
    marginLeft: wp(2),
  },
  statusBadge: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    borderRadius: 16,
  },
  residentStatus: {
    fontSize: normalize(12),
    fontWeight: "bold",
    color: "white",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activateButton: {
    backgroundColor: "#4CAF50",
  },
  deactivateButton: {
    backgroundColor: "#F44336",
  },
  actionText: {
    fontSize: normalize(14),
    fontWeight: "600",
    marginLeft: wp(2),
    color: "white",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: normalize(18),
    color: "#666",
    marginTop: hp(2),
  },
})

export default ManageResidents

