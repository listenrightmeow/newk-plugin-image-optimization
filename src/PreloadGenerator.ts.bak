import * as fs from 'fs/promises';
import * as path from 'path';
import { ProcessedImage } from './ImageProcessor.js';

export class PreloadGenerator {
  async generate(
    projectPath: string,
    processedImages: Map<string, ProcessedImage>
  ): Promise<void> {
    const criticalImages = this.findCriticalImages(processedImages);
    if (criticalImages.length === 0) return;
    
    const preloadLinks = this.createPreloadLinks(criticalImages);
    await this.insertIntoHtml(projectPath, preloadLinks);
  }

  private findCriticalImages(
    processedImages: Map<string, ProcessedImage>
  ): ProcessedImage[] {
    const critical: ProcessedImage[] = [];
    
    for (const processed of processedImages.values()) {
      const name = path.basename(processed.original);
      if (this.isCriticalImage(name)) {
        critical.push(processed);
      }
    }
    
    return critical.slice(0, 3); // Limit to 3 images
  }

  private isCriticalImage(filename: string): boolean {
    const criticalPatterns = [
      'hero', 'banner', 'logo', 'header',
      'above-fold', 'featured', 'main'
    ];
    
    const lower = filename.toLowerCase();
    return criticalPatterns.some(pattern => lower.includes(pattern));
  }

  private createPreloadLinks(images: ProcessedImage[]): string {
    return images.map(img => {
      // Get the smallest webp variant for faster initial loading
      const webpVariants = img.variants.filter(v => v.format === 'webp');
      if (webpVariants.length === 0) return '';
      
      const webp = webpVariants.reduce((prev, current) => 
        (prev.width < current.width) ? prev : current
      );
      
      // Convert absolute path to relative path
      const relativePath = webp.path.includes('/attached_assets/') 
        ? '/attached_assets/' + webp.path.split('/attached_assets/').pop()
        : webp.path;
      
      return `<link rel="preload" as="image" href="${relativePath}" type="image/webp">`;
    }).filter(Boolean).join('\n    ');
  }

  private async insertIntoHtml(
    projectPath: string,
    preloadLinks: string
  ): Promise<void> {
    const indexPath = await this.findIndexHtml(projectPath);
    if (!indexPath || !preloadLinks) return;
    
    let content = await fs.readFile(indexPath, 'utf-8');
    
    // Remove any existing image preload links (including incorrect ones)
    content = content.replace(
      /<link\s+rel="preload"\s+as="image"[^>]*>/g,
      ''
    );
    
    // Add new preload links
    content = content.replace(
      '</head>',
      `    ${preloadLinks}\n  </head>`
    );
    
    await fs.writeFile(indexPath, content);
  }

  private async findIndexHtml(projectPath: string): Promise<string | null> {
    const patterns = [
      `${projectPath}/index.html`,
      `${projectPath}/public/index.html`,
      `${projectPath}/client/index.html`
    ];
    
    for (const pattern of patterns) {
      try {
        await fs.access(pattern);
        return pattern;
      } catch {
        continue;
      }
    }
    
    return null;
  }
}