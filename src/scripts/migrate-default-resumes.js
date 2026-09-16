// scripts/migrate-default-resumes.js (run with node)
const mongoose = require("mongoose");
const Resume = require("../dist/models/Resume").default; // build path
async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  // Remove stray multiple defaults
  const users = await Resume.distinct("userId");
  for (const uid of users) {
    const defaults = await Resume.find({ userId: uid, isDefault: true })
      .sort({ updatedAt: -1 })
      .lean();
    if (defaults.length > 1) {
      // keep latest, unset others
      const keep = defaults[0]._id;
      const toUnset = defaults.slice(1).map((d) => d._id);
      await Resume.updateMany(
        { _id: { $in: toUnset } },
        { $set: { isDefault: false } }
      );
    } else if (defaults.length === 0) {
      // optional: set latest resume as default for user
      const latest = await Resume.findOne({ userId: uid })
        .sort({ updatedAt: -1 })
        .lean();
      if (latest)
        await Resume.updateOne(
          { _id: latest._id },
          { $set: { isDefault: true } }
        );
    }
  }
  process.exit(0);
}
migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
