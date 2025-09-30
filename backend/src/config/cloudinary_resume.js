import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_RESUME,
  api_key: process.env.CLOUDINARY_API_KEY_RESUME,
  api_secret: process.env.CLOUDINARY_API_SECRET_RESUME
});

function publicIdresume(url) {
  if (!url) return null;
  url = url.split('?')[0];
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return matches ? matches[1] : null;
}


const uploadOnCloudinaryresume = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("Cloudinary upload failed: No local file path provided.");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};


const deleteFromCloudinaryresume = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return result;
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw new Error("Deletion failed");
  }
};


export { uploadOnCloudinaryresume, deleteFromCloudinaryresume,publicIdresume };