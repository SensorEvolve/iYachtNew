const requireYachtImages = () => {
  // @ts-ignore - Ignore TypeScript error for require.context
  const context = require.context("../assets/yachts", false, /\.(png|jpg)$/);
  const images: YachtImageMap = {};
  context.keys().forEach((key: string) => {
    const imageName = key
      .replace(/\.\//, "")
      .replace(/\.(png|jpg)$/, "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    images[imageName] = context(key);
  });
  return images;
};

const yachtImages = requireYachtImages();
const PLACEHOLDER = require("../assets/yachts/placeholder.png");

// Type assertion to tell TypeScript this returns a valid RN image source
export const getMainImage = (imageName: string): number => {
  if (!imageName) return PLACEHOLDER;
  const cleanImageName = imageName.toLowerCase();
  const image = yachtImages[cleanImageName] || PLACEHOLDER;
  return image as number; // Assert the type to number
};

export const getDetailImages = (imageName: string): number[] => {
  if (!imageName) return [PLACEHOLDER];
  const cleanImageName = imageName.toLowerCase();
  const detailImages: number[] = [];

  // Look for numbered variants
  let index = 1;
  while (true) {
    const detailImageName = `${cleanImageName}_${index}`;
    if (yachtImages[detailImageName]) {
      detailImages.push(yachtImages[detailImageName] as number);
      index++;
    } else {
      break;
    }
  }

  // If no detail images found, use the main image
  if (detailImages.length === 0) {
    const mainImage = getMainImage(cleanImageName);
    return [mainImage];
  }

  return detailImages;
};

// Update interface to match React Native's image source type
interface YachtImageMap {
  [key: string]: number;
}

export type { YachtImageMap };
