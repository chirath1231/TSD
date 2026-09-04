const objectStorage = require("oci-objectstorage");
const provider = require("../config/oci");

const client = new objectStorage.ObjectStorageClient({
  authenticationDetailsProvider: provider,
});

const namespaceName = process.env.OCI_NAMESPACE;
const bucketName = process.env.OCI_BUCKET;

async function uploadToOracle(file) {
  const objectName = Date.now() + "-" + file.originalname;

  await client.putObject({
    namespaceName,
    bucketName,
    objectName,
    putObjectBody: file.buffer,
    contentType: file.mimetype,
  });

  return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;
}

module.exports = uploadToOracle;