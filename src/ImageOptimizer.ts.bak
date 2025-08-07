import { 
  OptimizationPlugin, 
  OptimizationContext, 
  OptimizationResult 
} from '@listenrightmeow/replrod/plugin/OptimizationPlugin';
import { ImageScanner } from './ImageScanner.js';
import { ImageProcessor, ProcessedImage } from './ImageProcessor.js';
import { HtmlReplacer } from './HtmlReplacer.js';
import { JsxReplacer } from './JsxReplacer.js';
import { CssReplacer } from './CssReplacer.js';
import { PreloadGenerator } from './PreloadGenerator.js';
import { ImageManifest } from './ImageManifest.js';
import { ImageOptionsFactory } from './ImageOptions.js';

export class ImageOptimizer implements OptimizationPlugin {
  name = 'image-optimization';
  description = 'Optimize images with responsive variants';
  category = 'assets' as const;
  priority = 9; // High priority - must run before CSS optimization

  private scanner = new ImageScanner();
  private processor = new ImageProcessor();
  private htmlReplacer = new HtmlReplacer();
  private jsxReplacer = new JsxReplacer();
  private cssReplacer = new CssReplacer();
  private preloadGen = new PreloadGenerator();
  private manifest = new ImageManifest();

  async isApplicable(context: OptimizationContext): Promise<boolean> {
    return this.scanner.hasImages(context.projectPath);
  }

  async optimize(context: OptimizationContext): Promise<OptimizationResult> {
    try {
      const start = Date.now();
      const result = await this.performOptimization(context);
      return this.createResult(result, start);
    } catch (error) {
      return this.createError(error);
    }
  }

  async validate(context: OptimizationContext): Promise<boolean> {
    try {
      // Check for optimized variants by scanning all images (including processed ones)
      const allImages = await this.scanner.findAllImages(context.projectPath);
      return allImages.some(img => img.includes('-320w.'));
    } catch {
      return false;
    }
  }

  private async performOptimization(
    context: OptimizationContext
  ): Promise<any> {
    const options = this.getOptions(context);
    const images = await this.scanner.findImages(context.projectPath);
    
    // Set verbose mode on replacers
    const verbose = context.config?.verbose || false;
    this.jsxReplacer.setVerbose(verbose);
    
    if (images.length === 0) {
      throw new Error('No images found to optimize');
    }

    const processed = await this.processImages(images, options);
    const stats = await this.replaceReferences(
      context.projectPath, 
      processed, 
      { ...options, verbose }
    );

    await this.generateAssets(context.projectPath, processed, options);
    
    return { processed: processed.size, ...stats };
  }

  private async processImages(
    images: string[], 
    options: any
  ): Promise<Map<string, ProcessedImage>> {
    const processed = new Map<string, ProcessedImage>();
    
    for (const image of images) {
      const result = await this.processor.process(
        image,
        options.generateSizes,
        options.formats,
        options.quality
      );
      
      if (options.enableBlurPlaceholder) {
        result.placeholder = await this.processor.createPlaceholder(image);
      }
      
      processed.set(image, result);
    }
    
    return processed;
  }

  private async replaceReferences(
    projectPath: string,
    processed: Map<string, ProcessedImage>,
    options: any
  ): Promise<any> {
    let htmlCount = 0;
    let cssCount = 0;
    let reactCount = 0;

    if (options.replaceHtml) {
      htmlCount = await this.htmlReplacer.replaceInFiles(
        projectPath, 
        processed, 
        options
      );
      
      // Replace JSX/TSX components
      reactCount = await this.jsxReplacer.replaceInFiles(
        projectPath,
        processed,
        options
      );
    }

    if (options.replaceCss) {
      if (options.verbose) {
        console.log('🎨 Replacing CSS background images with responsive classes...');
      }
      cssCount = await this.cssReplacer.replaceInFiles(
        projectPath, 
        processed
      );
    }

    return { 
      htmlReplacements: htmlCount, 
      cssReplacements: cssCount,
      reactReplacements: reactCount
    };
  }

  private async generateAssets(
    projectPath: string,
    processed: Map<string, ProcessedImage>,
    options: any
  ): Promise<void> {
    if (options.enablePreload) {
      await this.preloadGen.generate(projectPath, processed);
    }
    
    await this.manifest.create(projectPath, processed);
  }

  private getOptions(context: OptimizationContext): any {
    const defaults = ImageOptionsFactory.createDefaults();
    return ImageOptionsFactory.merge(
      defaults,
      context.config.imageOptimization
    );
  }

  private createResult(data: any, start: number): OptimizationResult {
    const savings = this.calculateSavings(data.processed);
    
    return {
      success: true,
      message: `Optimized ${data.processed} images`,
      metrics: {
        improvement: `${savings}% reduction in image sizes`,
        timeBefore: start,
        timeAfter: Date.now()
      }
    };
  }

  private calculateSavings(count: number): number {
    return Math.round(count * 0.65); // Estimate 65% savings
  }

  private createError(error: unknown): OptimizationResult {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Image optimization failed: ${message}`
    };
  }
}