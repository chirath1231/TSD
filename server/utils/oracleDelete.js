const { getObjectStorageClient } = require("../config/oci");

async function deleteFromOracle(fileUrl) {
  try {
    // extract object name from URL
    const parts = fileUrl.split("/o/");
    const objectName = parts[1]; // everything after /o/

    await getObjectStorageClient().deleteObject({
      namespaceName: process.env.OCI_NAMESPACE,
      bucketName: process.env.OCI_BUCKET,
      objectName: objectName,
    });

    console.log("Deleted:", objectName);
  } catch (err) {
    console.error("Oracle delete error:", err.message);
  }
}

module.exports = deleteFromOracle;
