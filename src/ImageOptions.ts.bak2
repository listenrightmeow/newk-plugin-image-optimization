export interface ImageOptimizationOptions {
  replaceHtml?: boolean;
  replaceCss?: boolean;
  generateSizes?: number[];
  formats?: ('webp' | 'avif')[];
  quality?: number;
  enablePreload?: boolean;
  enableLazyLoading?: boolean;
  enableAspectRatio?: boolean;
  enableBlurPlaceholder?: boolean;
}

export class ImageOptionsFactory {
  static createDefaults(): Required<ImageOptimizationOptions> {
    return {
      replaceHtml: true,
      replaceCss: true,
      generateSizes: [320, 640, 1024, 1440, 1920],
      formats: ['webp', 'avif'],
      quality: 85,
      enablePreload: true,
      enableLazyLoading: true,
      enableAspectRatio: true,
      enableBlurPlaceholder: true
    };
  }

  static merge(
    defaults: ImageOptimizationOptions,
    overrides?: Partial<ImageOptimizationOptions>
  ): Required<ImageOptimizationOptions> {
    return { 
      ...defaults, 
      ...overrides 
    } as Required<ImageOptimizationOptions>;
  }
}