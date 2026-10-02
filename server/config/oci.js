const common = require("oci-common");
const objectStorage = require("oci-objectstorage");

const REQUIRED = [
  "OCI_TENANCY_OCID",
  "OCI_USER_OCID",
  "OCI_FINGERPRINT",
  "OCI_PRIVATE_KEY",
  "OCI_REGION",
  "OCI_NAMESPACE",
  "OCI_BUCKET",
];

let client = null;

// Created on first use so missing OCI vars don't crash the whole server at startup
function getObjectStorageClient() {
  if (client) return client;

  const missing = REQUIRED.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing OCI environment variables: ${missing.join(", ")}`);
  }

  const provider = new common.SimpleAuthenticationDetailsProvider(
    process.env.OCI_TENANCY_OCID,
    process.env.OCI_USER_OCID,
    process.env.OCI_FINGERPRINT,
    process.env.OCI_PRIVATE_KEY.replace(/\n/g, "\n"),
    process.env.OCI_PRIVATE_KEY_PASSPHRASE || null,
    common.Region.fromRegionId(process.env.OCI_REGION)
  );

  client = new objectStorage.ObjectStorageClient({
    authenticationDetailsProvider: provider,
  });
  return client;
}

module.exports = { getObjectStorageClient };
