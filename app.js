require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const compression = require("compression");
// const fs = require("fs");
const reader = require("xlsx");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db_config.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".xlsx") {
      req.err = true;
      return cb(null, false, new Error("cant"));
    }
    cb(null, true);
  },
});

function auth(req, res, next) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, process.env.KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.email = decoded.email;
    next();
  });
}
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    let collection = db.collection("logdet");
    let user = await collection.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "user exists login" });
    }
    const salt = await bcrypt.genSalt();
    const encrytedPass = await bcrypt.hash(password, salt);
    let newIns = await collection.insertOne({
      email: email,
      password: encrytedPass,
    });

    if (newIns.acknowledged == true) {
      return res.status(201).json({ message: "user created" });
    } else {
      return res.status(500).json({ message: "some error occured" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal server error!" });
  }
});
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let collection = db.collection("logdet");
    let user = await collection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "No user Found" });
    }
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      res.status(401).json({ message: "Password incorrect" });
      return;
    }
    const token = jwt.sign({ email }, process.env.KEY, { expiresIn: "24h" });
    res.json(token);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/api/upload", [auth, upload.single("file")], (req, res) => {
  if (req.err) {
    res.json({ upload: "not done" });
  } else {
    try {
      const collection = db.collection("userdata");
      // const file = reader.readFile(
      //   path.join(__dirname, "/uploads", req.file.originalname)
      // );
      const file = reader.read(req.file.buffer, { type: "buffer" });
      let data = [];
      const sheets = file.SheetNames;
      for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
          file.Sheets[file.SheetNames[i]]
        );
        temp.forEach((res) => {
          data.push(res);
        });
      }
      data.map(async (element) => {
        await collection.insertOne(element);
      });
      // fs.unlinkSync(path.join(__dirname, "/uploads", req.file.originalname));
      res.json({ upload: "Done" });
    } catch (e) {
      res.json(e);
    }
  }
});
app.get("/api/getdata/:pagenum/:pagesize", auth, async (req, res) => {
  try {
    const pageN = parseInt(req.params.pagenum);
    const pageS = parseInt(req.params.pagesize);
    const skip = (pageN - 1) * pageS;
    const data = await db
      .collection("userdata")
      .find({})
      .skip(skip)
      .limit(pageS)
      .toArray();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});
app.listen(3000, () => {
  console.log("running");
});
