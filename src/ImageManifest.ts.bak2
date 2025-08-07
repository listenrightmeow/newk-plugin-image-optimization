import * as fs from 'fs/promises';
import * as path from 'path';
import { ProcessedImage } from './ImageProcessor.js';

export interface ManifestEntry {
  original: string;
  variants: {
    format: string;
    width: number;
    path: string;
    size: number;
  }[];
  aspectRatio?: number;
  placeholder?: string;
}

export class ImageManifest {
  async create(
    projectPath: string,
    processedImages: Map<string, ProcessedImage>
  ): Promise<void> {
    const manifest = this.buildManifest(processedImages);
    const manifestPath = path.join(projectPath, 'image-manifest.json');
    
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2)
    );
  }

  private buildManifest(
    processedImages: Map<string, ProcessedImage>
  ): Record<string, ManifestEntry> {
    const manifest: Record<string, ManifestEntry> = {};
    
    for (const [original, processed] of processedImages) {
      const key = path.basename(original);
      manifest[key] = {
        original: processed.original,
        variants: processed.variants,
        aspectRatio: processed.aspectRatio,
        placeholder: processed.placeholder
      };
    }
    
    return manifest;
  }
}