// src/utils/imageUtils.ts

/**
 * Gets the image for a yacht based on its imageName
 * Handles the case where image might not exist
 */
export const getYachtImage = (imageName: string | undefined) => {
  if (!imageName) return null;

  try {
    // Convert to lowercase and ensure proper format
    const normalizedName = imageName.toLowerCase().trim();
    // Dynamic require for the image
    return require(`../assets/yachts/${normalizedName}.png`);
  } catch (error) {
    console.warn(`Image not found for yacht: ${imageName}`);
    return null;
  }
};

/**
 * Checks if an image exists for the given yacht name
 */
export const hasYachtImage = (imageName: string | undefined): boolean => {
  if (!imageName) return false;

  try {
    require(`../assets/yachts/${imageName.toLowerCase().trim()}.png`);
    return true;
  } catch {
    return false;
  }
};
