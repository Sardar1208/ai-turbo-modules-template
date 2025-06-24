//
//  RCTNativeTensorflow.m
//  AIBenchmarkApp
//
//  Created by Sarthak Suhas Bakre on 24/06/25.
//

#import "RCTNativeTensorflow.h"
#import <React/RCTBridge+Private.h>
#import <ReactCommon/RCTTurboModule.h>
#import <Foundation/Foundation.h>
#import "tensorflow/lite/interpreter.h"
#import "tensorflow/lite/kernels/register.h"
#import "tensorflow/lite/model.h"

using namespace tflite;

@implementation RCTNativeTensorflow {
  std::unique_ptr<Interpreter> interpreter_;
  std::unique_ptr<FlatBufferModel> model_;
}

+ (NSString *)moduleName {
  return @"NativeTensorflowModule";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTensorflowModuleSpecJSI>(params);
}

- (void)runInference:(NSString *)modelPath
               input:(NSString *)base64Image
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject {

  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    @try {
      // 1. Load the TFLite model from file (once) and create the interpreter
      if (!interpreter_) {
        model_ = FlatBufferModel::BuildFromFile([modelPath UTF8String]);
        ops::builtin::BuiltinOpResolver resolver;
        InterpreterBuilder(*model_, resolver)(&interpreter_);
        interpreter_->AllocateTensors();
      }

      // 2. Decode base64 string to UIImage and resize it to match model input
      NSData *imageData = [[NSData alloc] initWithBase64EncodedString:base64Image options:0];
      UIImage *image = [UIImage imageWithData:imageData];
      int width = interpreter_->tensor(interpreter_->inputs()[0])->dims->data[2];
      int height = interpreter_->tensor(interpreter_->inputs()[0])->dims->data[1];
      UIGraphicsBeginImageContextWithOptions(CGSizeMake(width, height), false, 1.0);
      [image drawInRect:CGRectMake(0, 0, width, height)];
      UIImage *resizedImage = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();

      // 3. Convert resized UIImage to raw RGB byte data
      CGImageRef cgImage = resizedImage.CGImage;
      NSUInteger bytesPerRow = width * 4;
      UInt8 *rawData = (UInt8 *)calloc(height * width * 4, sizeof(UInt8));
      CGContextRef context = CGBitmapContextCreate(rawData, width, height, 8, bytesPerRow,
                                                   CGColorSpaceCreateDeviceRGB(),
                                                   kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
      CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);
      CGContextRelease(context);

      // 4. Populate interpreter input buffer with RGB data
      UInt8 *inputBuffer = new UInt8[width * height * 3];
      for (int i = 0, j = 0; i < width * height; ++i) {
        inputBuffer[j++] = rawData[i * 4];     // R
        inputBuffer[j++] = rawData[i * 4 + 1]; // G
        inputBuffer[j++] = rawData[i * 4 + 2]; // B
      }
      free(rawData);
      memcpy(interpreter_->typed_input_tensor<UInt8>(0), inputBuffer, width * height * 3);
      delete[] inputBuffer;

      // 5. Run inference and return output as base64-encoded data
      interpreter_->Invoke();
      TfLiteTensor *outputTensor = interpreter_->tensor(interpreter_->outputs()[0]);
      NSData *outputData = [NSData dataWithBytes:outputTensor->data.uint8
                                          length:outputTensor->bytes];
      NSString *outputBase64 = [outputData base64EncodedStringWithOptions:0];
      resolve(outputBase64);

    } @catch (NSException *exception) {
      reject(@"INFERENCE_FAILED", exception.reason, nil);
    }
  });
}

@end

