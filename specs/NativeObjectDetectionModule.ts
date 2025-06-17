import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Detection {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
}

export interface Spec extends TurboModule {
  detectObjects(base64Image: string): Promise<Detection[]>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeObjectDetectionModule');
