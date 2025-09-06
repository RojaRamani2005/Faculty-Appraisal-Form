const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");

const serviceAccount = require("./firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "faculty-appraisal-form.appspot.com"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Multer setup for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Save Profile
 */
app.post("/saveProfile", async (req, res) => {
  try {
    const { uid, firstName, lastName, email } = req.body;

    if (!uid || !firstName || !lastName || !email) {
      return res.status(400).send("Missing profile information");
    }

    await db.collection("faculty").doc(uid).set({
      firstName,
      lastName,
      email,
      timestamp: new Date()
    });

    res.status(200).send("Profile saved successfully");
  } catch (error) {
    res.status(500).send("Error saving profile: " + error.message);
  }
});

/**
 * Submit Self-Appraisal with optional image upload
 */
app.post("/submitAppraisal", upload.single("proofImage"), async (req, res) => {
  try {
    const { uid, title, category, description, date } = req.body;
    let imageUrl = "";

    if (!uid || !title || !category || !description || !date) {
      return res.status(400).send("Missing appraisal information");
    }

    if (req.file) {
      const blob = bucket.file(proofs/$`{Date.now()}_${req.file.originalname}`);
      const blobStream = blob.createWriteStream({
        metadata: { contentType: req.file.mimetype }
      });

      blobStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        blobStream.on("finish", async () => {
          const [url] = await blob.getSignedUrl({
            action: "read",
            expires: "03-01-2030"
          });
          imageUrl = url;
          resolve();
        });
        blobStream.on("error", reject);
      });
    }

    await db.collection("appraisals").add({
      uid,
      title,
      category,
      description,
      date,
      imageUrl,
      submittedAt: new Date()
    });

    res.status(200).send("Appraisal submitted successfully");
  } catch (error) {
    res.status(500).send("Submission failed: " + error.message);
  }
});

/**
 * Filter Appraisals by year, month, or date
 */
app.get("/getAppraisals", async (req, res) => {
  try {
    const { uid, year, month, date } = req.query;

    if (!uid) {
      return res.status(400).send("User ID is required");
    }

    const snapshot = await db.collection("appraisals").where("uid", "==", uid).get();
    const results = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        (year && data.date.includes(year)) ||
        (month && data.date.includes(-$`{month}-`)) ||
        (date && data.date === date) ||
        (!year && !month && !date)
      ) {
        results.push(data);
      }
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).send("Error fetching data: " + error.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on: http://localhost:${PORT}`);
}); 
