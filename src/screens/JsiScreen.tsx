import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet as JsiStyleSheet, Dimensions } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

// This is the JSI function you will create in C++.
// We declare it here so TypeScript knows it exists globally.
declare global {
    function detectObjects(frame: any): any[];
}

const JsiScreen = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [predictions, setPredictions] = useState<any[]>([]);
    const device = useCameraDevice('back');

    // Get screen dimensions for positioning bounding boxes
    const { width, height } = Dimensions.get('window');

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        // The `detectObjects` function is called here. It's a JSI function
        // that runs synchronously on the camera's thread.
        // It receives the frame, processes it in C++ with TFLite, and returns results.
        const detectedObjects = detectObjects(frame);
        runOnJS(setPredictions)(detectedObjects);
    }, []);

    const renderPredictionsJsi = () => {
        // This assumes your JSI function returns objects with {x, y, w, h, label, confidence}
        return predictions.map((p, i) => (
            <View
                key={`prediction_${i}`}
                style={[
                    jsiStyles.bbox,
                    { left: p.x * width, top: p.y * height, width: p.w * width, height: p.h * height },
                ]}
            >
                <Text style={jsiStyles.bboxText}>{`${p.label} ${Math.round(p.confidence * 100)}%`}</Text>
            </View>
        ));
    };


    if (!device) {
        return <View><Text style={jsiStyles.statusText}>No camera device found.</Text></View>;
    }

    return (
        <View style={jsiStyles.container}>
            {hasPermission && device ? (
                <>
                    <Camera
                        style={JsiStyleSheet.absoluteFill}
                        device={device}
                        isActive={true}
                        frameProcessor={frameProcessor}
                        // Increase FPS for benchmark. The actual FPS will be limited by your model's speed.
                        // frameProcessorFps={30}
                    />
                    <View style={jsiStyles.statusContainer}>
                        <Text style={jsiStyles.statusText}>JSI TFLite Model Running</Text>
                    </View>
                    {renderPredictionsJsi()}
                </>
            ) : (
                <Text style={jsiStyles.statusText}>Waiting for camera permission...</Text>
            )}
        </View>
    );
};

const jsiStyles = JsiStyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    statusContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 2,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 10,
    },
    statusText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bbox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#3498db',
        justifyContent: 'flex-end',
    },
    bboxText: {
        backgroundColor: '#3498db',
        color: 'white',
        fontSize: 12,
    },
});

export default JsiScreen;