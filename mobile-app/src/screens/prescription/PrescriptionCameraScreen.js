// Prescription Camera Screen for AI Integration
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import PrescriptionService from '../../services/prescriptionService';
import { theme } from '../../theme/theme';

const PrescriptionCameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    setHasPermission(cameraStatus === 'granted' && galleryStatus === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        setSelectedImage(photo.uri);
        setShowCamera(false);
        
        Toast.show({
          type: 'success',
          text1: 'Photo Captured',
          text2: 'Prescription image captured successfully',
        });
      } catch (error) {
        console.error('Error taking picture:', error);
        Toast.show({
          type: 'error',
          text1: 'Camera Error',
          text2: 'Failed to capture image',
        });
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        
        Toast.show({
          type: 'success',
          text1: 'Image Selected',
          text2: 'Prescription image selected from gallery',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Gallery Error',
        text2: 'Failed to select image from gallery',
      });
    }
  };

  const uploadPrescription = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please capture or select a prescription image first');
      return;
    }

    // Validate image
    const validation = PrescriptionService.validatePrescriptionImage(selectedImage);
    if (!validation.valid) {
      Alert.alert('Invalid Image', validation.error);
      return;
    }

    setIsProcessing(true);

    try {
      // Upload prescription
      const uploadResult = await PrescriptionService.uploadPrescription(selectedImage);
      
      if (uploadResult.success) {
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: 'AI is processing your prescription...',
        });

        // Wait for AI processing to complete
        const processingResult = await PrescriptionService.waitForProcessing(
          uploadResult.prescriptionId,
          30000 // 30 seconds timeout
        );

        if (processingResult.success) {
          // Navigate to results screen
          navigation.navigate('PrescriptionResult', {
            prescriptionId: uploadResult.prescriptionId,
            suggestions: processingResult,
          });
        } else {
          throw new Error(processingResult.error);
        }
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      console.error('Prescription processing error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: error.message || 'Failed to process prescription',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePicture = () => {
    setSelectedImage(null);
    setShowCamera(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="camera-alt" size={64} color={theme.colors.disabled} />
        <Text style={styles.permissionText}>Camera and gallery permissions are required</Text>
        <Button mode="contained" onPress={requestPermissions} style={styles.permissionButton}>
          Grant Permissions
        </Button>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          ref={setCameraRef}
          type={Camera.Constants.Type.back}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraInstructions}>
              Position prescription within the frame
            </Text>
          </View>
        </Camera>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCamera(false)}
          >
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => {
              setShowCamera(false);
              pickImageFromGallery();
            }}
          >
            <Icon name="photo-library" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.instructionCard}>
        <Card.Content>
          <Title>Upload Prescription</Title>
          <Paragraph>
            Take a clear photo of your prescription or select from gallery. 
            Our AI will extract medicines and suggest available products.
          </Paragraph>
        </Card.Content>
      </Card>

      {selectedImage ? (
        <Card style={styles.imageCard}>
          <Card.Content>
            <Title>Selected Prescription</Title>
            <Image source={{ uri: selectedImage }} style={styles.prescriptionImage} />
            
            <View style={styles.imageActions}>
              <Button
                mode="outlined"
                onPress={retakePicture}
                style={styles.actionButton}
                icon="camera-alt"
              >
                Retake
              </Button>
              
              <Button
                mode="outlined"
                onPress={pickImageFromGallery}
                style={styles.actionButton}
                icon="photo-library"
              >
                Gallery
              </Button>
            </View>

            <Button
              mode="contained"
              onPress={uploadPrescription}
              loading={isProcessing}
              disabled={isProcessing}
              style={styles.uploadButton}
              icon="cloud-upload"
            >
              {isProcessing ? 'Processing with AI...' : 'Upload & Process'}
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.uploadCard}>
          <Card.Content>
            <View style={styles.uploadOptions}>
              <TouchableOpacity
                style={styles.uploadOption}
                onPress={() => setShowCamera(true)}
              >
                <Icon name="camera-alt" size={48} color={theme.colors.primary} />
                <Text style={styles.uploadOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadOption}
                onPress={pickImageFromGallery}
              >
                <Icon name="photo-library" size={48} color={theme.colors.primary} />
                <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.tipsCard}>
        <Card.Content>
          <Title>Tips for Best Results</Title>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Ensure good lighting</Text>
            <Text style={styles.tipItem}>• Keep prescription flat and straight</Text>
            <Text style={styles.tipItem}>• Make sure text is clearly visible</Text>
            <Text style={styles.tipItem}>• Avoid shadows and reflections</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: 16,
  },
  permissionButton: {
    marginTop: 16,
  },
  instructionCard: {
    marginBottom: 16,
  },
  imageCard: {
    marginBottom: 16,
  },
  prescriptionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 16,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  uploadButton: {
    marginTop: 8,
  },
  uploadCard: {
    marginBottom: 16,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  uploadOption: {
    alignItems: 'center',
    padding: 20,
  },
  uploadOptionText: {
    marginTop: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginVertical: 2,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 8,
  },
  cameraInstructions: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cancelButton: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
  },
  galleryButton: {
    padding: 15,
  },
});

export default PrescriptionCameraScreen;
