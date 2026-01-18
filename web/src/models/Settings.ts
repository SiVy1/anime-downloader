import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: any;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const Settings =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

/**
 * Helper to get a setting value
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const setting = await Settings.findOne({ key });
  return setting ? (setting.value as T) : defaultValue;
}

/**
 * Helper to set a setting value
 */
export async function setSetting(key: string, value: any): Promise<void> {
  await Settings.findOneAndUpdate(
    { key },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true }
  );
}
