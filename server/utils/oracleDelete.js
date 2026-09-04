const objectStorage = require("oci-objectstorage");
const provider = require("../config/oci");

const client = new objectStorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

// ✅ MUST MATCH upload file
const namespaceName = "axz8nar3k6bi";
const bucketName = "property-images";

async function deleteFromOracle(fileUrl) {
  try {
    // extract object name from URL
    const parts = fileUrl.split("/o/");
    const objectName = parts[1]; // everything after /o/

    await client.deleteObject({
      namespaceName: namespaceName, // ✅ FIXED
      bucketName: bucketName,
      objectName: objectName,
    });

    console.log("Deleted:", objectName);
  } catch (err) {
    console.error("Oracle delete error:", err.message);
  }
}

module.exports = deleteFromOracle;