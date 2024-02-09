const multer = require('multer');
const path = require('path');

const storage=multer.diskStorage({
  destination:(req,file,callback)=>{
    const destinationPath=path.resolve(__dirname, '../public/upload');
      callback(null,destinationPath);
  },
  filename:(req,file,callback)=>{
      // console.log(file);
      const uniqueSuffix= Date.now() + '-' + Math.round(Math.random() * 1E9);
      callback(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload= multer({storage})
// Configuration for single file upload
const storageSingle = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.resolve(__dirname, '../public/upload');
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  },
});

const uploadSingle = multer({ storage: storageSingle });

module.exports = { uploadSingle,upload };
