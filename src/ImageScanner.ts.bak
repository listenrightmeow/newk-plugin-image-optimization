import glob from 'fast-glob';

export class ImageScanner {
  private readonly supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];

  async findImages(projectPath: string): Promise<string[]> {
    const allImages = await this.findAllImages(projectPath);
    // Filter out already optimized images to prevent recursive processing
    return this.filterOriginalImages(allImages);
  }

  async findAllImages(projectPath: string): Promise<string[]> {
    const patterns = this.getImagePatterns(projectPath);
    const allImages: string[] = [];
    
    for (const pattern of patterns) {
      const images = await glob(pattern);
      allImages.push(...images);
    }
    
    return allImages;
  }

  private filterOriginalImages(images: string[]): string[] {
    return images.filter(image => {
      // Skip images that already have width suffixes (indicating they're optimized variants)
      const filename = image.split('/').pop() || '';
      return !/-\d+w\.(webp|avif|jpg|jpeg|png)$/i.test(filename);
    });
  }

  async hasImages(projectPath: string): Promise<boolean> {
    const images = await this.findImages(projectPath);
    return images.length > 0;
  }

  private getImagePatterns(projectPath: string): string[] {
    return [
      `${projectPath}/client/src/**/*{${this.supportedFormats.join(',')}}`,
      `${projectPath}/public/**/*{${this.supportedFormats.join(',')}}`,
      `${projectPath}/src/**/*{${this.supportedFormats.join(',')}}`,
      `${projectPath}/assets/**/*{${this.supportedFormats.join(',')}}`,
      `${projectPath}/attached_assets/**/*{${this.supportedFormats.join(',')}}`,
      `${projectPath}/images/**/*{${this.supportedFormats.join(',')}}`
    ];
  }
}