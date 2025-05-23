import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Constants from 'expo-constants';
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const cohelp = ({ navigation }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const faqs = [
    {
      id: "1",
      question: "How do I send an emergency alert?",
      answer:
        "To send an emergency alert, navigate to the Emergency Alerts section, select the type of emergency, and click on 'Send Alert'.",
    },
    {
      id: "2",
      question: "How do I update my profile?",
      answer:
        "To update your profile, go to the Settings section and select 'Profile' to edit your details.",
    },
    {
      id: "3",
      question: "How can I contact support?",
      answer: "You can contact support via email or phone from the Help section.",
    },
  ];

  const handleFeedback = () => {
    Alert.alert(
      "Feedback Sent",
      "Thank you for your feedback! We appreciate your input.",
      [{ text: "OK", onPress: () => console.log("Feedback sent") }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={30} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Help</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={styles.faqItem}
            onPress={() =>
              setExpandedQuestion(expandedQuestion === faq.id ? null : faq.id)
            }
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Icon
                name={
                  expandedQuestion === faq.id ? "expand-less" : "expand-more"
                }
                size={24}
                color="#FFF"
              />
            </View>
            {expandedQuestion === faq.id && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Contact Support */}
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() =>
            Alert.alert("Contact Support", "Email: support@residentconnect.com")
          }
        >
          <Icon name="email" size={30} color="#FFD700" />
          <Text style={styles.contactText}>Email: support@residentconnect.com</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() =>
            Alert.alert("Contact Support", "Phone: +1 (800) 123-4567")
          }
        >
          <Icon name="phone" size={30} color="#FFD700" />
          <Text style={styles.contactText}>Phone: +1 (800) 123-4567</Text>
        </TouchableOpacity>

        {/* Feedback Section */}
        <Text style={styles.sectionTitle}>Feedback</Text>
        <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback}>
          <Icon name="feedback" size={20} color="#FFF" />
          <Text style={styles.feedbackText}>Send Feedback</Text>
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
  },
  faqItem: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "bold",
  },
  faqAnswer: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  contactText: {
    fontSize: 16,
    color: "#FFF",
    marginLeft: 15,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#FF0000",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginLeft: 10,
  },
});

export default cohelp;