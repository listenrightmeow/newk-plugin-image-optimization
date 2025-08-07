import * as fs from 'fs/promises';
import * as path from 'path';
import glob from 'fast-glob';
import { ProcessedImage } from './ImageProcessor.js';

export class HtmlReplacer {
  async replaceInFiles(
    projectPath: string,
    processedImages: Map<string, ProcessedImage>,
    options: {
      enableLazyLoading?: boolean;
      enableAspectRatio?: boolean;
    }
  ): Promise<number> {
    const files = await this.findHtmlFiles(projectPath);
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

  private async findHtmlFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      `${projectPath}/**/*.{html,jsx,tsx}`,
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
    
    // Replace img tags
    const imgPattern = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/g;
    content = content.replace(imgPattern, (match, before, src, after) => {
      const processed = this.findProcessedImage(src, processedImages);
      if (!processed) return match;
      
      replacementCount++;
      return this.createPictureElement(processed, before, after, options);
    });
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
    }
    
    return replacementCount;
  }

  private findProcessedImage(
    src: string, 
    processedImages: Map<string, ProcessedImage>
  ): ProcessedImage | undefined {
    // Handle import paths like "@assets/filename.png"
    const filename = src.includes('/') ? path.basename(src) : src;
    
    for (const [original, processed] of processedImages) {
      const originalFilename = path.basename(original);
      if (filename === originalFilename || src.includes(originalFilename)) {
        return processed;
      }
    }
    return undefined;
  }

  private createPictureElement(
    processed: ProcessedImage,
    before: string,
    after: string,
    options: any
  ): string {
    const srcSet = this.generateSrcSet(processed);
    const sizes = this.generateSizes();
    const lazy = options.enableLazyLoading ? 'loading="lazy"' : '';
    
    return `<picture>
      ${this.generateSourceElements(processed)}
      <img ${before} src="${processed.original}" srcset="${srcSet}" sizes="${sizes}" ${lazy} ${after}>
    </picture>`;
  }

  private generateSourceElements(processed: ProcessedImage): string {
    const formats = [...new Set(processed.variants.map(v => v.format))];
    return formats.map(format => {
      const variants = processed.variants.filter(v => v.format === format);
      const srcSet = variants
        .map(v => {
          // Convert absolute path to relative path
          const relativePath = v.path.includes('/attached_assets/') 
            ? '/attached_assets/' + v.path.split('/attached_assets/').pop()
            : v.path;
          return `${relativePath} ${v.width}w`;
        })
        .join(', ');
      return `<source type="image/${format}" srcset="${srcSet}">`;
    }).join('\n      ');
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

  private generateSizes(): string {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
}