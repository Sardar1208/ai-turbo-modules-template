// import React, { useRef, useState, useEffect, useCallback } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   Platform,
//   Alert,
//   Dimensions,
//   ActivityIndicator,
//   TouchableOpacity,
// } from 'react-native';
// import {
//   Camera,
//   useCameraDevice,
//   useCameraPermission,
//   CameraCaptureError,
// } from 'react-native-vision-camera';
// import RNFS from 'react-native-fs'; // Import react-native-fs
// import NativeObjectDetectionModule, { Detection } from '../../specs/NativeObjectDetectionModule';

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// function ObjectDetectionScreen(): React.JSX.Element {
//   const cameraRef = useRef<Camera>(null);
//   const { hasPermission, requestPermission } = useCameraPermission();
//   const [isCameraInitialized, setIsCameraInitialized] = useState(false);
//   const device = useCameraDevice('front'); // Use the 'back' camera device

//   const [detections, setDetections] = useState<Detection[]>([]);
//   const [processingImage, setProcessingImage] = useState(false);

//   useEffect(() => {
//     async function getAndRequestPermission() {
//       if (!hasPermission) {
//         const result = await requestPermission(); // Request permission directly from hook
//         if (!result) {
//           Alert.alert('Permission denied', 'Camera permission is required to use this feature.');
//         }
//       }
//     }

//     getAndRequestPermission();
//   }, [hasPermission, requestPermission]);

//   const takePhotoAndDetect = useCallback(async () => {
//     if (cameraRef.current == null) {
//       console.warn('Camera is not ready yet!');
//       return;
//     }
//     if (processingImage) {
//       console.log('Already processing an image, please wait.');
//       return;
//     }

//     setProcessingImage(true);
//     setDetections([]); // Clear previous detections

//     try {
//       // Capture a photo
//       const photo = await cameraRef.current.takePhoto({
//         // qualityPrioritization: 'speed',
//         flash: 'off',
//         enableShutterSound: false,
//         // skipMetadata: true,
//       });

//       // Read the photo file as base64
//       const base64Image = await RNFS.readFile(`file://${photo.path}`, 'base64');

//       if (base64Image) {
//         // Call the native module for object detection
//         const results = await NativeObjectDetectionModule.detectObjects(base64Image);
//         console.log('Detection Results:', results);
//         setDetections(results);
//       } else {
//         console.warn("Could not get base64 image from photo.");
//       }
//     } catch (e) {
//       if (e instanceof CameraCaptureError) {
//         switch (e.code) {
//           case 'capture/file-io-error':
//             Alert.alert('File I/O Error', 'Could not save photo to disk.');
//             break;
//         //   case 'capture/not-ready':
//         //     Alert.alert('Camera Not Ready', 'Camera is not yet ready to take photos.');
//         //     break;
//           default:
//             Alert.alert('Capture Error', `An error occurred while capturing photo: ${e.message}`);
//         }
//       } else {
//         Alert.alert('Processing Error', `Failed to process image: ${e}`);
//       }
//       console.error('Failed to take photo or detect objects:', e);
//     } finally {
//       setProcessingImage(false);
//     }
//   }, [processingImage]);

//   if (!hasPermission) {
//     return <Text style={styles.permissionText}>Requesting Camera Permission...</Text>;
//   }

//   if (device == null) {
//     return <Text style={styles.permissionText}>No camera device found.</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       <Camera
//         ref={cameraRef}
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         photo={true} // Enable photo capture
//         onInitialized={() => setIsCameraInitialized(true)}
//       />

//       {isCameraInitialized && (
//         <View style={styles.overlay}>
//           {detections.map((detection, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.boundingBox,
//                 {
//                   // Scale normalized coordinates (0-1) to screen dimensions
//                   left: detection.x * screenWidth,
//                   top: detection.y * screenHeight,
//                   width: detection.w * screenWidth,
//                   height: detection.h * screenHeight,
//                 },
//               ]}
//             >
//               <Text style={styles.label}>
//                 {detection.label} ({Math.round(detection.confidence * 100)}%)
//               </Text>
//             </View>
//           ))}

//           <View style={styles.bottomControls}>
//             <Text style={styles.infoText}>
//               Status: {processingImage ? 'Processing...' : 'Ready'}
//             </Text>
//             {processingImage && <ActivityIndicator size="large" color="#00ff00" />}

//             <TouchableOpacity
//               style={styles.captureButton}
//               onPress={takePhotoAndDetect}
//               disabled={processingImage}
//             >
//               <Text style={styles.captureButtonText}>
//                 {processingImage ? 'Detecting...' : 'Capture & Detect'}
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   permissionText: {
//     color: 'white',
//     fontSize: 20,
//     textAlign: 'center',
//     marginTop: 50,
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   boundingBox: {
//     position: 'absolute',
//     borderColor: '#00FF00',
//     borderWidth: 2,
//     borderRadius: 4,
//     justifyContent: 'flex-start',
//     alignItems: 'flex-start',
//   },
//   label: {
//     color: '#00FF00',
//     fontSize: 12,
//     fontWeight: 'bold',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     paddingHorizontal: 4,
//     paddingVertical: 2,
//   },
//   bottomControls: {
//     width: '100%',
//     padding: 20,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   infoText: {
//     color: 'white',
//     marginBottom: 10,
//   },
//   captureButton: {
//     backgroundColor: '#007AFF',
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 30,
//     marginTop: 10,
//   },
//   captureButtonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

// export default ObjectDetectionScreen;