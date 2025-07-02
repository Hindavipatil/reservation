const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const multer = require("multer");           // <-- Add multer
require("dotenv").config();

const app = express();
app.use(cors());

// You need this middleware ONLY for parsing JSON (not multipart/form-data)
app.use(express.json());

// Configure multer to save uploaded files to 'uploads/' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");  // Make sure this folder exists in your project root
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.post("/save", upload.single("idfile"), (req, res) => {
  // your existing connection and collection code (unchanged)
  const url = process.env.MONGODB_URL;
  const con = new MongoClient(url);
  const db = con.db("res_2july25");
  const coll = db.collection("reservation");

  // Add idproof and idfile filename to document
  const doc = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    room: req.body.room,
    guest: req.body.guest,
    idproof: req.body.idproof,            // Add id proof type
    idfile: req.file ? req.file.filename : null, // Save uploaded file name or null
    en_dt: new Date().toString(),
  };

  coll.insertOne(doc)
    .then((response) => {
      // create transporter as before
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      let mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "reservation from " + req.body.name,
        text:
    "Name: " + req.body.name + "\n" +
    "Email: " + req.body.email + "\n" +
    "Phone: " + req.body.phone + "\n" +
    "Room: " + req.body.room + "\n" +
    "Guests: " + req.body.guest + "\n" +
    "ID Proof: " + req.body.idproof + "\n" +
    "Check-in Date: " + req.body.indate + "\n" +
    "Check-out Date: " + req.body.outdate,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json(error);
        }
	return res.status(200).json({ message: "Mail sent" });  
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

app.listen(9000, () => {
  console.log("ready to server @9000");
});
