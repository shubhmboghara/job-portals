import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_IMGES,
  api_key: process.env.CLOUDINARY_API_KEY_IMGES,
  api_secret: process.env.CLOUDINARY_API_SECRET_IMGES
});


function publicIdimges(url) {
  if (!url) return null;
  url = url.split('?')[0];
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return matches ? matches[1] : null;
}


const uploadOnCloudinaryimges = async (localFilePath) => {

  try {
    if (!localFilePath) return null

    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image"
    })


    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }

    return res
  } catch (error) {
    fs.unlinkSync(localFilePath)
    return null
  }
}

const deleteFromCloudinaryimges = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return result;
  } catch (err) {
    console.error("Cloudinary deletion error:", err);
    throw new Error("Deletion failed");
  }
};



export { uploadOnCloudinaryimges, deleteFromCloudinaryimges, publicIdimges }
