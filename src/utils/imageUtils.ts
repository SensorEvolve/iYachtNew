const requireYachtImages = () => {
  const context = require.context("../assets/yachts", false, /\.(png|jpg)$/);
  const images: YachtImageMap = {};

  context.keys().forEach((key) => {
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

export const getMainImage = (imageName: string): string => {
  if (!imageName) return PLACEHOLDER;

  const cleanImageName = imageName.toLowerCase();
  return yachtImages[cleanImageName] || PLACEHOLDER;
};

export const getDetailImages = (imageName: string): string[] => {
  if (!imageName) return [PLACEHOLDER];

  const cleanImageName = imageName.toLowerCase();
  const detailImages: string[] = [];

  // Look for numbered variants
  let index = 1;
  while (true) {
    const detailImageName = `${cleanImageName}_${index}`;
    if (yachtImages[detailImageName]) {
      detailImages.push(yachtImages[detailImageName]);
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

interface YachtImageMap {
  [key: string]: string;
}

export type { YachtImageMap };
