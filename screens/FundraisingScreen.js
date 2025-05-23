import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  Animated,
  Easing,
  ScrollView,
  Image,
  progressAnims,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import {
  ProgressBar,
  Card,
  Chip,
  Surface,
  Button,
  Divider,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

// Custom Floating Label Input Component
const FloatingLabelInput = memo(
  ({
    label,
    value,
    onChangeText,
    keyboardType,
    multiline,
    numberOfLines,
    secureTextEntry,
    maxLength,
    icon,
    style,
    containerStyle,
    ...props
  }) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
      Animated.timing(animatedIsFocused, {
        toValue: isFocused || value ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }).start();
    }, [isFocused, value, animatedIsFocused]);

    const labelStyle = {
      position: "absolute",
      left: icon ? width * 0.1 : width * 0.03,
      top: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: [multiline ? height * 0.02 : height * 0.025, 0],
      }),
      fontSize: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: [isTablet ? 18 : 16, isTablet ? 14 : 12],
      }),
      color: animatedIsFocused.interpolate({
        inputRange: [0, 1],
        outputRange: ["#999", "#28A745"],
      }),
      backgroundColor: isFocused || value ? "white" : "transparent",
      paddingHorizontal: isFocused || value ? width * 0.01 : 0,
      zIndex: 1,
    };

    return (
      <View style={[styles.floatingInputContainer, containerStyle]}>
        {icon && <View style={styles.inputIconContainer}>{icon}</View>}
        <Animated.Text
          style={labelStyle}
          accessible={true}
          accessibilityLabel={label}
        >
          {label}
        </Animated.Text>
        <TextInput
          style={[
            styles.floatingInput,
            icon && styles.inputWithIcon,
            multiline && styles.multilineInput,
            isFocused && styles.focusedInput,
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          blurOnSubmit={!multiline}
          accessible={true}
          accessibilityLabel={`${label} input`}
          {...props}
        />
      </View>
    );
  }
);

