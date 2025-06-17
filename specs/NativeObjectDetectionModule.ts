import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Detection {
  label: string;
  score: number;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export interface Spec extends TurboModule {
  detectObjects(imagePath: string, originalPhotoWidth: number, originalPhotoHeight: number): Promise<
    Detection[]
  >;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeObjectDetectionModule');
