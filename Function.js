const AWS = require("aws-sdk");
const sharp = require("sharp");

const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    let body;
if (typeof event.body === 'string') {
    body = JSON.parse(event.body);
} else {
    body = event.body;
}

    const base64Data = body.imageBase64;

    if (!base64Data) {
      throw new Error("No imageBase64 provided.");
    }

    let base64 = base64Data;
    if (base64.startsWith("data:image")) {
      base64 = base64.split(",")[1]; 
    }

    const buffer = Buffer.from(base64, "base64");

    const processedBuffer = await sharp(buffer)
      .resize({ width: 300 })     
      .grayscale()               
      .toBuffer();                

    const fileName = `processed-${Date.now()}.jpg`;
    const bucket = "image-processor-22101142"; 

    await s3.putObject({
      Bucket: bucket,
      Key: `processed/${fileName}`,
      Body: processedBuffer,
      ContentType: "image/jpeg"
    }).promise();

    // ✅ Generate a pre-signed URL valid for 5 minutes
    const imageUrl = s3.getSignedUrl("getObject", {
      Bucket: bucket,
      Key: `processed/${fileName}`,
      Expires: 300
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Image processed!",
        downloadUrl: imageUrl
      })
    };
  } catch (err) {
    console.error("ERROR:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Processing failed" })
    };
  }
};