// Stripe Payment Form Component (using WebView)
const StripePaymentForm = memo(
  ({ fundraiser, donationAmount, onSuccess, onClose }) => {
    const [checkoutUrl, setCheckoutUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const webViewRef = useRef(null);

    useEffect(() => {
      const fetchCheckoutUrl = async () => {
        try {
          const token = await AsyncStorage.getItem("jwtToken");
          if (!token) {
            console.warn("No JWT token found");
            setError("Please log in to make a donation.");
            setLoading(false);
            return;
          }

          console.log("Sending request to create-checkout-session with:", {
            amount: donationAmount * 100,
            currency: "usd",
            fundraiserId: fundraiser._id,
          });

          const response = await fetch(
            `http://${ipPort}/api/fundraisers/create-checkout-session`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                amount: donationAmount * 100,
                currency: "usd",
                fundraiserId: fundraiser._id,
              }),
            }
          );

          const data = await response.json();
          console.log("Response from create-checkout-session:", {
            status: response.status,
            ok: response.ok,
            data,
          });

          if (response.ok) {
            setCheckoutUrl(data.url);
          } else {
            setError(
              data.message ||
                `Failed to initialize payment (Status: ${response.status})`
            );
          }
        } catch (err) {
          console.error("Network error in fetchCheckoutUrl:", err);
          setError(
            "Network error. Please check your connection and try again."
          );
        } finally {
          setLoading(false);
        }
      };
      fetchCheckoutUrl();

      return () => {
        setCheckoutUrl(null);
      };
    }, [donationAmount, fundraiser._id]);

    const handleNavigationStateChange = useCallback(
      async (navState) => {
        const { url } = navState;
        console.log("WebView navigation state changed:", url);
        if (url.includes("/success")) {
          try {
            const token = await AsyncStorage.getItem("jwtToken");
            if (!token) {
              setError("Session expired. Please log in again.");
              return;
            }
            const sessionId = new URL(url).searchParams.get("session_id");
            const response = await fetch(
              `http://${ipPort}/api/fundraisers/success?session_id=${sessionId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const updatedFundraiser = await response.json();
            if (response.ok) {
              onSuccess(updatedFundraiser);
            } else {
              setError("Failed to update fundraiser after payment");
            }
          } catch (err) {
            console.error("Error processing payment success:", err);
            setError("Network error during payment processing.");
          }
        } else if (url.includes("/cancel")) {
          onClose();
        }
      },
      [onSuccess, onClose]
    );

    if (loading) {
      return (
        <View style={styles.stripeFormContainer}>
          <ActivityIndicator size="large" color="#28A745" />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stripeFormContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Close payment error"
          >
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stripeFormContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          accessible={true}
          accessibilityLabel="Cancel payment"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }
);

const FundraisingScreen = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [newFundraiser, setNewFundraiser] = useState({
    title: "",
    description: "",
    goal: "",
    timeline: "",
    image: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState(null);
  const [donationAmount, setDonationAmount] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentFundraiser, setCurrentFundraiser] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [expenses, setExpenses] = useState({});
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [userEmail, setUserEmail] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlideAnim = useRef(new Animated.Value(100)).current;
  const paymentSlideAnim = useRef(new Animated.Value(height)).current;
  const progressAnims = useRef({}); // Initialize as ref

  useEffect(() => {
    const fetchFundraisersAndUser = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (token) {
          const decoded = await decodeJWT(token);
          setUserEmail(decoded?.email || null);
        }

        const response = await fetch(`http://${ipPort}/api/fundraisers/all`);
        const data = await response.json();

        if (response.ok) {
          setFundraisers(data);
          setLoading(false);

          const initialDonationAmounts = {};
          const initialExpenses = {};
          data.forEach((fundraiser) => {
            initialDonationAmounts[fundraiser._id] = "";
            initialExpenses[fundraiser._id] = fundraiser.expenses || [];
            progressAnims.current[fundraiser._id] = new Animated.Value(0);
          });
          setDonationAmount(initialDonationAmounts);
          setExpenses(initialExpenses);

          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start();

          Object.keys(progressAnims.current).forEach((id) => {
            const fundraiser = data.find((f) => f._id === id);
            if (fundraiser && progressAnims.current[id]) {
              Animated.timing(progressAnims.current[id], {
                toValue: fundraiser.raised / fundraiser.goal,
                duration: 1000,
                delay: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
              }).start();
            }
          });
        } else {
          Alert.alert("Error", "Failed to fetch fundraisers.");
        }
      } catch (error) {
        console.error("Error fetching fundraisers:", error);
        Alert.alert("Error", "Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchFundraisersAndUser();

    return () => {
      Object.values(progressAnims.current).forEach((anim) =>
        anim.stopAnimation()
      );
    };
  }, []);

  const decodeJWT = useCallback(async (token) => {
    if (!token) {
      console.warn("No token provided to decodeJWT");
      return null;
    }
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permissions are required.");
      return;
    }

    setImageLoading(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewFundraiser({ ...newFundraiser, image: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    } finally {
      setImageLoading(false);
    }
  }, [newFundraiser]);

  const handleCreateFundraiser = useCallback(async () => {
    if (
      !newFundraiser.title ||
      !newFundraiser.description ||
      !newFundraiser.goal ||
      !newFundraiser.timeline ||
      !newFundraiser.image
    ) {
      Alert.alert(
        "Missing Info",
        "Please fill out all fields and add an image."
      );
      return;
    }

    if (
      isNaN(parseFloat(newFundraiser.goal)) ||
      parseFloat(newFundraiser.goal) <= 0
    ) {
      Alert.alert("Invalid Goal", "Goal must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "Please log in to create a fundraiser.");
        return;
      }

      const decoded = await decodeJWT(token);
      const email = decoded?.email;
      if (!email) {
        Alert.alert("Error", "Invalid token. Please log in again.");
        return;
      }

      const fundraiserData = {
        title: newFundraiser.title,
        description: newFundraiser.description,
        goal: parseFloat(newFundraiser.goal),
        timeline: newFundraiser.timeline,
        image: newFundraiser.image,
        email: email,
      };

      const response = await fetch(`http://${ipPort}/api/fundraisers/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fundraiserData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Fundraiser created successfully!");
        setFundraisers([...fundraisers, data]);
        progressAnims.current[data._id] = new Animated.Value(0);
        setDonationAmount({ ...donationAmount, [data._id]: "" });
        setExpenses({ ...expenses, [data._id]: [] });

        setNewFundraiser({
          title: "",
          description: "",
          goal: "",
          timeline: "",
          image: "",
        });
        setShowCreateForm(false);
      } else {
        Alert.alert("Error", data.message || "Failed to create fundraiser.");
      }
    } catch (error) {
      console.error("Error creating fundraiser:", error);
      Alert.alert("Error", "Network error while creating fundraiser.");
    } finally {
      setLoading(false);
    }
  }, [newFundraiser, fundraisers, donationAmount, expenses, decodeJWT]);

  const handleUpdateFundraiser = useCallback(async () => {
    if (
      !newFundraiser.title ||
      !newFundraiser.description ||
      !newFundraiser.goal ||
      !newFundraiser.timeline ||
      !newFundraiser.image
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill all fields and select an image."
      );
      return;
    }

    if (
      isNaN(parseFloat(newFundraiser.goal)) ||
      parseFloat(newFundraiser.goal) <= 0
    ) {
      Alert.alert("Invalid Goal", "Please enter a valid goal amount.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "Please log in to update the fundraiser.");
        return;
      }

      const response = await fetch(
        `http://${ipPort}/api/fundraisers/update/${editingFundraiser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newFundraiser.title,
            description: newFundraiser.description,
            goal: parseFloat(newFundraiser.goal),
            timeline: newFundraiser.timeline,
            image: newFundraiser.image,
          }),
        }
      );

      const updatedFundraiser = await response.json();

      if (response.ok) {
        const updatedFundraisers = fundraisers.map((fundraiser) =>
          fundraiser._id === editingFundraiser._id
            ? updatedFundraiser
            : fundraiser
        );

        setFundraisers(updatedFundraisers);

        if (progressAnims.current[updatedFundraiser._id]) {
          Animated.timing(progressAnims.current[updatedFundraiser._id], {
            toValue: updatedFundraiser.raised / updatedFundraiser.goal,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        }

        setNewFundraiser({
          title: "",
          description: "",
          goal: "",
          timeline: "",
          image: "",
        });
        setEditingFundraiser(null);
        setShowCreateForm(false);
        Alert.alert("Success", "Fundraiser updated successfully!");
      } else {
        throw new Error(updatedFundraiser.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating fundraiser:", error);
      Alert.alert("Error", "Network error while updating fundraiser.");
    } finally {
      setLoading(false);
    }
  }, [newFundraiser, editingFundraiser, fundraisers]);

  const handleDonate = useCallback(
    (fundraiser) => {
      const amountToDonate = parseFloat(donationAmount[fundraiser._id]);
      if (!amountToDonate || amountToDonate <= 0 || isNaN(amountToDonate)) {
        Alert.alert("Invalid Amount", "Please enter a valid donation amount.");
        return;
      }

      setCurrentFundraiser({
        ...fundraiser,
        donationAmount: amountToDonate,
      });
      setPaymentSuccess(false);
      setPaymentModalVisible(true);

      paymentSlideAnim.setValue(height);
      Animated.timing(paymentSlideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [donationAmount]
  );

  const processPayment = useCallback(
    (updatedFundraiser) => {
      const updatedFundraisers = fundraisers.map((fundraiser) =>
        fundraiser._id === updatedFundraiser._id
          ? updatedFundraiser
          : fundraiser
      );

      setFundraisers(updatedFundraisers);

      const newDonationAmounts = { ...donationAmount };
      newDonationAmounts[currentFundraiser._id] = "";
      setDonationAmount(newDonationAmounts);

      if (progressAnims.current[currentFundraiser._id]) {
        Animated.timing(progressAnims.current[currentFundraiser._id], {
          toValue: updatedFundraiser.raised / updatedFundraiser.goal,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      }

      setPaymentSuccess(true);
    },
    [fundraisers, donationAmount, currentFundraiser]
  );

  const handleAddExpense = useCallback(
    async (fundraiserId) => {
      if (
        !newExpense.description ||
        !newExpense.amount ||
        parseFloat(newExpense.amount) <= 0
      ) {
        Alert.alert(
          "Invalid Expense",
          "Please provide a valid description and amount."
        );
        return;
      }

      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("Error", "Please log in to add an expense.");
          return;
        }

        const response = await fetch(
          `http://${ipPort}/api/fundraisers/${fundraiserId}/add-expense`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              description: newExpense.description,
              amount: parseFloat(newExpense.amount),
            }),
          }
        );

        const updatedFundraiser = await response.json();
        if (response.ok) {
          setExpenses({
            ...expenses,
            [fundraiserId]: updatedFundraiser.expenses,
          });
          setFundraisers((prev) =>
            prev.map((f) => (f._id === fundraiserId ? updatedFundraiser : f))
          );
          setNewExpense({ description: "", amount: "" });
          Alert.alert("Success", "Expense added successfully!");
        } else {
          Alert.alert(
            "Error",
            updatedFundraiser.message || "Failed to add expense."
          );
        }
      } catch (error) {
        console.error("Error adding expense:", error);
        Alert.alert("Error", "Network error while adding expense.");
      }
    },
    [newExpense, expenses]
  );

  const handleShare = useCallback(async (campaign) => {
    try {
      await Share.share({
        title: `Support ${campaign.title}`,
        message: `Join our fundraiser: ${campaign.title} - ${
          campaign.description
        }. Goal: $${campaign.goal.toLocaleString()}. We've raised $${campaign.raised.toLocaleString()} so far. Donate now to help us reach our goal!`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the fundraiser.");
    }
  }, []);

  const handleEdit = useCallback((fundraiser) => {
    setNewFundraiser({
      title: fundraiser.title,
      description: fundraiser.description,
      goal: fundraiser.goal.toString(),
      timeline: fundraiser.timeline,
      image: fundraiser.image,
    });
    setEditingFundraiser(fundraiser);
    setShowCreateForm(true);

    Animated.timing(formSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleCreateForm = useCallback(() => {
    if (!showCreateForm) {
      setNewFundraiser({
        title: "",
        description: "",
        goal: "",
        timeline: "",
        image: "",
      });
      setEditingFundraiser(null);

      formSlideAnim.setValue(100);
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    setShowCreateForm(!showCreateForm);
  }, [showCreateForm]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      Object.keys(progressAnims.current).forEach((id) => {
        const fundraiser = fundraisers.find((f) => f._id === id);
        if (fundraiser && progressAnims.current[id]) {
          progressAnims.current[id].setValue(0);
          Animated.timing(progressAnims.current[id], {
            toValue: fundraiser.raised / fundraiser.goal,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start();
        }
      });

      setRefreshing(false);
    }, 1500);
  }, [fundraisers]);

  const renderFundraiser = useCallback(
    ({ item }) => {
      const progress = item.raised / item.goal;
      const progressPercent = Math.round(progress * 100);
      const canAddExpense = userEmail && item.email === userEmail;

      return (
        <Animated.View
          style={[
            styles.fundraiserCardContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Card
            style={styles.fundraiserCard}
            accessible={true}
            accessibilityLabel="Fundraiser card"
          >
            <Card.Cover source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.categoryContainer}>
              <Chip
                mode="outlined"
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
                accessible={true}
                accessibilityLabel={`Category: ${item.category}`}
              >
                {item.category}
              </Chip>
            </View>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width:
                          progressAnims.current[item._id]?.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", "100%"],
                          }) || "0%",
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressTextContainer}>
                  <Text style={styles.progressText}>{progressPercent}%</Text>
                </View>
              </View>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ${item.raised.toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>
                    raised of ${item.goal.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.supporters}</Text>
                  <Text style={styles.statLabel}>supporters</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.timeline}</Text>
                  <Text style={styles.statLabel}>remaining</Text>
                </View>
              </View>
              <Divider style={styles.divider} />
              {item.raised >= item.goal ? (
                <View style={styles.goalAchievedContainer}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={width * 0.06}
                    color="#FFD700"
                  />
                  <Text style={styles.goalAchievedText}>Goal Achieved!</Text>
                  <Text style={styles.goalAchievedSubtext}>
                    Thank you to all {item.supporters} supporters who made this
                    possible.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.donateLabel}>Make a Contribution</Text>
                  <View style={styles.donationInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <FloatingLabelInput
                      label="Amount"
                      value={donationAmount[item._id]}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const newDonationAmounts = { ...donationAmount };
                        newDonationAmounts[item._id] = text;
                        setDonationAmount(newDonationAmounts);
                      }}
                      containerStyle={styles.donationFloatingInputContainer}
                    />
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.donateButton}
                      onPress={() => handleDonate(item)}
                      accessible={true}
                      accessibilityLabel="Donate to fundraiser"
                    >
                      <MaterialCommunityIcons
                        name="hand-heart"
                        size={width * 0.05}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Donate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.shareButton}
                      onPress={() => handleShare(item)}
                      accessible={true}
                      accessibilityLabel="Share fundraiser"
                    >
                      <MaterialCommunityIcons
                        name="share-variant"
                        size={width * 0.05}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(item)}
                      accessible={true}
                      accessibilityLabel="Edit fundraiser"
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={width * 0.05}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <Divider style={styles.divider} />
              <Text style={styles.expenseTitle}>Expense Tracking</Text>
              {expenses[item._id]?.length > 0 ? (
                <FlatList
                  data={expenses[item._id]}
                  keyExtractor={(expense, index) => index.toString()}
                  renderItem={({ item: expense }) => (
                    <View style={styles.expenseItem}>
                      <Text style={styles.expenseDescription}>
                        {expense.description}
                      </Text>
                      <Text style={styles.expenseAmount}>
                        ${expense.amount.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noExpensesText}>
                  No expenses logged yet.
                </Text>
              )}
              {canAddExpense && item.raised >= item.goal && (
                <View style={styles.expenseInputContainer}>
                  <FloatingLabelInput
                    label="Expense Description"
                    value={newExpense.description}
                    onChangeText={(text) =>
                      setNewExpense({ ...newExpense, description: text })
                    }
                    containerStyle={styles.formInputContainer}
                  />
                  <FloatingLabelInput
                    label="Amount ($)"
                    value={newExpense.amount}
                    keyboardType="numeric"
                    onChangeText={(text) =>
                      setNewExpense({ ...newExpense, amount: text })
                    }
                    containerStyle={styles.formInputContainer}
                  />
                  <TouchableOpacity
                    style={styles.addExpenseButton}
                    onPress={() => handleAddExpense(item._id)}
                    accessible={true}
                    accessibilityLabel="Add expense"
                  >
                    <Text style={styles.buttonText}>Add Expense</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      );
    },
    [
      userEmail,
      donationAmount,
      expenses,
      newExpense,
      fadeAnim,
      slideAnim,
      handleDonate,
      handleShare,
      handleEdit,
      handleAddExpense,
    ]
  );

  const renderEmptyList = useCallback(() => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="charity"
          size={width * 0.2}
          color="#CCCCCC"
        />
        <Text style={styles.emptyTitle}>No Fundraisers Yet</Text>
        <Text style={styles.emptyDescription}>
          Create your first fundraiser to start collecting donations for your
          cause.
        </Text>
        <TouchableOpacity
          style={styles.emptyCreateButton}
          onPress={toggleCreateForm}
          accessible={true}
          accessibilityLabel="Create new fundraiser"
        >
          <MaterialCommunityIcons
            name="plus-circle"
            size={width * 0.06}
            color="#fff"
          />
          <Text style={styles.buttonText}>Create Fundraiser</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, toggleCreateForm]);

  const renderPaymentModal = useCallback(() => {
    return (
      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.paymentModalContainer,
              { transform: [{ translateY: paymentSlideAnim }] },
            ]}
          >
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>
                {paymentSuccess
                  ? "Payment Successful"
                  : "Complete Your Donation"}
              </Text>
              <TouchableOpacity
                onPress={() => setPaymentModalVisible(false)}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel="Close payment modal"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={width * 0.06}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {paymentSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={width * 0.2}
                    color="#28A745"
                  />
                </View>
                <Text style={styles.successTitle}>Thank You!</Text>
                <Text style={styles.successMessage}>
                  Your donation of $
                  {currentFundraiser?.donationAmount.toLocaleString()} to "
                  {currentFundraiser?.title}" has been processed successfully.
                </Text>
                <Text style={styles.successSubtext}>
                  A receipt has been sent to your email.
                </Text>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setPaymentModalVisible(false)}
                  accessible={true}
                  accessibilityLabel="Close success message"
                >
                  <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <StripePaymentForm
                fundraiser={currentFundraiser}
                donationAmount={currentFundraiser?.donationAmount}
                onSuccess={processPayment}
                onClose={() => setPaymentModalVisible(false)}
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </Modal>
    );
  }, [
    paymentModalVisible,
    paymentSuccess,
    currentFundraiser,
    processPayment,
    paymentSlideAnim,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={["#F0F4F8", "#E1E8F0"]}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.screenTitle}>Community Fundraising</Text>
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={width * 0.07}
                  color="#28A745"
                />
              </View>
            </View>
            {!showCreateForm && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={toggleCreateForm}
                accessible={true}
                accessibilityLabel="Create new fundraiser"
              >
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={width * 0.06}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Create New Fundraiser</Text>
              </TouchableOpacity>
            )}
            {showCreateForm && (
              <Animated.View
                style={[
                  styles.createFormContainer,
                  { transform: [{ translateY: formSlideAnim }] },
                ]}
              >
                <Surface style={styles.createForm}>
                  <Text style={styles.formTitle}>
                    {editingFundraiser
                      ? "Edit Fundraiser"
                      : "Create Fundraiser"}
                  </Text>
                  <FloatingLabelInput
                    label="Title"
                    value={newFundraiser.title}
                    onChangeText={(text) =>
                      setNewFundraiser({ ...newFundraiser, title: text })
                    }
                    containerStyle={styles.formInputContainer}
                  />
                  <FloatingLabelInput
                    label="Description"
                    value={newFundraiser.description}
                    onChangeText={(text) =>
                      setNewFundraiser({ ...newFundraiser, description: text })
                    }
                    multiline
                    numberOfLines={4}
                    containerStyle={styles.formInputContainer}
                    style={styles.textArea}
                  />
                  <View style={styles.formRow}>
                    <FloatingLabelInput
                      label="Goal Amount ($)"
                      value={newFundraiser.goal}
                      keyboardType="numeric"
                      onChangeText={(text) =>
                        setNewFundraiser({ ...newFundraiser, goal: text })
                      }
                      containerStyle={styles.formHalfInputContainer}
                    />
                    <FloatingLabelInput
                      label="Timeline (e.g. 3 months)"
                      value={newFundraiser.timeline}
                      onChangeText={(text) =>
                        setNewFundraiser({ ...newFundraiser, timeline: text })
                      }
                      containerStyle={styles.formHalfInputContainer}
                    />
                  </View>
                  <View style={styles.imagePickerContainer}>
                    <Text style={styles.imagePickerLabel}>
                      Fundraiser Image
                    </Text>
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#28A745" />
                    ) : newFundraiser.image ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: newFundraiser.image }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          style={styles.changeImageButton}
                          onPress={pickImage}
                          accessible={true}
                          accessibilityLabel="Change image"
                        >
                          <Text style={styles.changeImageText}>
                            Change Image
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={pickImage}
                        accessible={true}
                        accessibilityLabel="Select image"
                      >
                        <MaterialCommunityIcons
                          name="image-plus"
                          size={width * 0.06}
                          color="#fff"
                        />
                        <Text style={styles.imagePickerButtonText}>
                          Select Image
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.formButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={toggleCreateForm}
                      accessible={true}
                      accessibilityLabel="Cancel fundraiser form"
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    {editingFundraiser ? (
                      <TouchableOpacity
                        style={styles.updateButton}
                        onPress={handleUpdateFundraiser}
                        accessible={true}
                        accessibilityLabel="Update fundraiser"
                      >
                        <MaterialCommunityIcons
                          name="content-save"
                          size={width * 0.05}
                          color="#fff"
                        />
                        <Text style={styles.buttonText}>Update</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleCreateFundraiser}
                        accessible={true}
                        accessibilityLabel="Create fundraiser"
                      >
                        <MaterialCommunityIcons
                          name="plus-circle"
                          size={width * 0.05}
                          color="#fff"
                        />
                        <Text style={styles.buttonText}>Create</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Surface>
              </Animated.View>
            )}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#28A745" />
                <Text style={styles.loadingText}>Loading fundraisers...</Text>
              </View>
            ) : (
              <FlatList
                data={fundraisers}
                keyExtractor={(item) => item._id}
                renderItem={renderFundraiser}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmptyList}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                scrollEnabled={false}
              />
            )}
          </ScrollView>
        </LinearGradient>
        {renderPaymentModal()}
        {loading && (
          <View style={styles.loadingOverlay}>
            <Surface style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#28A745" />
              <Text style={styles.loadingOverlayText}>Processing...</Text>
            </Surface>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: height * 0.12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: height * 0.06,
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  headerIconContainer: {
    marginLeft: width * 0.03,
  },
  screenTitle: {
    fontSize: isTablet ? width * 0.06 : width * 0.08,
    fontWeight: "bold",
    color: "#135387",
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.02,
  },
  createFormContainer: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.03,
  },
  createForm: {
    padding: isTablet ? width * 0.04 : width * 0.05,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: isTablet ? width * 0.04 : width * 0.05,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  floatingInputContainer: {
    position: "relative",
    marginBottom: height * 0.02,
  },
  floatingInput: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: width * 0.03,
    paddingTop: height * 0.02,
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    backgroundColor: "#FFFFFF",
    height: height * 0.07,
    width: "100%",
  },
  inputWithIcon: {
    paddingLeft: width * 0.1,
  },
  inputIconContainer: {
    position: "absolute",
    left: width * 0.03,
    top: height * 0.025,
    zIndex: 1,
  },
  multilineInput: {
    height: height * 0.12,
    textAlignVertical: "top",
    paddingTop: height * 0.03,
  },
  focusedInput: {
    borderColor: "#28A745",
    borderWidth: 2,
  },
  formInputContainer: {
    marginBottom: height * 0.02,
  },
  formHalfInputContainer: {
    width: isTablet ? "48%" : "48%",
  },
  donationFloatingInputContainer: {
    flex: 1,
  },
  imagePickerContainer: {
    marginBottom: height * 0.02,
  },
  imagePickerLabel: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: height * 0.01,
  },
  imagePickerButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.02,
    borderRadius: 8,
    minHeight: height * 0.06,
  },
  imagePickerButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: width * 0.03,
    fontSize: isTablet ? width * 0.035 : width * 0.04,
  },
  imagePreviewContainer: {
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: isTablet ? height * 0.25 : height * 0.2,
    borderRadius: 8,
    marginBottom: height * 0.01,
  },
  changeImageButton: {
    backgroundColor: "#FFB000",
    padding: height * 0.015,
    borderRadius: 8,
    minHeight: height * 0.05,
  },
  changeImageText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: isTablet ? width * 0.03 : width * 0.035,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  formButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: height * 0.015,
  },
  fundraiserCardContainer: {
    marginBottom: height * 0.03,
  },
  fundraiserCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    height: isTablet ? height * 0.3 : height * 0.25,
  },
  categoryContainer: {
    position: "absolute",
    top: height * 0.015,
    right: width * 0.03,
  },
  categoryChip: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderColor: "#28A745",
  },
  categoryChipText: {
    color: "#28A745",
    fontWeight: "bold",
    fontSize: isTablet ? width * 0.03 : width * 0.035,
  },
  cardContent: {
    padding: width * 0.04,
  },
  title: {
    fontSize: isTablet ? width * 0.045 : width * 0.055,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: height * 0.01,
  },
  description: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#4A4A4A",
    marginBottom: height * 0.02,
    lineHeight: isTablet ? width * 0.05 : width * 0.055,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  progressBarContainer: {
    flex: 1,
    height: height * 0.015,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
    marginRight: width * 0.03,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#28A745",
    borderRadius: 6,
  },
  progressTextContainer: {
    width: width * 0.12,
    alignItems: "flex-end",
  },
  progressText: {
    fontSize: isTablet ? width * 0.03 : width * 0.035,
    fontWeight: "bold",
    color: "#28A745",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: height * 0.02,
    flexWrap: "wrap",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    minWidth: width * 0.25,
  },
  statValue: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    fontWeight: "bold",
    color: "#135387",
  },
  statLabel: {
    fontSize: isTablet ? width * 0.025 : width * 0.03,
    color: "#666666",
  },
  divider: {
    marginVertical: height * 0.02,
  },
  goalAchievedContainer: {
    alignItems: "center",
    padding: height * 0.015,
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    borderRadius: 8,
  },
  goalAchievedText: {
    fontSize: isTablet ? width * 0.04 : width * 0.05,
    fontWeight: "bold",
    color: "#28A745",
    marginVertical: height * 0.01,
  },
  goalAchievedSubtext: {
    fontSize: isTablet ? width * 0.03 : width * 0.035,
    color: "#4A4A4A",
    textAlign: "center",
  },
  donateLabel: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: height * 0.015,
  },
  donationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  currencySymbol: {
    fontSize: isTablet ? width * 0.04 : width * 0.05,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginRight: width * 0.015,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  createButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.02,
    borderRadius: 8,
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.03,
    minHeight: height * 0.06,
  },
  submitButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.015,
    borderRadius: 8,
    flex: 1,
    marginLeft: width * 0.03,
    minHeight: height * 0.05,
  },
  updateButton: {
    backgroundColor: "#FFB000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.015,
    borderRadius: 8,
    flex: 1,
    marginLeft: width * 0.03,
    minHeight: height * 0.05,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    padding: height * 0.015,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: height * 0.05,
  },
  cancelButtonText: {
    color: "#666666",
    fontWeight: "bold",
    fontSize: isTablet ? width * 0.035 : width * 0.04,
  },
  donateButton: {
    flex: 1,
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.015,
    borderRadius: 8,
    marginRight: width * 0.015,
    minHeight: height * 0.05,
    marginBottom: height * 0.01,
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#135387",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.015,
    borderRadius: 8,
    marginHorizontal: width * 0.015,
    minHeight: height * 0.05,
    marginBottom: height * 0.01,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#FFB000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.015,
    borderRadius: 8,
    marginLeft: width * 0.015,
    minHeight: height * 0.05,
    marginBottom: height * 0.01,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: width * 0.015,
    fontSize: isTablet ? width * 0.03 : width * 0.035,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.05,
  },
  emptyTitle: {
    fontSize: isTablet ? width * 0.04 : width * 0.05,
    fontWeight: "bold",
    color: "#135387",
    marginTop: height * 0.03,
    marginBottom: height * 0.015,
  },
  emptyDescription: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#666666",
    textAlign: "center",
    marginBottom: height * 0.03,
  },
  emptyCreateButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.02,
    borderRadius: 8,
    width: isTablet ? width * 0.6 : width * 0.8,
    minHeight: height * 0.06,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: height * 0.03,
  },
  loadingText: {
    marginTop: height * 0.015,
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#666666",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingCard: {
    padding: width * 0.05,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: width * 0.4,
  },
  loadingOverlayText: {
    marginTop: height * 0.015,
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#666666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  paymentModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    height: isTablet ? height * 0.85 : height * 0.8,
    overflow: "hidden",
  },
  paymentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: width * 0.05,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  paymentModalTitle: {
    fontSize: isTablet ? width * 0.04 : width * 0.05,
    fontWeight: "bold",
    color: "#135387",
  },
  closeButton: {
    padding: width * 0.015,
  },
  stripeFormContainer: {
    padding: width * 0.05,
    flex: 1,
  },
  webview: {
    flex: 1,
    marginBottom: height * 0.02,
  },
  errorText: {
    color: "#9e2146",
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    padding: isTablet ? width * 0.06 : width * 0.08,
    flex: 1,
    justifyContent: "center",
  },
  successIconContainer: {
    marginBottom: height * 0.03,
  },
  successTitle: {
    fontSize: isTablet ? width * 0.05 : width * 0.06,
    fontWeight: "bold",
    color: "#28A745",
    marginBottom: height * 0.02,
  },
  successMessage: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: height * 0.015,
    lineHeight: isTablet ? width * 0.05 : width * 0.055,
  },
  successSubtext: {
    fontSize: isTablet ? width * 0.03 : width * 0.035,
    color: "#666666",
    marginBottom: height * 0.03,
  },
  doneButton: {
    backgroundColor: "#28A745",
    padding: height * 0.02,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: isTablet ? width * 0.6 : width * 0.8,
    minHeight: height * 0.06,
  },
  expenseTitle: {
    fontSize: isTablet ? width * 0.04 : width * 0.045,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: height * 0.015,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: height * 0.01,
  },
  expenseDescription: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#4A4A4A",
  },
  expenseAmount: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    fontWeight: "bold",
    color: "#135387",
  },
  noExpensesText: {
    fontSize: isTablet ? width * 0.035 : width * 0.04,
    color: "#666666",
    marginBottom: height * 0.015,
  },
  expenseInputContainer: {
    marginTop: height * 0.02,
  },
  addExpenseButton: {
    backgroundColor: "#28A745",
    padding: height * 0.015,
    borderRadius: 8,
    alignItems: "center",
    minHeight: height * 0.05,
  },
  textArea: {
    height: height * 0.12,
  },
});

export default memo(FundraisingScreen);
