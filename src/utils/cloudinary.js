import {v2 as cloudinary} from "cloudinary"   // v2 as cloudinary means we are making alias of v2 name
import fs from "fs"

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// this utility function can be used anywhere we just have to provide the filePath and it will provde info after uploading the file
const uploadOnCloudinary = async (localFilePath) => {
    try{

        if(!localFilePath){
            console.log(new Error("\n Unable to locate file!"));
            return null;
        } 

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"  // automatically detects the file type
        });

        //file has been uploaded on cloudinary successfully!
        // response has many fields like url from cloudinary

        // removing the file from cloudinary 
        fs.unlinkSync(localFilePath);
        console.log("\nFile has been uploaded on cloudinary! \n Response: ", response?.url);
        return response;

    } catch (error) {
        // removed the file with path localFilePath from local machine or server
        // so that when next user upload the similar one there will be no duplicate file
        fs.unlinkSync(localFilePath);
        console.log(error);

        return null;
    }
}


export default uploadOnCloudinary;