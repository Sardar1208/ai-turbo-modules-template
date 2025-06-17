import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import NativeObjectDetectionModule from '../../specs/NativeObjectDetectionModule';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function ObjectDetectionScreen(): React.JSX.Element {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const device = useCameraDevice('back');

  const [detections, setDetections] = useState<any[]>([]);
  const [processingImage, setProcessingImage] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [originalPhotoDimensions, setOriginalPhotoDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const takePhotoAndDetect = useCallback(async () => {
    if (!cameraRef.current || processingImage) return;

    setProcessingImage(true);
    setDetections([]);
    setCapturedPhotoUri(null);
    setOriginalPhotoDimensions(null);

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      const photoPathForNative = photo.path.startsWith('file://') ? photo.path.replace('file://', '') : photo.path;
      const photoUriForDisplay = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      
      setCapturedPhotoUri(photoUriForDisplay);
      setOriginalPhotoDimensions({ width: photo.width, height: photo.height });

      const results = await NativeObjectDetectionModule.detectObjects(photoPathForNative, photo.width, photo.height);
      console.log('Detection Results:', results);
      setDetections(results);
    } catch (e) {
      console.error('Detection error:', e);
      Alert.alert('Error', 'Failed to detect objects.');
    } finally {
      setProcessingImage(false);
    }
  }, [processingImage]);

  const renderBoundingBoxes = () => {
    if (!capturedPhotoUri || !originalPhotoDimensions || detections.length === 0) {
      return null;
    }

    const aspectRatio = originalPhotoDimensions.width / originalPhotoDimensions.height;
    let imageDisplayWidth = screenWidth;
    let imageDisplayHeight = screenWidth / aspectRatio;

    if (imageDisplayHeight > screenHeight) {
      imageDisplayHeight = screenHeight;
      imageDisplayWidth = screenHeight * aspectRatio;
    }

    const offsetX = (screenWidth - imageDisplayWidth) / 2;
    const offsetY = (screenHeight - imageDisplayHeight) / 2;

    return detections.map((detection, index) => {
      const { boundingBox, label, score } = detection;
      
      const modelToOriginalScaleX = originalPhotoDimensions.width / 300;
      const modelToOriginalScaleY = originalPhotoDimensions.height / 300;

      const originalToDisplayScaleX = imageDisplayWidth / originalPhotoDimensions.width;
      const originalToDisplayScaleY = imageDisplayHeight / originalPhotoDimensions.height;
      
      const scaleX = modelToOriginalScaleX * originalToDisplayScaleX;
      const scaleY = modelToOriginalScaleY * originalToDisplayScaleY;

      const left = boundingBox.left * scaleX + offsetX;
      const top = boundingBox.top * scaleY + offsetY;
      const width = (boundingBox.right - boundingBox.left) * scaleX;
      const height = (boundingBox.bottom - boundingBox.top) * scaleY;

      return (
        <View
          key={index}
          style={[
            styles.boundingBox,
            {
              left,
              top,
              width,
              height,
            },
          ]}
        >
          <Text style={styles.label}>
            {label} ({Math.round(score * 100)}%)
          </Text>
        </View>
      );
    });
  };

  if (!hasPermission) {
    return <Text style={styles.permissionText}>Requesting Camera Permission...</Text>;
  }

  if (!device) {
    return <Text style={styles.permissionText}>No camera device found.</Text>;
  }

  return (
    <View style={styles.container}>
      {!capturedPhotoUri ? (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          onInitialized={() => setIsCameraInitialized(true)}
        />
      ) : (
        <Image
          source={{ uri: capturedPhotoUri }}
          style={styles.capturedPhoto}
          resizeMode="contain"
        />
      )}

      {isCameraInitialized && (
        <View style={styles.overlay}>
          {renderBoundingBoxes()}

          <View style={styles.bottomControls}>
            <Text style={styles.infoText}>
              Status: {processingImage ? 'Processing...' : 'Ready'}
            </Text>
            {processingImage && <ActivityIndicator size="large" color="#00ff00" />}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhotoAndDetect}
              disabled={processingImage}
            >
              <Text style={styles.captureButtonText}>
                {processingImage ? 'Detecting...' : 'Capture & Detect'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 50,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  boundingBox: {
    position: 'absolute',
    borderColor: '#00FF00',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  label: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  bottomControls: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: 'white',
    marginBottom: 10,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  capturedPhoto: {
    ...StyleSheet.absoluteFillObject,
    width: screenWidth,
    height: screenHeight,
  },
});

export default ObjectDetectionScreen;