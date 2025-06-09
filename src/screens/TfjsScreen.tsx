// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';
// import { Camera } from 'expo-camera';
// import { cameraWithTensors } from '@tensorflow/tfjs-react-native';

// const TensorCamera = cameraWithTensors(Camera as any);

// const TfjsScreen = () => {
//     const [model, setModel] = useState<cocoSsd.ObjectDetection>();
//     const [fps, setFps] = useState(0);
//     const [predictions, setPredictions] = useState<cocoSsd.DetectedObject[]>([]);
//     const [permissions, setPermissions] = useState<boolean | null>(null);

//     const frameCount = useRef(0);
//     const lastTime = useRef(Date.now());
//     const animationFrameId = useRef<number>(null);

//     useEffect(() => {
//         (async () => {
//             // Request camera permissions
//             const { status } = await Camera.requestCameraPermissionsAsync();
//             setPermissions(status === 'granted');

//             // Initialize TF.js and load the model
//             await tf.ready();
//             const loadedModel = await cocoSsd.load({ base: 'mobilenet_v2' });
//             setModel(loadedModel);
//         })();

//         // Cleanup function
//         return () => {
//             if (animationFrameId.current) {
//                 cancelAnimationFrame(animationFrameId.current);
//             }
//         };
//     }, []);

//     const handleCameraStream = (images: IterableIterator<tf.Tensor3D>) => {
//         const loop = async () => {
//             if (!model) return;

//             // Wrap in tf.tidy to prevent memory leaks
//             tf.tidy(() => {
//                 const nextImageTensor = images.next().value;
//                 if (nextImageTensor) {
//                     model.detect(nextImageTensor).then(predictionResult => {
//                         setPredictions(predictionResult);

//                         // FPS Calculation
//                         frameCount.current++;
//                         const now = Date.now();
//                         if (now - lastTime.current >= 1000) {
//                             setFps(frameCount.current);
//                             frameCount.current = 0;
//                             lastTime.current = now;
//                         }
//                     });
//                 }
//             });

//             animationFrameId.current = requestAnimationFrame(loop);
//         };
//         loop();
//     };

//     const renderPredictions = () => {
//         return predictions.map((prediction, i) => {
//             const [x, y, w, h] = prediction.bbox;
//             // Adjust coordinates based on camera preview size vs screen size if needed
//             return (
//                 <View
//                     key={i}
//                     style={[
//                         styles.bbox,
//                         {
//                             left: x,
//                             top: y,
//                             width: w,
//                             height: h,
//                         },
//                     ]}
//                 >
//                     <Text style={styles.bboxText}>{`${prediction.class}: ${Math.round(prediction.score * 100)}%`}</Text>
//                 </View>
//             );
//         });
//     };

//     if (permissions === null) {
//         return <View><Text>Requesting camera permissions...</Text></View>;
//     }
//     if (permissions === false) {
//         return <View><Text>No access to camera</Text></View>;
//     }

//     return (
//         <View style={styles.container}>
//             <View style={styles.statusContainer}>
//                 <Text style={styles.statusText}>
//                     {model ? 'TF.js Model Loaded' : 'Loading Model...'}
//                 </Text>
//                 <Text style={styles.fpsText}>{fps} FPS</Text>
//             </View>
//             <TensorCamera
//                 style={styles.camera}
//                 type={"back"}
//                 // Texture dimensions for the model
//                 cameraTextureHeight={1920}
//                 cameraTextureWidth={1080}
//                 // Output tensor dimensions
//                 resizeHeight={300}
//                 resizeWidth={300}
//                 resizeDepth={3}
//                 onReady={handleCameraStream}
//                 autorender={true}
//                 useCustomShadersToResize={false}
//             />
//             <View style={styles.bboxContainer}>{renderPredictions()}</View>
//         </View>
//     );
// };

// // Styles for TfjsScreen
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: 'black',
//     },
//     statusContainer: {
//         position: 'absolute',
//         top: 20,
//         left: 20,
//         right: 20,
//         zIndex: 2,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         padding: 10,
//         borderRadius: 10,
//     },
//     statusText: {
//         color: 'white',
//         fontSize: 16,
//     },
//     fpsText: {
//         color: '#00ff00',
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     camera: {
//         width: '100%',
//         height: '100%',
//     },
//     bboxContainer: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         width: '100%',
//         height: '100%',
//         zIndex: 10
//     },
//     bbox: {
//         position: 'absolute',
//         borderWidth: 2,
//         borderColor: '#00ff00',
//         justifyContent: 'flex-end',
//     },
//     bboxText: {
//         backgroundColor: '#00ff00',
//         color: 'black',
//         fontSize: 12,
//     },
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#f5f5f5',
//     },
//     // container: {
//     //     flex: 1,
//     //     alignItems: 'center',
//     //     padding: 20,
//     // },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: '#333',
//         marginBottom: 10,
//     },
//     description: {
//         fontSize: 16,
//         textAlign: 'center',
//         color: '#666',
//         marginBottom: 30,
//     },
//     button: {
//         width: '100%',
//         padding: 20,
//         borderRadius: 15,
//         marginBottom: 20,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 5,
//         elevation: 8,
//     },
//     jsButton: {
//         backgroundColor: '#f1c40f',
//     },
//     jsiButton: {
//         backgroundColor: '#3498db',
//     },
//     buttonTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#fff',
//         textAlign: 'center',
//     },
//     buttonDescription: {
//         fontSize: 14,
//         color: 'rgba(255, 255, 255, 0.9)',
//         textAlign: 'center',
//         marginTop: 8,
//     },
// });

// export default TfjsScreen;