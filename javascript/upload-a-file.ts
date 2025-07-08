type CreateUploadUrlResponse = {
  upload_url: string;
  media_url: string;
};

async function uploadFile(file: File, apiKey: string): Promise<string> {
  try {
    // Step 1: Get upload URL from Post for Me API
    const uploadUrlResponse = await fetch(
      "https://api.postforme.dev/v1/media/create-upload-url",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadData: CreateUploadUrlResponse = await uploadUrlResponse.json();

    const {
      upload_url, // file storage location for sending the file to
      media_url, // public URL for the file that is used for posting
    } = uploadData;

    // Step 2: Upload file to the provided URL
    const uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    console.log("File uploaded successfully!");
    return media_url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
}
