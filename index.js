const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const mysql = require("mysql2");

// Create an Express application
const app = express();

// Middleware to parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("file", file);
    cb(null, __dirname + "/uploads");
  },
  filename: (req, file, cb) => {
    console.log("file", file);
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage: storage, fileFilter: imageFilter }).single(
  "file"
);

let dbConfig = {};
dbConfig["host"] = "localhost";
dbConfig["user"] = "root";
dbConfig["password"] = "sheerDrive@123";
dbConfig["database"] = "store_image";

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

app.get("/image/:id", async (req, res) => {
  let [imageData] = await promisePool.query(
    `SELECT name FROM image_details WHERE id = ${req.params.id}`
  );
  if (imageData.length <= 0) {
    res.status(404).send("No such image found");
  } else {
    res.sendFile(__dirname + "/uploads/" + imageData[0].name);
  }
});

app.post("/upload", async (req, res) => {
  try {
    upload(req, res, async (err, uploadData) => {
      const { filename } = req.file;
      console.log("req.file", req.file);
      promisePool.query("INSERT INTO image_details(name) VALUES(?)", [
        req.file.originalname,
        fs.readFileSync(__dirname + "/uploads/" + filename),
      ]);
      res.send("image upload successfully");
    });
  } catch (error) {}
});

app.listen(81, () => {
  console.log(`Server is running on port ${81}`);
});
