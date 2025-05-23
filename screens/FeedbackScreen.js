import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native"
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO

const FeedbackScreen = ({ navigation }) => {
  const [category, setCategory] = useState("")
  const [step, setStep] = useState(0)
  const [mcqAnswers, setMcqAnswers] = useState({})
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [issues, setIssues] = useState([])
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [generalFeedback, setGeneralFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sentimentScore, setSentimentScore] = useState(null)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))


  const decodeJWT = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  };

  const categories = [
    { id: "functionality", title: "App Functionality", icon: "mobile-alt" },
    { id: "events", title: "Events", icon: "calendar-alt" },
    { id: "issues", title: "Issues", icon: "exclamation-circle" },
  ]

  const functionalityMCQs = [
    {
      id: "q1",
      question: "How easy is it to navigate the app?",
      options: ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"],
      icons: ["thumb-up", "hand-okay", "equal", "hand-down", "thumb-down"],
    },
    {
      id: "q2",
      question: "How would you rate the app's performance?",
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      icons: ["star", "star-half-full", "star-outline", "alert", "alert-circle"],
    },
    {
      id: "q3",
      question: "How often do you encounter bugs or errors?",
      options: ["Never", "Rarely", "Sometimes", "Often", "Very Often"],
      icons: ["shield-check", "shield-half-full", "shield-outline", "shield-alert", "shield-off"],
    },
    {
      id: "q4",
      question: "How satisfied are you with the app's features?",
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      icons: ["emoticon-excited", "emoticon", "emoticon-neutral", "emoticon-sad", "emoticon-angry"],
    },
    {
      id: "q5",
      question: "How likely are you to recommend this app to others?",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
      icons: ["thumb-up", "hand-okay", "equal", "hand-down", "thumb-down"],
    },
  ]

  const eventMCQs = [
    {
      id: "eq1",
      question: "How would you rate the overall event?",
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      icons: ["star", "star-half-full", "star-outline", "alert", "alert-circle"],
    },
    {
      id: "eq2",
      question: "How well was the event organized?",
      options: ["Very Well", "Well", "Neutral", "Poorly", "Very Poorly"],
      icons: ["check-circle", "check", "equal", "close", "close-circle"],
    },
    {
      id: "eq3",
      question: "How likely are you to attend similar events in the future?",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
      icons: ["thumb-up", "hand-okay", "equal", "hand-down", "thumb-down"],
    },
  ]

  const issueMCQs = [
    {
      id: "iq1",
      question: "How satisfied are you with the resolution of this issue?",
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      icons: ["emoticon-excited", "emoticon", "emoticon-neutral", "emoticon-sad", "emoticon-angry"],
    },
    {
      id: "iq2",
      question: "How would you rate the response time to your issue?",
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
      icons: ["timer", "timer-outline", "clock-outline", "clock-alert", "clock-alert-outline"],
    },
    {
      id: "iq3",
      question: "How likely are you to report issues in the future?",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
      icons: ["thumb-up", "hand-okay", "equal", "hand-down", "thumb-down"],
    },
  ]

  useEffect(() => {
    if (category === "events") {
      fetchEvents()
    } else if (category === "issues") {
      fetchIssues()
    }
  }, [category])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim])

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
        const token = await AsyncStorage.getItem("jwtToken");
        const decoded = decodeJWT(token);
        const userEmail = decoded.email; // Extract user email

        console.log("Fetching events, Logged-in User Email:", userEmail); // Debugging log

        const response = await fetch(`http://${ipPort}/api/events/recent?userEmail=${userEmail}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        console.log("Fetched Events:", data.events); // Debugging log

        if (data.success) {
            setEvents(data.events || []);
        } else {
            Alert.alert("Error", data.message || "Failed to fetch events");
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        Alert.alert("Error", "Failed to fetch recent events");
    }
    setIsLoading(false);
};

  

  const fetchIssues = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      // Decode JWT to get user email
    const decoded = decodeJWT(token);
    const userEmail = decoded.email; // Extracting email from JWT token
  
      console.log("Fetching issues, Logged-in User Email:", userEmail); // Debugging log
  
      const response = await fetch(`http://${ipPort}/api/report/recent?userEmail=${userEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await response.json();
      console.log("Fetched Issues:", data.issues);  // Debugging log
  
      if (data.success) {
        setIssues(data.issues || []);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch issues");
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
      Alert.alert("Error", "Failed to fetch recent issues");
    }
    setIsLoading(false);
  };
  
  

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory)
    setStep(1)
    setMcqAnswers({})
    setSelectedEvent(null)
    setSelectedIssue(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleMCQAnswer = (questionId, answer) => {
    setMcqAnswers({ ...mcqAnswers, [questionId]: answer })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleEventSelect = (event) => {
    setSelectedEvent(event)
    setStep(2)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleIssueSelect = (issue) => {
    setSelectedIssue(issue)
    setStep(2)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleSubmitFeedback = async () => {
    setIsLoading(true);
    try {
        const token = await AsyncStorage.getItem("jwtToken");
        const decoded = decodeJWT(token);
        const userEmail = decoded.email; // Extract user email

        if (!userEmail) {
            throw new Error("User email not found. Please log in again.");
        }

        // Convert mcqAnswers object into an array of { question, answer }
        const formattedMcqAnswers = Object.entries(mcqAnswers).map(([question, answer]) => ({
            question,
            answer,
        }));

        const feedbackData = {
            userEmail,
            category,
            mcqAnswers: formattedMcqAnswers,
            selectedEvent: selectedEvent || "Not provided", // ✅ Ensure non-null values
            selectedIssue: selectedIssue || "Not provided", // ✅ Ensure non-null values
            generalFeedback
        };

        console.log("Submitting Feedback Data:", JSON.stringify(feedbackData, null, 2));

        const response = await fetch(`http://${ipPort}/api/feedback/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(feedbackData),
        });

        const result = await response.json();
        console.log("API Response:", result); // ✅ Log API response

        if (response.ok) {
            Alert.alert("Success", "Your feedback has been submitted successfully!");
            resetForm();
        } else {
            throw new Error(result.error || "Failed to submit feedback");
        }
    } catch (error) {
        console.error("Error submitting feedback:", error);
        Alert.alert("Error", error.message || "An error occurred while submitting feedback");
    }
    setIsLoading(false);
};

  
  
  
  

  const resetForm = () => {
    setCategory("")
    setStep(0)
    setMcqAnswers({})
    setSelectedEvent(null)
    setSelectedIssue(null)
    setGeneralFeedback("")
  }

  const renderMCQs = (questions) => (
    <View style={styles.mcqContainer}>
      {questions.map((q) => (
        <Animated.View
          key={q.id}
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.questionText}>{q.question}</Text>
          <View style={styles.optionsContainer}>
            {q.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  mcqAnswers[q.id] === option && styles.selectedOption,
                  { width: SCREEN_WIDTH > 600 ? "48%" : "100%" },
                ]}
                onPress={() => handleMCQAnswer(q.id, option)}
              >
                <MaterialCommunityIcons
                  name={q.icons[index]}
                  size={24}
                  color={mcqAnswers[q.id] === option ? "#fff" : "#135387"}
                />
                <Text style={[styles.optionText, mcqAnswers[q.id] === option && styles.selectedOptionText]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ))}
    </View>
  )

  const renderContent = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            style={[
              styles.categoryContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, { width: SCREEN_WIDTH > 600 ? "30%" : "100%" }]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <FontAwesome5 name={cat.icon} size={32} color="#135387" />
                <Text style={styles.categoryText}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )
      case 1:
        if (category === "functionality") {
          return renderMCQs(functionalityMCQs)
        } else if (category === "events") {
          return (
            <Animated.View
              style={[
                styles.listContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
  {events && events.length > 0 ? (
    events
      .filter(event => {
        const eventDate = new Date(event.date + "T00:00:00Z"); 
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        console.log(`Event: ${event.name}, Date: ${eventDate.toDateString()}, Today: ${today.toDateString()}, Condition: ${eventDate < today}`);

        return eventDate < today; 
      })
      .map((event) => (
        <TouchableOpacity 
          key={event.id} 
          style={styles.listItem} 
          onPress={() => handleEventSelect(event)}
        >
          <Text style={styles.listItemTitle}>{event.name || "No Title"}</Text>
          <Text style={styles.listItemDate}>
            {event.date ? new Date(event.date).toDateString() : "No Date"}
          </Text>
          <Text style={styles.listItemLocation}>{event.location || "No Location"}</Text>
        </TouchableOpacity>
      ))
  ) : (
    <Text style={styles.noDataText}>No past events available</Text>
  )}




            </Animated.View>
          )
        } else if (category === "issues") {
          return (
            <Animated.View
              style={[
                styles.listContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {issues && issues.length > 0 ? (
  issues
    .filter((issue) => new Date(issue.createdAt) < new Date()) // Only show past issues
    .map((issue) => (
      <TouchableOpacity 
        key={issue._id} 
        style={styles.listItem} 
        onPress={() => handleIssueSelect(issue)}
      >
        <Text style={styles.listItemTitle}>{issue.issueType}</Text>
        <Text style={styles.listItemDate}>
          {new Date(issue.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    ))
) : (
  <Text style={styles.noDataText}>No past issues available</Text>
)}


            </Animated.View>
          )
        }
        break
      case 2:
        return (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {category === "events" && (
              <View style={styles.selectedItemContainer}>
                <Text style={styles.selectedItemTitle}>{selectedEvent.name}</Text>
                <Text style={styles.selectedItemDate}>{selectedEvent.date}</Text>
                <Text style={styles.selectedItemDate}>{selectedEvent.location}</Text>
                
              </View>
            )}
            {category === "issues" && (
              <View style={styles.selectedItemContainer}>
              <Text style={styles.selectedItemTitle}>{selectedIssue.issueType}</Text>
              <Text style={styles.selectedItemDate}>
                {new Date(selectedIssue.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            )}
            {renderMCQs(category === "events" ? eventMCQs : issueMCQs)}
          </Animated.View>
        )
      default:
        return null
    }
  }

  const renderSentimentEmoji = () => {
    if (sentimentScore === null) return null
    if (sentimentScore > 0.5) return "😃"
    if (sentimentScore > 0) return "🙂"
    if (sentimentScore === 0) return "😐"
    if (sentimentScore > -0.5) return "🙁"
    return "😞"
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={["#135387", "#135387"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Feedback</Text>
        </LinearGradient>

        <View style={styles.content}>
          {renderContent()}

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.label}>Additional Comments:</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Enter any additional feedback here..."
              value={generalFeedback}
              onChangeText={setGeneralFeedback}
            />

            {isLoading ? (
              <ActivityIndicator size="large" color="#135387" />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            )}

            {sentimentScore !== null && (
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentText}>Feedback Sentiment:</Text>
                <Text style={styles.sentimentEmoji}>{renderSentimentEmoji()}</Text>
                <Text style={styles.sentimentScore}>Score: {sentimentScore.toFixed(2)}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  content: {
    padding: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  categoryButton: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  categoryText: {
    marginTop: 10,
    color: "#135387",
    fontWeight: "bold",
    fontSize: 16,
  },
  mcqContainer: {
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  selectedOption: {
    backgroundColor: "#135387",
  },
  optionText: {
    color: "#333",
    marginLeft: 10,
    fontSize: 16,
  },
  selectedOptionText: {
    color: "white",
  },
  listContainer: {
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  listItemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listItemDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  selectedItemContainer: {
    backgroundColor: "#e0e0e0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedItemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  selectedItemDate: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#135387",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  sentimentContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sentimentText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  sentimentEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  sentimentScore: {
    fontSize: 18,
    color: "#135387",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 20,
  },
})

export default FeedbackScreen

