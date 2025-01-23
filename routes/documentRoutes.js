const express = require("express");
const Document = require("../models/Document");
const { authenticate } = require("../middleware/authMiddleware");
const router = express.Router();

// Create a document
router.post("/", authenticate, async (req, res) => {
  const { title, content } = req.body;
  try {
    const document = new Document({ title, content, owner: req.user.userId });
    await document.save();
    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get documents grouped by ownership and shared access
router.get("/", authenticate, async (req, res) => {
  try {
    const createdByMe = await Document.find({ owner: req.user.userId });
    const sharedWithMe = await Document.find({
      "collaborators.user_id": req.user.userId,
    });
    res.json({ createdByMe, sharedWithMe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share a document with another user
// router.post('/share', authenticate, async (req, res) => {
//   const { documentId, userId, access } = req.body;
//   try {
//     const document = await Document.findById(documentId);

//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     // Ensure only the owner can share
//     if (document.owner.toString() !== req.user.userId) {
//       return res.status(403).json({ message: 'You are not authorized to share this document.' });
//     }

//     // Avoid duplicate collaborators
//     const isAlreadyCollaborator = document.collaborators.some(
//       (collaborator) => collaborator.user_id.toString() === userId
//     );

//     if (isAlreadyCollaborator) {
//       return res.status(400).json({ message: 'User is already a collaborator.' });
//     }

//     // Add collaborator
//     document.collaborators.push({ user_id: userId, access });
//     await document.save();

//     res.json({ message: 'Document shared successfully.', document });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Delete a document
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Only the owner can delete
    if (document.owner.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this document." });
    }

    await document.deleteOne();
    res.json({ message: "Document deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const User = require('../models/User'); // Ensure User model is imported

router.post('/share', authenticate, async (req, res) => {
  const { documentId, userId, access } = req.body;

  console.log('Request body:', req.body);

  if (!documentId || !userId || !access) {
    return res.status(400).json({ message: 'Missing required fields: documentId, userId, or access.' });
  }

  try {
    // Fetch the user's ObjectId using their email
    const user = await User.findOne({ email: userId }); // Assuming 'email' is a field in the User model

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You are not authorized to share this document.' });
    }

    // Check for duplicate collaborators
    const isAlreadyCollaborator = document.collaborators.some(
      (collaborator) => collaborator.user_id.toString() === user._id.toString()
    );

    if (isAlreadyCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator.' });
    }

    // Add the collaborator using their ObjectId
    document.collaborators.push({ user_id: user._id, access });
    await document.save();

    res.json({ message: 'Document shared successfully.', document });
  } catch (err) {
    console.error('Error sharing document:', err);
    res.status(500).json({ error: err.message });
  }
});


// Get a specific document by its ID
router.get("/:id", authenticate, async (req, res) => {
  const documentId = req.params.id;

  try {
    const document = await Document.findById(documentId).populate(
      "owner collaborators.user_id"
    );

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the user has access (either as the owner or a collaborator)
    if (document.owner._id.toString() !== req.user.userId) {
      const collaborator = document.collaborators.find(
        (collab) => collab.user_id._id.toString() === req.user.userId
      );

      console.log(document.collaborators);
      

      if (!collaborator) {
        return res
          .status(403)
          .json({ message: "You do not have access to this document." });
      }
    }

    res.json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a document (for owner or collaborators with write access)
router.put("/:id", authenticate, async (req, res) => {
  const documentId = req.params.id;
  const { title, content } = req.body;

  try {
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Ensure the user has permission to update (either owner or write access)
    if (document.owner.toString() === req.user.userId) {
      // Owner can always update
    } else {
      const collaborator = document.collaborators.find(
        (collab) => collab.user_id.toString() === req.user.userId
      );

      if (!collaborator || collaborator.access !== "write") {
        return res
          .status(403)
          .json({ message: "You do not have write access to this document." });
      }
    }

    document.title = title || document.title;
    document.content = content || document.content;

    await document.save();

    res.json({ message: "Document updated successfully.", document });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
