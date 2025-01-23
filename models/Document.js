const mongoose = require('mongoose'); // Import mongoose
const { Schema } = mongoose;

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: {} }, // Allow storing Delta objects
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        access: { type: String, enum: ['read', 'write'], required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);


// const documentSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     content: { type: String, default: "" },
//     owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     collaborators: [
//       {
//         user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         access: { type: String, enum: ["read", "write"], required: true },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// // Indexing for faster lookups
// documentSchema.index({ owner: 1 });
// documentSchema.index({ "collaborators.user_id": 1 });

// // Add a virtual field for the number of collaborators
// documentSchema.virtual("collaboratorCount").get(function () {
//   return this.collaborators.length;
// });

// // Add methods for common operations
// documentSchema.methods = {
//   // Check if a user is a collaborator
//   isCollaborator(userId) {
//     return this.collaborators.some(
//       (collaborator) => collaborator.user_id.toString() === userId.toString()
//     );
//   },

//   // Check if a user has specific access level
//   hasAccess(userId, accessType) {
//     const collaborator = this.collaborators.find(
//       (collaborator) => collaborator.user_id.toString() === userId.toString()
//     );
//     return collaborator && collaborator.access === accessType;
//   },
// };

// // Add a pre-save hook to validate collaborators
// documentSchema.pre("save", function (next) {
//   // Ensure the owner is not in the collaborators list
//   this.collaborators = this.collaborators.filter(
//     (collaborator) => collaborator.user_id.toString() !== this.owner.toString()
//   );

//   // Ensure there are no duplicate collaborators
//   const uniqueCollaborators = new Set(
//     this.collaborators.map((collaborator) => collaborator.user_id.toString())
//   );
//   if (uniqueCollaborators.size !== this.collaborators.length) {
//     return next(new Error("Duplicate collaborators are not allowed."));
//   }

//   next();
// });

// module.exports = mongoose.model("Document", documentSchema);
