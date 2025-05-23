"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { BarChart, StackedBarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;

const DataAnalyticsAndReporting = ({ navigation }) => {
  const [activeVisualization, setActiveVisualization] = useState("heatmap");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [animatedValue] = useState(new Animated.Value(0));
  const [chartWidth, setChartWidth] = useState(SCREEN_WIDTH - 40);
  const [chartHeight, setChartHeight] = useState(220);
  const [heatmapData, setHeatmapData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [emergencyData, setEmergencyData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [visitorData, setVisitorData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [eventData, setEventData] = useState({
    labels: [],
    datasets: [],
    legend: [],
    colors: [],
  });
  const [issuesData, setIssuesData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [accountData, setAccountData] = useState([]);

  const visualizations = [
    { id: "heatmap", title: "Issue Heatmap", icon: "map-outline" },
    {
      id: "emergency",
      title: "Emergency Alerts",
      icon: "alert-circle-outline",
    },
    { id: "visitors", title: "Visitor Logs", icon: "person-add-outline" },
    { id: "events", title: "Event Schedule", icon: "calendar-outline" },
    { id: "issues", title: "Top Issues", icon: "warning-outline" },
    {
      id: "accounts",
      title: "Account Status by Society",
      icon: "person-circle-outline",
    },
  ];

  const dataSources = {
    heatmap: heatmapData,
    emergency: emergencyData,
    visitors: visitorData,
    events: eventData,
    issues: issuesData,
    accounts: accountData,
  };

  useEffect(() => {
    fetchAllData();
    animateVisualizations();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchHeatmapData(),
      fetchEmergencyData(),
      fetchVisitorData(),
      fetchEventData(),
      fetchIssuesData(),
      fetchAccountData(),
    ]);
  };

  const decodeJWT = (token) => {
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
  };

  const fetchHeatmapData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;

      if (!adminEmail) {
        Alert.alert("Error", "No admin email found in the token.");
        return;
      }

      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/heatmap?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );

      const data = await response.json();
      console.log("Heatmap data fetched:", data);

      const processedData = data.map((item) => {
        const areaName = item._id.split(",")[0];
        return { _id: areaName, count: item.count };
      });

      setHeatmapData({
        labels: processedData.map((item) => item._id),
        datasets: [{ data: processedData.map((item) => item.count) }],
      });
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      Alert.alert("Error", "Failed to load heatmap data");
    }
  };

  const fetchEmergencyData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;

      if (!adminEmail) {
        Alert.alert("Error", "Failed to decode admin email.");
        return;
      }

      console.log("Admin Email:", adminEmail);

      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/emergency?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );

      const data = await response.json();
      console.log("Emergency data fetched:", data);

      if (Array.isArray(data) && data.length > 0) {
        setEmergencyData({
          labels: data.map((item) => item._id),
          datasets: [{ data: data.map((item) => item.count) }],
        });
      } else {
        console.log("No emergency data available.");
        setEmergencyData({ labels: [], datasets: [{ data: [] }] });
      }
    } catch (error) {
      console.error("Error fetching emergency data:", error);
      Alert.alert("Error", "Failed to load emergency alerts data");
    }
  };

  const fetchVisitorData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;
      if (!adminEmail) {
        Alert.alert("Error", "Invalid user session. Please log in again.");
        return;
      }

      console.log("Admin Email:", adminEmail);

      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/visitors?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );

      const data = await response.json();
      console.log("Visitor data fetched:", data);

      if (Array.isArray(data)) {
        const formattedData = {
          labels: data.map((item) => item._id),
          datasets: [
            {
              data: data.map((item) => item.count),
            },
          ],
        };

        setVisitorData(formattedData);
        console.log("Formatted Visitor Data:", formattedData);
      } else {
        console.log("Invalid visitor data format:", data);
        setVisitorData({ labels: ["No Data"], datasets: [{ data: [0] }] });
      }
    } catch (error) {
      console.error("Error fetching visitor data:", error);
      Alert.alert("Error", "Failed to load visitor logs data");
    }
  };

  const fetchEventData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;
      if (!adminEmail) {
        Alert.alert("Error", "Invalid user session. Please log in again.");
        return;
      }

      console.log("Admin Email:", adminEmail);

      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/events?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );

      const data = await response.json();
      console.log("Event data fetched:", data);

      if (Array.isArray(data) && data.length > 0) {
        const colorPalette = [
          "#FF6384", // Pink
          "#36A2EB", // Blue
          "#FFCE56", // Yellow
          "#4BC0C0", // Teal
          "#9966FF", // Purple
          "#FF9F40", // Orange
          "#7BC043", // Green
          "#C9CBCF", // Gray
        ];

        const eventNames = [...new Set(data.map((item) => item._id))];
        const dates = [...new Set(data.map((item) => item.date))].sort();

        // Create a mapping of event names to colors
        const eventColors = eventNames.reduce((acc, name, index) => {
          acc[name] = colorPalette[index % colorPalette.length];
          return acc;
        }, {});

        // Format data for StackedBarChart
        const stackedData = {
          labels: dates,
          legend: eventNames,
          data: dates.map(date => {
            return eventNames.map(eventName => {
              const event = data.find(
                item => item.date === date && item._id === eventName
              );
              return event ? event.count : 0;
            });
          }),
          barColors: eventNames.map((name, index) => eventColors[name]),
        };

        setEventData({
          ...stackedData,
          colors: eventColors,
        });
      } else {
        console.log("Invalid or empty event data:", data);
        setEventData({ 
          labels: [], 
          legend: [], 
          data: [],
          barColors: [],
          colors: {} 
        });
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      Alert.alert("Error", "Failed to load event schedule data");
    }
  };

  const fetchIssuesData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;
      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/issues?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );

      const data = await response.json();
      console.log("Issues data fetched:", data);

      setIssuesData({
        labels: data.map((item) => item._id),
        datasets: [{ data: data.map((item) => item.count) }],
      });
    } catch (error) {
      console.error("Error fetching issues data:", error);
      Alert.alert("Error", "Failed to load top issues data");
    }
  };

  const fetchAccountData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("Error", "User not logged in. Please log in again.");
        return;
      }

      const decoded = decodeJWT(token);
      const adminEmail = decoded?.email;

      const response = await fetch(
        `http://${ipPort}/api/coadminanalytics/accounts?admin_email=${encodeURIComponent(
          adminEmail
        )}`
      );
      const data = await response.json();
      console.log("Account data fetched:", data);

      setAccountData(
        data.map((item) => ({
          society_name: item.society_name,
          active: item.active,
          inactive: item.inactive,
        }))
      );
    } catch (error) {
      console.error("Error fetching account data:", error);
      Alert.alert("Error", "Failed to load account status data");
    }
  };

  const animateVisualizations = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleGenerateReport = async () => {
    try {
      const htmlContent = generateReportHTML();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const customFileName = "ResidentConnect_Analytics_Report.pdf";
      const newUri = FileSystem.documentDirectory + customFileName;

      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      await Sharing.shareAsync(newUri);
      Alert.alert(
        "Report Generated",
        "The analytics report has been generated and is ready to share."
      );
    } catch (error) {
      console.error("Error generating report:", error);
      Alert.alert("Error", "Failed to generate the report. Please try again.");
    }
  };

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ResidentConnect Analytics Report</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: white;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #135387 0%, #1E88E5 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .section {
              margin-bottom: 30px;
              padding: 0 20px;
            }
            .section-title {
              color: #135387;
              font-size: 22px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .chart-container {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .chart {
              width: 100%;
              max-width: 600px;
              height: auto;
              margin: 0 auto;
              display: block;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background-color: #135387;
              color: white;
              text-align: left;
              padding: 12px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background-color: #f5f5f5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ResidentConnect Analytics Report</h1>
              <p>Generated on: ${currentDate}</p>
            </div>
            ${visualizations
              .map(
                (viz) => `
              <div class="section">
                <h2 class="section-title">${viz.title}</h2>
                <div class="chart-container">
                  <img src="${getChartImage(viz.id)}" class="chart" alt="${
                  viz.title
                } Chart" />
                  ${generateTableForVisualization(viz.id)}
                </div>
              </div>
            `
              )
              .join("")}
            <div class="footer">
              <p>© ${new Date().getFullYear()} ResidentConnect. All rights reserved.</p>
              <p>This report is automatically generated and is intended for internal use only.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateTableForVisualization = (vizId) => {
    switch (vizId) {
      case "heatmap":
        return `
          <table>
            <thead><tr><th>Location</th><th>Issues Reported</th></tr></thead>
            <tbody>
              ${dataSources.heatmap.labels
                .map(
                  (label, i) => `
                <tr><td>${label}</td><td>${dataSources.heatmap.datasets[0].data[i]}</td></tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      case "emergency":
        return `
          <table>
            <thead><tr><th>Alert Type</th><th>Alerts</th></tr></thead>
            <tbody>
              ${dataSources.emergency.labels
                .map(
                  (label, i) => `
                <tr><td>${label}</td><td>${dataSources.emergency.datasets[0].data[i]}</td></tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      case "visitors":
        return `
          <table>
            <thead><tr><th>Day</th><th>Visitors</th></tr></thead>
            <tbody>
              ${dataSources.visitors.labels
                .map(
                  (label, i) => `
                <tr><td>${label}</td><td>${dataSources.visitors.datasets[0].data[i]}</td></tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      case "events":
        if (
          !dataSources.events ||
          !dataSources.events.labels ||
          dataSources.events.labels.length === 0
        ) {
          return `
            <p>No event data available</p>
          `;
        }

        return `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event Name</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${dataSources.events.labels.map((date, dateIndex) => {
                return dataSources.events.legend
                  .map((eventName, eventIndex) => {
                    const count = dataSources.events.data[dateIndex][eventIndex];
                    if (count > 0) {
                      return `
                        <tr>
                          <td>${date}</td>
                          <td>${eventName}</td>
                          <td>${count}</td>
                        </tr>
                      `;
                    }
                    return "";
                  })
                  .join("");
              }).join("")}
            </tbody>
          </table>
        `;
      case "issues":
        return `
          <table>
            <thead><tr><th>Issue Type</th><th>Reports</th></tr></thead>
            <tbody>
              ${dataSources.issues.labels
                .map(
                  (label, i) => `
                <tr><td>${label}</td><td>${dataSources.issues.datasets[0].data[i]}</td></tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      case "accounts":
        return `
          <table>
            <thead><tr><th>Society Name</th><th>Active</th><th>Inactive</th></tr></thead>
            <tbody>
              ${dataSources.accounts
                .map(
                  (item) => `
                <tr><td>${item.society_name}</td><td>${item.active}</td><td>${item.inactive}</td></tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `;
      default:
        return "";
    }
  };

  const getChartImage = (vizId) => {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
  };

  const handleShareInsights = () => {
    Alert.alert("Share Insights", "Preparing insights for sharing...");
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
  }, []);

  const renderVisualizationSelector = ({ item }) => {
    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });
    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.vizCard,
          { transform: [{ translateY }], opacity },
          activeVisualization === item.id && styles.activeVizCard,
        ]}
      >
        <TouchableOpacity onPress={() => setActiveVisualization(item.id)}>
          <Ionicons name={item.icon} size={24} color="#135387" />
          <Text style={styles.vizTitle}>{item.title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Chart size adjustment controls
  const adjustChartSize = (widthChange, heightChange) => {
    setChartWidth(Math.max(SCREEN_WIDTH - 40, Math.min(SCREEN_WIDTH * 3, chartWidth + widthChange)));
    setChartHeight(Math.max(150, Math.min(400, chartHeight + heightChange)));
  };

  const renderChartControls = () => {
    return (
      <View style={styles.chartControls}>
        <Text style={styles.controlLabel}>Adjust Chart Size:</Text>
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => adjustChartSize(-20, 0)}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#135387" />
            <Text style={styles.controlButtonText}>Width</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => adjustChartSize(20, 0)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#135387" />
            <Text style={styles.controlButtonText}>Width</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => adjustChartSize(0, -20)}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#135387" />
            <Text style={styles.controlButtonText}>Height</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => adjustChartSize(0, 20)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#135387" />
            <Text style={styles.controlButtonText}>Height</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChart = (data, config, width, height) => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.chartScrollView}>
        <BarChart
          data={data}
          width={Math.max(width, SCREEN_WIDTH * 1.5)} // Ensure chart is wide enough to scroll
          height={height}
          chartConfig={config}
          style={styles.chart}
          fromZero
          showBarTops={false}
        />
      </ScrollView>
    );
  };

  const renderVisualization = () => {
    // Define a base chart config with a default color function
    const baseChartConfig = {
      backgroundColor: "#ffffff",
      backgroundGradientFrom: "#ffffff",
      backgroundGradientTo: "#ffffff",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(19, 83, 135, ${opacity})`, // Default color function
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      style: { borderRadius: 16 },
      propsForDots: { r: "6", strokeWidth: "2", stroke: "#135387" },
      fromZero: true,
      yAxisInterval: 1,
      verticalLabelRotation: 45,
      showValuesOnTopOfBars: false,
      withInnerLines: true,
      segments: 5,
    };

    // Define color functions for different chart types
    const chartColors = {
      heatmap: (opacity = 1) => `rgba(19, 83, 135, ${opacity})`,
      emergency: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
      visitors: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      issues: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
    };

    switch (activeVisualization) {
      case "heatmap":
        return renderChart(
          dataSources.heatmap,
          {
            ...baseChartConfig,
            yAxisLabel: "Issues",
            color: chartColors.heatmap,
          },
          chartWidth,
          chartHeight
        );
      case "emergency":
        return renderChart(
          dataSources.emergency,
          {
            ...baseChartConfig,
            yAxisLabel: "Alerts",
            color: chartColors.emergency,
          },
          chartWidth,
          chartHeight
        );
      case "visitors":
        if (
          !dataSources.visitors ||
          !dataSources.visitors.labels ||
          dataSources.visitors.labels.length === 0
        ) {
          return <Text>No visitor data available</Text>;
        }

        return renderChart(
          dataSources.visitors,
          {
            ...baseChartConfig,
            yAxisLabel: "Visitors",
            color: chartColors.visitors,
          },
          chartWidth,
          chartHeight
        );
      case "events":
        if (
          !dataSources.events ||
          !dataSources.events.labels ||
          dataSources.events.labels.length === 0
        ) {
          return <Text>No event data available</Text>;
        }

        // Use StackedBarChart for events
        return (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.chartScrollView}>
              <StackedBarChart
                data={dataSources.events}
                width={Math.max(chartWidth, SCREEN_WIDTH * 1.5)}
                height={chartHeight}
                chartConfig={{
                  ...baseChartConfig,
                  decimalPlaces: 0,
                  barPercentage: 0.7,
                  formatYLabel: (value) => `${value}`,
                }}
                style={styles.chart}
                hideLegend={true}
              />
            </ScrollView>
            <View style={styles.legendContainer}>
              {dataSources.events.legend.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: dataSources.events.barColors[index] },
                    ]}
                  />
                  <Text style={styles.legendText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      case "issues":
        return renderChart(
          dataSources.issues,
          {
            ...baseChartConfig,
            yAxisLabel: "Reports",
            color: chartColors.issues,
          },
          chartWidth,
          chartHeight
        );
      case "accounts":
        return (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                Society Name
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Active</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                Inactive
              </Text>
            </View>
            {dataSources.accounts.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : null,
                ]}
              >
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {item.society_name}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.active}
                </Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {item.inactive}
                </Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#135387", "#1E88E5"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Data Analytics</Text>
        <TouchableOpacity
          onPress={() => Alert.alert("Settings", "Analytics settings page")}
        ></TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#135387"]}
          />
        }
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search analytics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Animated.View
          style={[
            styles.vizSelectorContainer,
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {visualizations.map((viz) =>
            renderVisualizationSelector({ item: viz })
          )}
        </Animated.View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {visualizations.find((v) => v.id === activeVisualization)?.title}
          </Text>
          {renderChartControls()}
          {renderVisualization()}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleGenerateReport}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#fff"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Generate Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareInsights}
          >
            <Ionicons
              name="share-social-outline"
              size={20}
              color="#fff"
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Share Insights</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: Platform.OS === "ios" ? 50 : 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  clearSearchButton: {
    padding: 5,
  },
  vizSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  vizCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  activeVizCard: {
    borderColor: "#135387",
    borderWidth: 2,
  },
  vizTitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#135387",
    marginBottom: 15,
  },
  chartScrollView: {
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#135387",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  tableContainer: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#135387",
    padding: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRowEven: {
    backgroundColor: "#f5f5f5",
  },
  tableCell: {
    fontSize: 14,
    color: "#333",
    textAlign: "left",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 15,
    height: 15,
    marginRight: 5,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: "#333",
  },
  chartControls: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  controlButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlButton: {
    alignItems: "center",
    padding: 5,
  },
  controlButtonText: {
    fontSize: 12,
    color: "#135387",
    marginTop: 2,
  },
});

export default DataAnalyticsAndReporting;