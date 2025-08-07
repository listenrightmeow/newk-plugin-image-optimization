import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ImageVariant {
  format: string;
  width: number;
  path: string;
  size: number;
}

export interface ProcessedImage {
  original: string;
  variants: ImageVariant[];
  placeholder?: string;
  aspectRatio?: number;
}

export class ImageProcessor {
  async process(
    imagePath: string, 
    sizes: number[], 
    formats: string[],
    quality: number
  ): Promise<ProcessedImage> {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const variants: ImageVariant[] = [];
    
    for (const format of formats) {
      for (const width of sizes) {
        if (!metadata.width || width > metadata.width) continue;
        
        const variant = await this.createVariant(
          imagePath, 
          width, 
          format, 
          quality
        );
        variants.push(variant);
      }
    }
    
    return {
      original: imagePath,
      variants,
      aspectRatio: this.calculateAspectRatio(metadata)
    };
  }

  async createPlaceholder(imagePath: string): Promise<string> {
    const image = sharp(imagePath);
    const buffer = await image
      .resize(20)
      .blur(10)
      .toBuffer();
    
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  private async createVariant(
    imagePath: string,
    width: number,
    format: string,
    quality: number
  ): Promise<ImageVariant> {
    const outputPath = this.getVariantPath(imagePath, width, format);
    const image = sharp(imagePath);
    
    await image
      .resize(width)
      .toFormat(format as any, { quality })
      .toFile(outputPath);
    
    const stats = await fs.stat(outputPath);
    
    return {
      format,
      width,
      path: outputPath,
      size: stats.size
    };
  }

  private getVariantPath(
    imagePath: string, 
    width: number, 
    format: string
  ): string {
    const dir = path.dirname(imagePath);
    const fullName = path.basename(imagePath, path.extname(imagePath));
    
    // Clean any existing width suffixes to prevent stacking (e.g., image-320w-640w)
    const cleanName = fullName.replace(/-\d+w(-\d+w)*$/, '');
    
    return path.join(dir, `${cleanName}-${width}w.${format}`);
  }

  private calculateAspectRatio(metadata: sharp.Metadata): number {
    if (!metadata.width || !metadata.height) return 1;
    return metadata.width / metadata.height;
  }
}