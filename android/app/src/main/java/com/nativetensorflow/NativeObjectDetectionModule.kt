package com.nativetensorflow

import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import android.graphics.BitmapFactory
import android.graphics.Bitmap
import android.util.Base64
import android.util.Log
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import com.nativetensorflow.NativeObjectDetectionModuleSpec
import com.facebook.react.bridge.ReactApplicationContext
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import com.facebook.react.bridge.*
import kotlinx.coroutines.*
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.task.vision.detector.ObjectDetector
import java.io.File
import kotlin.math.max
import kotlin.math.min

@ReactModule(name = NativeObjectDetectionModule.NAME)
class NativeObjectDetectionModule(reactContext: ReactApplicationContext) :
    NativeObjectDetectionModuleSpec(reactContext) {

    companion object {
        const val NAME = "NativeObjectDetectionModule"
        const val TAG = "NativeObjectDetection"
    }

    override fun getName(): String = NAME

    override fun detectObjects(imagePath: String, originalPhotoWidth: Double, originalPhotoHeight: Double, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val bitmap = loadBitmapFromPath(imagePath)
                val image = TensorImage.fromBitmap(bitmap)
    
                val options = ObjectDetector.ObjectDetectorOptions.builder()
                    .setMaxResults(5)
                    .setScoreThreshold(0.3f)
                    .build()
    
                // Consider lazy-initializing or creating the detector once for performance
                val detector = ObjectDetector.createFromFileAndOptions(
                    reactApplicationContext,
                    "salad.tflite", // Or make this configurable
                    options
                )
    
                val results = detector.detect(image)
    
                val outputArray = Arguments.createArray()
                for (result in results) {
                    val category = result.categories.firstOrNull() ?: continue
                    val bbox = result.boundingBox
    
                    val map = Arguments.createMap().apply {
                        putString("label", category.label)
                        putDouble("score", category.score.toDouble())
                        putMap("boundingBox", Arguments.createMap().apply {
                            putDouble("left", bbox.left.toDouble())
                            putDouble("top", bbox.top.toDouble())
                            putDouble("right", bbox.right.toDouble())
                            putDouble("bottom", bbox.bottom.toDouble())
                        })
                        // Add the original photo dimensions here
                        putDouble("originalPhotoWidth", originalPhotoWidth)
                        putDouble("originalPhotoHeight", originalPhotoHeight)
                    }
                    outputArray.pushMap(map)
                }
    
                withContext(Dispatchers.Main) {
                    promise.resolve(outputArray)
                }
    
            } catch (e: Exception) {
                Log.e(TAG, "Detection failed: ${e.localizedMessage}", e)
                withContext(Dispatchers.Main) {
                    promise.reject("DETECTION_ERROR", e.localizedMessage)
                }
            }
        }
    }

    private fun loadBitmapFromPath(path: String): Bitmap {
        val targetW = 300
        val targetH = 300

        val options = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
            BitmapFactory.decodeFile(path, this)

            val scaleFactor = max(1, min(outWidth / targetW, outHeight / targetH))

            inJustDecodeBounds = false
            inSampleSize = scaleFactor
            inMutable = true
        }

        val exifInterface = ExifInterface(path)
        val orientation = exifInterface.getAttributeInt(
            ExifInterface.TAG_ORIENTATION,
            ExifInterface.ORIENTATION_UNDEFINED
        )

        val bitmap = BitmapFactory.decodeFile(path, options)

        return when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> rotateImage(bitmap, 90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> rotateImage(bitmap, 180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> rotateImage(bitmap, 270f)
            else -> bitmap
        }
    }

    private fun rotateImage(source: Bitmap, angle: Float): Bitmap {
        val matrix = Matrix().apply { postRotate(angle) }
        return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
    }

    private fun loadLabels(context: ReactApplicationContext, fileName: String): List<String> {
        return context.assets.open(fileName).bufferedReader().useLines { it.toList() }
    }

    private fun loadModelFile(context: ReactApplicationContext, fileName: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(fileName)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.startOffset, fileDescriptor.declaredLength)
    }
}