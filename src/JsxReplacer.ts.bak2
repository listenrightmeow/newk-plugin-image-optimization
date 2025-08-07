import * as fs from 'fs/promises';
import * as path from 'path';
import glob from 'fast-glob';
import { ProcessedImage } from './ImageProcessor.js';

export class JsxReplacer {
  private verbose: boolean = false;
  
  setVerbose(verbose: boolean) {
    this.verbose = verbose;
  }
  
  private log(message: string) {
    if (this.verbose) {
      console.log(message);
    }
  }
  async replaceInFiles(
    projectPath: string,
    processedImages: Map<string, ProcessedImage>,
    options: {
      enableLazyLoading?: boolean;
      enableAspectRatio?: boolean;
    }
  ): Promise<number> {
    const files = await this.findJsxFiles(projectPath);
    let replacementCount = 0;
    
    for (const file of files) {
      const count = await this.replaceInFile(
        file, 
        processedImages, 
        options
      );
      replacementCount += count;
    }
    
    return replacementCount;
  }

  private async findJsxFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      `${projectPath}/**/*.{jsx,tsx}`,
      `!${projectPath}/node_modules/**`,
      `!${projectPath}/dist/**`,
      `!${projectPath}/build/**`
    ];
    
    return glob(patterns);
  }

  private async replaceInFile(
    filePath: string,
    processedImages: Map<string, ProcessedImage>,
    options: any
  ): Promise<number> {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    let replacementCount = 0;
    
    this.log(`Checking file: ${filePath}`);
    
    // Replace img tags in JSX
    const imgPattern = /<img\s+([^>]*?)src=\{([^}]+)\}([^>]*?)>/g;
    content = content.replace(imgPattern, (match, before, srcExpression, after) => {
      this.log(`Found JSX img with src={${srcExpression}}`);
      // Handle cases like src={logoImage} or src={require('./logo.png')}
      const processed = this.findProcessedImageBySrc(srcExpression, processedImages, originalContent);
      if (!processed) {
        this.log(`No processed image found for ${srcExpression}`);
        return match;
      }
      
      this.log(`Replacing JSX img with srcset`);
      replacementCount++;
      return this.createOptimizedImgElement(processed, before, after, options);
    });
    
    // Also handle string literals
    const imgStringPattern = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    content = content.replace(imgStringPattern, (match, before, src, after) => {
      this.log(`Found string img with src="${src}"`);
      const processed = this.findProcessedImage(src, processedImages);
      if (!processed) {
        this.log(`No processed image found for ${src}`);
        return match;
      }
      
      this.log(`Replacing string img with srcset`);
      replacementCount++;
      return this.createOptimizedImgElement(processed, before, after, options);
    });
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      this.log(`Updated ${filePath} with ${replacementCount} replacements`);
    } else {
      this.log(`No changes made to ${filePath}`);
    }
    
    return replacementCount;
  }

  private findProcessedImageBySrc(
    srcExpression: string,
    processedImages: Map<string, ProcessedImage>,
    fileContent: string
  ): ProcessedImage | undefined {
    this.log(`Searching for processed image matching: ${srcExpression}`);
    
    // Only try to parse imports for simple variable names (no spaces, operators, etc.)
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(srcExpression)) {
      // Parse import statements from the file content to find the actual file path
      const importRegex = new RegExp(`import\\s+${srcExpression}\\s+from\\s+["']([^"']+)["']`, 'g');
      const match = importRegex.exec(fileContent);
      
      if (match) {
        const importPath = match[1];
        this.log(`Found import: ${srcExpression} from "${importPath}"`);
        
        // Extract filename from import path (handle @assets/ or relative paths)
        const filename = importPath.replace('@assets/', '').replace(/^.*\//, '');
        this.log(`Looking for processed image with filename: ${filename}`);
        
        // Find the processed image by exact filename match
        for (const [original, processed] of processedImages) {
          const originalFilename = path.basename(original);
          if (originalFilename === filename) {
            this.log(`  ✓ Found exact match: ${originalFilename}`);
            return processed;
          }
        }
      }
    } else {
      this.log(`Skipping complex expression: ${srcExpression}`);
    }
    
    this.log(`  ✗ No processed image found for ${srcExpression}`);
    return undefined;
  }

  private findProcessedImage(
    src: string, 
    processedImages: Map<string, ProcessedImage>
  ): ProcessedImage | undefined {
    const filename = src.includes('/') ? path.basename(src) : src;
    
    for (const [original, processed] of processedImages) {
      const originalFilename = path.basename(original);
      if (filename === originalFilename || src.includes(originalFilename)) {
        return processed;
      }
    }
    return undefined;
  }

  private createOptimizedImgElement(
    processed: ProcessedImage,
    before: string,
    after: string,
    options: any
  ): string {
    const srcSet = this.generateSrcSet(processed);
    const sizes = this.generateSizes();
    const lazy = options.enableLazyLoading ? 'loading="lazy"' : '';
    
    // Get the best fallback src (prefer webp, largest size)
    const fallbackSrc = this.getBestFallbackSrc(processed);
    
    return `<img ${before} src="${fallbackSrc}" srcSet="${srcSet}" sizes="${sizes}" ${lazy} ${after}>`;
  }

  private generateSrcSet(processed: ProcessedImage): string {
    return processed.variants
      .filter(v => v.format === 'webp')
      .map(v => {
        // Convert absolute path to relative path
        const relativePath = v.path.includes('/attached_assets/') 
          ? '/attached_assets/' + v.path.split('/attached_assets/').pop()
          : v.path;
        return `${relativePath} ${v.width}w`;
      })
      .join(', ');
  }

  private getBestFallbackSrc(processed: ProcessedImage): string {
    // Get the smallest webp variant as fallback for faster initial load
    const webpVariants = processed.variants.filter(v => v.format === 'webp');
    if (webpVariants.length === 0) return processed.original;
    
    const smallest = webpVariants.reduce((prev, current) => 
      (prev.width < current.width) ? prev : current
    );
    
    return smallest.path.includes('/attached_assets/') 
      ? '/attached_assets/' + smallest.path.split('/attached_assets/').pop()
      : smallest.path;
  }

  private generateSizes(): string {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
}