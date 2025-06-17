package com.nativetensorflow

import com.facebook.react.bridge.Promise
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReactApplicationContext
import com.nativetensorflow.NativeObjectDetectionModuleSpec
import org.tensorflow.lite.Interpreter
import android.util.Base64
import android.graphics.BitmapFactory
import android.graphics.Bitmap
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import android.util.Log

@ReactModule(name = NativeObjectDetectionModule.NAME)
class NativeObjectDetectionModule(reactContext: ReactApplicationContext) :
    NativeObjectDetectionModuleSpec(reactContext) {

    companion object {
        const val NAME = "NativeObjectDetectionModule"
        const val TAG = "NativeObjectDetection"
    }

    private val labels = loadLabels(reactContext, "coco_labels.txt")
    private val interpreter = Interpreter(loadModelFile(reactContext, "1.tflite"))

    override fun getName(): String = NAME

    override fun detectObjects(base64Image: String, promise: Promise) {
        try {
            val decodedBytes = Base64.decode(base64Image, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)

            val inputSize = 300
            val resized = Bitmap.createScaledBitmap(bitmap, inputSize, inputSize, true)

            // Prepare input tensor
            val input = Array(1) { Array(inputSize) { Array(inputSize) { ByteArray(3) } } }
            for (y in 0 until inputSize) {
                for (x in 0 until inputSize) {
                    val pixel = resized.getPixel(x, y)
                    input[0][y][x][0] = ((pixel shr 16) and 0xFF).toByte()
                    input[0][y][x][1] = ((pixel shr 8) and 0xFF).toByte()
                    input[0][y][x][2] = (pixel and 0xFF).toByte()
                }
            }

            // Outputs
            val outputLocations = Array(1) { Array(10) { FloatArray(4) } }
            val outputClasses = Array(1) { FloatArray(10) }
            val outputScores = Array(1) { FloatArray(10) }
            val outputCount = FloatArray(1)

            val outputMap = mapOf(
                0 to outputLocations,
                1 to outputClasses,
                2 to outputScores,
                3 to outputCount
            )

            interpreter.runForMultipleInputsOutputs(arrayOf(input), outputMap)

            val results = WritableNativeArray()
            for (i in 0 until 10) {
                val score = outputScores[0][i]
                if (score > 0.5) {
                    val clsIdx = outputClasses[0][i].toInt()
                    val label = labels.getOrElse(clsIdx) { "unknown" }
                    val rect = outputLocations[0][i]
                    val obj = WritableNativeMap()
                    obj.putDouble("x", rect[1].toDouble())
                    obj.putDouble("y", rect[0].toDouble())
                    obj.putDouble("w", (rect[3] - rect[1]).toDouble())
                    obj.putDouble("h", (rect[2] - rect[0]).toDouble())
                    obj.putString("label", label)
                    obj.putDouble("confidence", score.toDouble())
                    results.pushMap(obj)
                }
            }

            promise.resolve(results)
        } catch (e: Exception) {
            Log.e(TAG, "Detection failed: ${e.message}", e)
            promise.reject("DETECTION_ERROR", e.message, e)
        }
    }

    private fun loadLabels(context: ReactApplicationContext, fileName: String): List<String> {
        return context.assets.open(fileName).bufferedReader().readLines()
    }

    private fun loadModelFile(context: ReactApplicationContext, fileName: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(fileName)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }
}
