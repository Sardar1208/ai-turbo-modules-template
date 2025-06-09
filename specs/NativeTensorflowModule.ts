import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    runInference(modelPath: string, inputBase64: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeTensorflowModule');
