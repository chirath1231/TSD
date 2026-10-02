const { getObjectStorageClient } = require("../config/oci");

async function uploadToOracle(file) {
  const client = getObjectStorageClient();
  const namespaceName = process.env.OCI_NAMESPACE;
  const bucketName = process.env.OCI_BUCKET;
  const objectName = Date.now() + "-" + file.originalname;

  await client.putObject({
    namespaceName,
    bucketName,
    objectName,
    putObjectBody: file.buffer,
    contentType: file.mimetype,
  });

  return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${encodeURIComponent(objectName)}`;
}

module.exports = uploadToOracle;
