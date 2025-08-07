// Standalone type definitions for plugin
export interface OptimizationContext {
  projectPath: string;
  config?: any;
  isVerbose?: boolean;
  isDryRun?: boolean;
}

export interface OptimizationResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
}

export interface OptimizationPlugin {
  name: string;
  description: string;
  category: 'performance' | 'seo' | 'assets' | 'build';
  priority: number;
  
  isApplicable(context: OptimizationContext): Promise<boolean>;
  apply(context: OptimizationContext): Promise<OptimizationResult>;
}

export interface ReplrodOptimizationPlugin {
  metadata: {
    name: string;
    version: string;
    description: string;
    author: string;
    expectedImprovement: string;
  };
  optimization: OptimizationPlugin;
  onLoad?(): Promise<void>;
  onUnload?(): Promise<void>;
}
