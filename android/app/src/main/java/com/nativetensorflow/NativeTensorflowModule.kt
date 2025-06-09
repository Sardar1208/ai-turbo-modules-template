package com.nativetensorflow

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.nativetensorflow.NativeTensorflowModuleSpec
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import android.util.Base64 // For decoding base64 input
import android.graphics.BitmapFactory
import android.graphics.Bitmap
import java.io.ByteArrayOutputStream
import android.util.Log // <--- ADDED LOG IMPORT

@ReactModule(name = NativeTensorflowModule.NAME)
class NativeTensorflowModule(reactContext: ReactApplicationContext) :
    NativeTensorflowModuleSpec(reactContext) {

    private var interpreter: Interpreter? = null

    companion object {
        const val NAME = "NativeTensorflowModule"
        const val TAG = "NativeTensorflowModule"
    }

    init {
        Log.d(TAG, "NativeTensorflowModule initialized")
    }

    override fun getName(): String {
        return NAME
    }

    // Helper to load the TFLite model from assets
    private fun loadModelFile(modelPath: String): MappedByteBuffer {
        Log.d(TAG, "Attempting to load model file: $modelPath") // <--- ADDED LOG
        val assetFileDescriptor = reactApplicationContext.assets.openFd(modelPath)
        val fileInputStream = FileInputStream(assetFileDescriptor.fileDescriptor)
        val fileChannel = fileInputStream.channel
        val startOffset = assetFileDescriptor.startOffset
        val declaredLength = assetFileDescriptor.declaredLength
        val modelByteBuffer = fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
        Log.d(TAG, "Model file loaded successfully: $modelPath, size: $declaredLength bytes") // <--- ADDED LOG
        return modelByteBuffer
    }

    // This method runs the inference
    // It takes the model path and a base64 encoded input string (e.g., image)
    // and returns a base64 encoded output (for demonstration, might be complex in real case)
    override fun runInference(modelPath: String, inputBase64: String, promise: Promise) {
        Log.d(TAG, "runInference called for model: $modelPath") // <--- ADDED LOG
        try {
            // Initialize interpreter if not already initialized or if modelPath changes
            if (interpreter == null) {
                Log.d(TAG, "Interpreter is null, initializing new interpreter.") // <--- ADDED LOG
                val modelByteBuffer = loadModelFile(modelPath)
                interpreter = Interpreter(modelByteBuffer)
                Log.d(TAG, "Interpreter initialized successfully.") // <--- ADDED LOG
            } else {
                Log.d(TAG, "Interpreter already initialized, reusing existing instance.") // <--- ADDED LOG
            }

            // --- Input Processing (Simplified - adjust for your model's actual input) ---
            Log.d(TAG, "Decoding base64 input for image.") // <--- ADDED LOG
            val decodedBytes = Base64.decode(inputBase64, Base64.DEFAULT)
            Log.d(TAG, "Decoded bytes length: ${decodedBytes.size}") // <--- ADDED LOG
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            if (bitmap == null) { // <--- ADDED NULL CHECK FOR BITMAP
                promise.reject("INPUT_ERROR", "Failed to decode base64 into Bitmap. Input might be invalid.")
                Log.e(TAG, "Failed to decode base64 into Bitmap.") // <--- ADDED ERROR LOG
                return
            }
            Log.d(TAG, "Bitmap decoded successfully. Original dimensions: ${bitmap.width}x${bitmap.height}") // <--- ADDED LOG

            // Resize bitmap to model's expected input dimensions (example, adjust as needed)
            val inputShape = interpreter!!.getInputTensor(0).shape()
            Log.d(TAG, "Model input shape: ${inputShape.joinToString()}") // <--- ADDED LOG
            if (inputShape.size < 4) {
                promise.reject("INVALID_MODEL", "Model input shape is not compatible for image processing demo.")
                Log.e(TAG, "Model input shape size < 4, not compatible.") // <--- ADDED ERROR LOG
                return
            }
            val inputHeight = inputShape[1] // Assuming H is at index 1
            val inputWidth = inputShape[2] // Assuming W is at index 2
            Log.d(TAG, "Resizing bitmap to: ${inputWidth}x${inputHeight}") // <--- ADDED LOG
            val resizedBitmap = Bitmap.createScaledBitmap(bitmap, inputWidth, inputHeight, true)
            Log.d(TAG, "Bitmap resized successfully.") // <--- ADDED LOG

            // Convert Bitmap to ByteBuffer (RGBA float, normalized to 0-1 for example)
            Log.d(TAG, "Converting bitmap to ByteBuffer for inference input.") // <--- ADDED LOG
            // Convert Bitmap to ByteBuffer (Assuming UINT8 RGB input - 0-255)
            val inputByteBuffer = ByteBuffer.allocateDirect(1 * inputHeight * inputWidth * 3)
            inputByteBuffer.order(java.nio.ByteOrder.nativeOrder())
            val intValues = IntArray(inputWidth * inputHeight)
            resizedBitmap.getPixels(intValues, 0, inputWidth, 0, 0, inputWidth, inputHeight)

            for (i in intValues.indices) {
                val pixelValue = intValues[i]
                // Put byte values (0-255) directly, no float normalization
                inputByteBuffer.put((pixelValue shr 16 and 0xFF).toByte()) // Red
                inputByteBuffer.put((pixelValue shr 8 and 0xFF).toByte())  // Green
                inputByteBuffer.put((pixelValue and 0xFF).toByte())       // Blue
            }
            Log.d(TAG, "Input ByteBuffer prepared. Capacity: ${inputByteBuffer.capacity()}, Position: ${inputByteBuffer.position()}") // <--- ADDED LOG

            // --- Output Processing (Simplified - adjust for your model's actual output) ---
            val outputShape = interpreter!!.getOutputTensor(0).shape()
            val outputDataType = interpreter!!.getOutputTensor(0).dataType() // <--- ADDED LOG
            Log.d(TAG, "Model output shape: ${outputShape.joinToString()}, Data type: $outputDataType") // <--- ADDED LOG
            val outputByteBuffer = ByteBuffer.allocateDirect(1 * outputShape.reduce { acc, i -> acc * i })
            outputByteBuffer.order(java.nio.ByteOrder.nativeOrder())
            Log.d(TAG, "Output ByteBuffer allocated. Capacity: ${outputByteBuffer.capacity()}") // <--- ADDED LOG

            // Reset buffer positions before running inference
            inputByteBuffer.rewind() // <--- ADDED REWIND
            outputByteBuffer.rewind() // <--- ADDED REWIND

            // Run inference
            Log.d(TAG, "Running TFLite inference...") // <--- ADDED LOG
            interpreter!!.run(inputByteBuffer, outputByteBuffer)
            Log.d(TAG, "TFLite inference completed.") // <--- ADDED LOG

            // Convert outputByteBuffer to something understandable in JS (e.g., base64 string for a raw byte array)
            // For a real classification model, you'd parse probabilities here.
            outputByteBuffer.rewind() // <--- ADDED REWIND before reading
            val outputBytes = ByteArray(outputByteBuffer.remaining())
            outputByteBuffer.get(outputBytes)
            val outputBase64 = Base64.encodeToString(outputBytes, Base64.DEFAULT)
            Log.d(TAG, "Output converted to Base64 (first 100 chars): ${outputBase64.substring(0, Math.min(outputBase64.length, 100))}") // <--- ADDED LOG

            promise.resolve(outputBase64)
            Log.d(TAG, "Promise resolved successfully.") // <--- ADDED LOG

        } catch (e: Exception) {
            Log.e(TAG, "Error running TFLite inference: ${e.message}", e) // <--- ADDED ERROR LOG WITH EXCEPTION
            promise.reject("TFLITE_ERROR", "Error running TFLite inference: ${e.message}", e)
        } finally {
            Log.d(TAG, "Inference try-catch block finished.") // <--- ADDED LOG
            // It's often good to keep the interpreter open for subsequent calls unless you need to free memory.
            // If you want to close it after each inference: interpreter?.close()
        }
    }

    // You might want a method to close the interpreter explicitly
    override fun invalidate() {
        Log.d(TAG, "invalidate() called. Closing interpreter.") // <--- ADDED LOG
        interpreter?.close()
        interpreter = null
        super.invalidate()
    }
}