import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Alert,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import NativeTensorflowModule from '../../specs/NativeTensorflowModule';
import { launchImageLibrary } from 'react-native-image-picker';
import imagenetLabels from '../models/labels';

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function ImageProcess(): React.JSX.Element {
    const [inferenceResult, setInferenceResult] = useState<string>('');
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

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
                    setIsLoading(true);
                    const result = await NativeTensorflowModule.runInference('mobilenet_v2_1.0_224_quant.tflite', base64data);
                    setIsLoading(false);

                    const outputArray = base64ToUint8Array(result);

                    let maxIndex = -1;
                    let maxValue = -1;
                    outputArray.forEach((val, idx) => {
                        if (val > maxValue) {
                            maxValue = val;
                            maxIndex = idx;
                        }
                    });

                    const label = imagenetLabels[maxIndex] || `Unknown class (${maxIndex})`;
                    const confidence = ((maxValue / 255) * 100).toFixed(2);
                    setInferenceResult(`🧠 ${label}\n📈 Confidence: ${confidence}%`);
                } else {
                    Alert.alert('Error', 'Could not convert image to base64.');
                }
            };

            reader.onerror = (error) => {
                Alert.alert('Error reading file', error.toString());
            };

        } catch (e: any) {
            setIsLoading(false);
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
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🧪 TFLite Demo</Text>

            <TouchableOpacity style={styles.button} onPress={pickImage}>
                <Text style={styles.buttonText}>📷 Pick an Image</Text>
            </TouchableOpacity>

            {selectedImageUri && (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
            )}

            <TouchableOpacity
                style={[styles.button, !selectedImageUri && styles.buttonDisabled]}
                onPress={runTFLiteInference}
                disabled={!selectedImageUri || isLoading}
            >
                <Text style={styles.buttonText}>▶️ Run Inference</Text>
            </TouchableOpacity>

            {isLoading && <ActivityIndicator size="large" color="#333" style={{ marginTop: 20 }} />}

            {inferenceResult !== '' && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>{inferenceResult}</Text>
                </View>
            )}

            <Text style={styles.note}>
                Using MobileNet v2 (quantized model) with simplified interpretation.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fafafa',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#222',
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#4a90e2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    imagePreview: {
        width: 240,
        height: 240,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginVertical: 20,
        resizeMode: 'cover',
    },
    resultBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginTop: 20,
        width: '100%',
    },
    resultText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    note: {
        fontSize: 12,
        color: '#888',
        marginTop: 40,
        textAlign: 'center',
    },
});

export default ImageProcess;
