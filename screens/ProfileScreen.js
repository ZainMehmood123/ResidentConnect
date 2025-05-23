import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Button } from 'react-native';
import ImagePicker from 'react-native-image-picker';  // You need to install react-native-image-picker
import Constants from 'expo-constants';
const ipPort = Constants.expoConfig?.extra?.IP_PORT_NO;
const ProfileScreen = () => {
    const [profilePic, setProfilePic] = useState(null);  // State to hold the profile picture
    const [name, setName] = useState("");  // State for the user name
    const [email, setEmail] = useState("");  // State for the user email

    const handleImagePicker = () => {
        const options = {
            title: 'Select Profile Picture',
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else {
                setProfilePic({ uri: response.uri });
            }
        });
    };

    const handleUpdateProfile = () => {
        // Handle profile update logic here (e.g., saving to a backend)
        console.log('Profile updated with name: ', name, ' and email: ', email);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile Screen</Text>
            
            {/* Profile Picture */}
            <View style={styles.profilePicContainer}>
                {profilePic ? (
                    <Image source={profilePic} style={styles.profilePic} />
                ) : (
                    <Text style={styles.noPicText}>No Profile Picture</Text>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
                    <Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
                </TouchableOpacity>
            </View>
            
            {/* Profile Form */}
            <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
            />
            
            {/* Update Profile Button */}
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
                <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'beige' },
    title: { fontSize: 24, fontWeight: 'bold', color: 'black' },
    profilePicContainer: { alignItems: 'center', marginBottom: 20 },
    profilePic: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
    noPicText: { fontSize: 16, color: 'black' },
    uploadButton: { padding: 10, backgroundColor: 'goldenrod', borderRadius: 5 },
    uploadButtonText: { fontSize: 16, color: 'white' },
    input: {
        width: '80%',
        padding: 10,
        marginVertical: 10,
        backgroundColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'gray',
    },
    updateButton: {
        padding: 15,
        backgroundColor: 'goldenrod',
        borderRadius: 5,
        marginTop: 20,
    },
    updateButtonText: {
        fontSize: 16,
        color: 'white',
    },
});

export default ProfileScreen;
