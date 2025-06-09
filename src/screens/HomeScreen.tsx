import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Home: undefined;
    TfjsImplementation: undefined;
    JsiImplementation: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

const HomeScreen = ({ navigation }: Props) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>React Native AI Benchmark</Text>
                <Text style={styles.description}>
                    This app demonstrates the performance difference between running an object detection model in two ways:
                </Text>

                <TouchableOpacity
                    style={[styles.button, styles.jsButton]}
                    onPress={() => navigation.navigate('TfjsImplementation')}>
                    <Text style={styles.buttonTitle}>Screen 1: Optimized JavaScript</Text>
                    <Text style={styles.buttonDescription}>
                        Uses TensorFlow.js with the `tfjs-react-native` adapter for GPU acceleration in the JS environment.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.jsiButton]}
                    onPress={() => navigation.navigate('JsiImplementation')}>
                    <Text style={styles.buttonTitle}>Screen 2: JSI Native Module</Text>
                    <Text style={styles.buttonDescription}>
                        Uses a Vision Camera Frame Processor with a C++ JSI module to run a TensorFlow Lite model natively.
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 30,
    },
    button: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    jsButton: {
        backgroundColor: '#f1c40f',
    },
    jsiButton: {
        backgroundColor: '#3498db',
    },
    buttonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    buttonDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default HomeScreen;