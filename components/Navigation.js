import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Landing from '../screens/Landing';
import LandingPage from '../screens/Landingpage';
import AddNewSociety from '../screens/AddNewSociety';
import CoAdminLogin from '../screens/AdminLogin';
import Superadminlogin from '../screens/Superadminlogin';
import ResidentLogin from '../screens/ResidentLogin';
import Signup from '../screens/Signup';
import viewvisitordetails from '../screens/viewvisitordetails';
import DashboardScreen from '../screens/DashboardScreen';
import SuperAdminDashboard from '../screens/superadmindashboard';
import CoAdminDashboard from '../screens/coadmindashboard'
import EmergencyAlertsScreen from '../screens/EmergencyAlertsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import dataanalyticsandreporting from '../screens/dataanalyticsandreporting';
import FundraisingScreen from '../screens/FundraisingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import ResidentDirectoryScreen from '../screens/ResidentDirectoryScreen';
import ResourceSharingScreen from '../screens/ResourceSharingScreen';
import VisitorManagementScreen from '../screens/VisitorManagementScreen';
import Sidebar from '../components/Sidebar'; // Assuming this is part of your sidebar component
import Side from '../components/Sidebar';
import Side2 from "./SidebarCoadmin"; // Assuming this is part of your sidebar component
import SidebarCoadmin from "./SidebarCoadmin";
import ManageResidents from "../screens/manageresident";
import Viewvisitordetails from "../screens/viewvisitordetails";
import DataAnalyticsAndReporting from "../screens/dataanalyticsandreporting";
import Coemergencyalerts from "../screens/coemergencyalerts";
import Cohelp from "../screens/cohelp";
import Cosettings from "../screens/cosetting";
import Eventmanagement from "../screens/Eventmanagement";
import Createevent from "../screens/Createevent";
import Deleteevent from "../screens/Deleteevent";
import Updateevent from "../screens/Updateevent";
import Viewevent from "../screens/Viewevent";
import { Image, Dimensions } from 'react-native';

const Stack = createNativeStackNavigator();
const { width: screenWidth } = Dimensions.get('window'); // Get screen dimensions

const headerOptions = {
    headerLeft: () => (
        <Image
            source={require('../assets/U_line.png')} // Replace with your image path
            style={{
                width: screenWidth * 1, // 20% of the screen width
                height: screenWidth * 0.15, // Adjust height based on aspect ratio
                marginLeft: -50, // Add margin from the left edge
            }}
            resizeMode="contain"
        />
    ),
    headerTitle: '', // Removes the screen name
    headerStyle: {
        backgroundColor: '#fff',
    },
};

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="LandingPage">
      <Stack.Screen
        name="LandingPage"
        component={LandingPage}
        options={headerOptions}
      />
      <Stack.Screen
        name="Landing"
        component={Landing}
        options={headerOptions}
      />
      <Stack.Screen
        name="AddNewSociety"
        component={AddNewSociety}
        options={headerOptions}
      />
      <Stack.Screen
        name="dataanalyticsandreporting"
        component={dataanalyticsandreporting}
        options={headerOptions}
      />
      <Stack.Screen
        name="viewvisitordetails"
        component={viewvisitordetails}
        options={headerOptions}
      />
      <Stack.Screen
        name="CoAdminLogin"
        component={CoAdminLogin}
        options={headerOptions}
      />
      <Stack.Screen
        name="Superadminlogin"
        component={Superadminlogin}
        options={headerOptions}
      />
      <Stack.Screen
        name="ResidentLogin"
        component={ResidentLogin}
        options={headerOptions}
      />
      <Stack.Screen
        name="Signup"
        component={Signup}
        options={headerOptions}
      />
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="SuperAdminDashboard"
        component={SuperAdminDashboard}
        options={headerOptions}
      />
      <Stack.Screen
        name="CoAdminDashboard"
        component={CoAdminDashboard}
        options={headerOptions}
      />
      <Stack.Screen
        name="ManageResidents"
        component={ManageResidents}
        options={headerOptions}
      />
      <Stack.Screen
        name="Viewvisitordetails"
        component={Viewvisitordetails}
        options={headerOptions}
      />
      <Stack.Screen
        name="Eventmanagement"
        component={Eventmanagement}
        options={headerOptions}
      />
      <Stack.Screen
        name="Createevent"
        component={Createevent}
        options={headerOptions}
      />
      <Stack.Screen
        name="Updateevent"
        component={Updateevent}
        options={headerOptions}
      />
      <Stack.Screen
        name="Deleteevent"
        component={Deleteevent}
        options={headerOptions}
      />
      <Stack.Screen
        name="Viewevent"
        component={Viewevent}
        options={headerOptions}
      />
      <Stack.Screen
        name="DataAnalyticsAndReporting"
        component={DataAnalyticsAndReporting}
        options={headerOptions}
      />
      <Stack.Screen
        name="Coemergencyalerts"
        component={Coemergencyalerts}
        options={headerOptions}
      />
      <Stack.Screen
        name="Cosettings"
        component={Cosettings}
        options={headerOptions}
      />
      <Stack.Screen
        name="Cohelp"
        component={Cohelp}
        options={headerOptions}
      />
      <Stack.Screen
        name="EmergencyAlertsScreen"
        component={EmergencyAlertsScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="Fundraising"
        component={FundraisingScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="ReportIssueScreen"
        component={ReportIssueScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="ResidentDirectoryScreen"
        component={ResidentDirectoryScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="ResourceSharingScreen"
        component={ResourceSharingScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="VisitorManagementScreen"
        component={VisitorManagementScreen}
        options={headerOptions}
      />
      <Stack.Screen
        name="Sidebar"
        component={Sidebar}
        options={headerOptions}
      />
      <Stack.Screen
        name="Side"
        component={Side}
        options={headerOptions}
      />
      <Stack.Screen
        name="SidebarCoadmin"
        component={SidebarCoadmin}
        options={headerOptions}
      />
      <Stack.Screen
        name="Side2"
        component={Side2}
        options={headerOptions}
      />
    </Stack.Navigator>
  );
}
