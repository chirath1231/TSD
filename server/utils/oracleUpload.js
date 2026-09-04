const objectStorage = require("oci-objectstorage");
const provider = require("../config/oci");

const client = new objectStorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = "axz8nar3k6bi";  // 🔥 you must add this
const bucketName = "property-images";

async function uploadToOracle(file) {
  const objectName = Date.now() + "-" + file.originalname;

  await client.putObject({
    namespaceName,
    bucketName,
    objectName,
    putObjectBody: file.buffer,
    contentType: file.mimetype,
  });

  return `https://objectstorage.ap-singapore-1.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;
}

module.exports = uploadToOracle;