import * as fs from 'fs/promises';
import * as path from 'path';
import glob from 'fast-glob';
import { ProcessedImage } from './ImageProcessor.js';

export class CssReplacer {
  async replaceInFiles(
    projectPath: string,
    processedImages: Map<string, ProcessedImage>
  ): Promise<number> {
    const files = await this.findCssFiles(projectPath);
    let replacementCount = 0;
    
    for (const file of files) {
      const count = await this.replaceInFile(file, processedImages);
      replacementCount += count;
    }
    
    return replacementCount;
  }

  private async findCssFiles(projectPath: string): Promise<string[]> {
    const patterns = [
      `${projectPath}/**/*.{css,scss,sass,less}`,
      `!${projectPath}/node_modules/**`,
      `!${projectPath}/dist/**`,
      `!${projectPath}/build/**`
    ];
    
    return glob(patterns);
  }

  private async replaceInFile(
    filePath: string,
    processedImages: Map<string, ProcessedImage>
  ): Promise<number> {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    let replacementCount = 0;
    
    // Find background-image declarations
    const bgPattern = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/g;
    
    content = content.replace(bgPattern, (match, url) => {
      const processed = this.findProcessedImage(url, processedImages);
      if (!processed) return match;
      
      replacementCount++;
      const className = this.generateClassName(url);
      return this.generateMediaQueries(processed, className);
    });
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
    }
    
    return replacementCount;
  }

  private findProcessedImage(
    url: string,
    processedImages: Map<string, ProcessedImage>
  ): ProcessedImage | undefined {
    for (const [original, processed] of processedImages) {
      if (url.includes(path.basename(original))) {
        return processed;
      }
    }
    return undefined;
  }

  private generateClassName(url: string): string {
    const name = path.basename(url, path.extname(url));
    return `bg-${name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private generateMediaQueries(
    processed: ProcessedImage,
    className: string
  ): string {
    const queries: string[] = [];
    const sortedVariants = [...processed.variants]
      .sort((a, b) => b.width - a.width);
    
    sortedVariants.forEach((variant, index) => {
      const isLast = index === sortedVariants.length - 1;
      const query = isLast 
        ? `.${className}` 
        : `@media (min-width: ${variant.width}px) { .${className}`;
        
      queries.push(`${query} {
        background-image: url('${variant.path}');
      }${!isLast ? ' }' : ''}`);
    });
    
    return queries.join('\n');
  }
}