import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  address: { type: String, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  index: { type: Number },
});

export default mongoose.model("Monitoring", schema)
