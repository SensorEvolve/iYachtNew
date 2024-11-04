import { getYachtImages } from "./db";
import type { ImageRecord } from "./db";

export const getMainImage = async (yachtId: number): Promise<string> => {
  try {
    const images = await getYachtImages(yachtId);
    const mainImage = images.find(
      (img: ImageRecord) => img.image_type === "main",
    );
    return mainImage ? `data:image/png;base64,${mainImage.image_data}` : "";
  } catch (error) {
    console.error("Error loading main image:", error);
    return "";
  }
};

export const getDetailImages = async (yachtId: number): Promise<string[]> => {
  try {
    const images = await getYachtImages(yachtId);
    const detailImages = images
      .filter((img: ImageRecord) => img.image_type === "detail")
      .sort(
        (a: ImageRecord, b: ImageRecord) =>
          (a.image_order || 0) - (b.image_order || 0),
      )
      .map((img: ImageRecord) => `data:image/png;base64,${img.image_data}`);

    // If no detail images, use main image
    if (detailImages.length === 0) {
      const mainImage = await getMainImage(yachtId);
      return mainImage ? [mainImage] : [];
    }

    return detailImages;
  } catch (error) {
    console.error("Error loading detail images:", error);
    return [];
  }
};
