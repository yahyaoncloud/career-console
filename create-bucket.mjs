import { S3Client, ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  forcePathStyle: true,
  region: "eu-west-1", // Dummy region
  endpoint: "https://olxnluwjpkboskbjsmlj.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "754e6f8e0065340cc80dcfab9a958c0d",
    secretAccessKey: "d928e4c2defcf1d27b0e64caecec78b04f466ba1a7f444da49b73bcc58bbb33e",
  }
});

async function run() {
  try {
    console.log("Listing buckets...");
    const listData = await s3Client.send(new ListBucketsCommand({}));
    console.log("Buckets:", listData.Buckets);

    const bucketExists = listData.Buckets?.some(b => b.Name === 'career-assets');
    if (!bucketExists) {
      console.log("Creating bucket 'career-assets'...");
      const createData = await s3Client.send(new CreateBucketCommand({ Bucket: "career-assets" }));
      console.log("Create Success:", createData);
    } else {
      console.log("Bucket 'career-assets' already exists.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
