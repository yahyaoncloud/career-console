import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const client = new S3Client({
  forcePathStyle: true,
  region: "us-east-1",
  endpoint: "https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

async function run() {
  try {
    const list = await client.send(new ListBucketsCommand({}));
    console.log("Buckets:", list.Buckets.map(b => b.Name));
  } catch (err) {
    console.error(err);
  }
}
run();
