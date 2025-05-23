import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
export default StyleSheet.create({
  // General container for most screens
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white', // Black background
    paddingHorizontal: 20,
  },
  
  // Logo styling
  logo: {
    width: 330,
    height: 170,
    marginTop:-40,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 100,
  },

  // App title
  appTitle: {
    fontSize: 28,
    color: 'goldenrod', // Goldenrod for app title
    fontWeight: 'bold',
    marginBottom: 40,
  },

  // Title for screens like Login/Signup
  title: {
    fontSize: 28,
    color: '#135387', // Goldenrod for title
    fontWeight: 'bold',
    marginBottom: 10,
  },

  inputContainer: {
    position: 'relative',
    marginBottom: 20,
    width: '100%',
  },
  label: {
    position: 'absolute',
    top: -10, // Position the label to overlap the border
    left: 15, // Align it with the padding of the input
    fontSize: 14,
    color: '#aaa',
    backgroundColor: '#fff', // Make the background match the input field
    paddingHorizontal: 5, // Create a nice "cut-out" effect
    zIndex: 1, // Ensure the label is above the input border
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#aaa',
    position: 'relative',
    zIndex: 0, // Ensure the input border goes under the label
  },
  
    

  // Button styling for general use
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#135387', // Goldenrod button color
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white', // Black text color on button
    fontWeight: 'bold',
  },

  // Signup link container and text
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#807d7d',
  },
  signupLink: {
    fontSize: 14,
    color: '#28A745', // Goldenrod link
    fontWeight: 'bold',
    marginLeft: 5,
  },
  eyeIcon: {
    position: 'absolute', // Position the icon absolutely relative to its parent
    right: 15, // Distance from the right edge of the password field
    top: '30%', // Adjust vertically to center it in the field
    zIndex: 1, // Ensure it appears above the TextInput
  },  
  // Dashboard-specific styles
  welcomeMessage: {
    fontSize: 20,
    color: 'goldenrod', // Goldenrod for welcome message
    marginBottom: 20,
    textAlign: 'center',
  },
  featureContainer: {
    marginVertical: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 22,
    color: 'goldenrod', // Goldenrod for section titles
    marginBottom: 10,
  },
  text: {
    color: '#beige', // Beige text for general text
    fontSize: 16,
    marginBottom: 5,
  },
  featureButton: {
    backgroundColor: 'goldenrod',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  featureText: {
    fontSize: 16,
    color: '#000000', // Black text on feature buttons
    fontWeight: 'bold',
  },

  // Emergency alert button styling for the dashboard
  emergencyButton: {
    backgroundColor: '#FF0000', // Red for emergency alerts
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Logout button styling
  logoutButton: {
    backgroundColor: 'grey',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },

  // Additional styles
  recentIssuesContainer: {
    marginVertical: 20,
  },
  recentIssueText: {
    fontSize: 18,
    color: 'goldenrod', // Goldenrod for recent issue title
    marginBottom: 10,
  },
  recentIssueItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  recentIssueTextContent: {
    fontSize: 16,
    color: '#000000', // Black text for recent issue content
  },
  dashboardSectionContainer: {
    marginVertical: 15,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  dashboardSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'goldenrod', // Goldenrod for section titles in dashboard
    marginBottom: 10,
  },
  dashboardSectionText: {
    fontSize: 16,
    color: '#beige', // Beige text in dashboard
  },
  forgotPasswordButton: {
    marginTop: 20,
  },
  forgotPasswordButtonText: {
    fontSize: 16,
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 13,
    textAlign: 'center',
  },
  generateButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    marginTop: 20, // Added marginTop to add space from the top
  },
  
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  closeModalButton: {
    paddingVertical: 12,  // Increased padding for better spacing and appearance
    alignItems: 'center',
    backgroundColor: '#f44336',
    borderRadius: 5,
    marginTop: 15,  // Added space between the buttons
  },
  
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationContainer: {
    padding: 20,
  },
  verificationText: {
    fontSize: 18,
    color:"red",
    textAlign: 'center',
    marginBottom: 10,
  },
  verificationCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  verificationCodeInput: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 17,
    fontWeight:"bold",
    borderRadius: 5,
  },
  resendText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#f44336',
  },
  sendButton: {
    backgroundColor: '#ff5722',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  passwordResetContainer: {
    padding: 20,
  },
  inputc: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop:10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeIcon: {
    position: 'absolute',
    top: 19,
    right: 16,
    zIndex: 1,
  },
  closeIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
  },
  timerText: {
    color: 'green',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  
  timerTextExpired: {
    color: 'red',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  
});