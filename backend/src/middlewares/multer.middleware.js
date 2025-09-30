import multer from "multer";
import path from 'path';


const storage = multer.diskStorage({
    //To decide which folder the uploaded file should be saved in.
    destination: (req, file, cb) => {
        cb(null, path.resolve(process.cwd(), 'public', 'temp'))
    },

    //To decide what the file should be named once it's inside the destination folder.
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }

})

export const upload = multer({ storage: storage })
