import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Button,
    Alert,
    Image,
} from 'react-native';
import NativeTensorflowModule from '../../specs/NativeTensorflowModule';
import { launchImageLibrary } from 'react-native-image-picker';
import imagenetLabels from '../models/labels';

// Helper to decode base64 output to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// // ImageNet labels (first index is usually a dummy/background class for MobileNet)
// const imagenetLabels = [
//     "background",
//     "tench", "goldfish", "great white shark", "tiger shark", "hammerhead", "electric ray", "stingray", "cock", "hen", "ostrich", "cat",
//     // ... truncated: you should include all 1001 labels here.
//     "bolete", "ear", "toilet tissue"
// ];

function ImageProcess(): React.JSX.Element {
    const [inferenceResult, setInferenceResult] = useState<string>('');
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

    const runTFLiteInference = async () => {
        if (!selectedImageUri) {
            Alert.alert('No Image', 'Please select an image first.');
            return;
        }

        try {
            const response = await fetch(selectedImageUri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);

            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];

                if (base64data) {
                    Alert.alert('Running Inference', 'Please wait...');
                    const result = await NativeTensorflowModule.runInference('mobilenet_v2_1.0_224_quant.tflite', base64data);

                    const outputArray = base64ToUint8Array(result);

                    // Find top prediction
                    let maxIndex = -1;
                    let maxValue = -1;
                    outputArray.forEach((val, idx) => {
                        if (val > maxValue) {
                            maxValue = val;
                            maxIndex = idx;
                        }
                    });

                    // const label = imagenetLabels[maxIndex] || 'Unknown';
                    const label = imagenetLabels[maxIndex] || `Unknown class (${maxIndex})`;
                    const confidence = ((maxValue / 255) * 100).toFixed(2);

                    setInferenceResult(`Prediction: ${label}\nConfidence: ${confidence}%`);
                    Alert.alert('Inference Complete', `Prediction: ${label}`);
                } else {
                    Alert.alert('Error', 'Could not convert image to base64.');
                }
            };

            reader.onerror = (error) => {
                Alert.alert('Error reading file', error.toString());
            };

        } catch (e: any) {
            Alert.alert('Inference Error', e.message || 'Unknown error');
            console.error('TFLite Inference Error:', e);
        }
    };

    const pickImage = () => {
        launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                setSelectedImageUri(response.assets[0].uri || null);
                setInferenceResult('');
            }
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>TFLite Turbo Module Demo</Text>

            <Button title="Pick Image" onPress={pickImage} />
            {selectedImageUri && (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
            )}

            <Button
                title="Run TFLite Inference"
                onPress={runTFLiteInference}
                disabled={!selectedImageUri}
            />

            <Text style={styles.resultText}>{inferenceResult}</Text>
            <Text style={styles.note}>
                Note: This uses MobileNet v2 (quantized) and a simplified output interpretation.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    imagePreview: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    resultText: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: '#222',
    },
    note: {
        marginTop: 30,
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    }
});

export default ImageProcess;
