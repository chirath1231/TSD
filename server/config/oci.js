const common = require("oci-common");

const provider = new common.SimpleAuthenticationDetailsProvider(
  process.env.OCI_TENANCY_OCID,
  process.env.OCI_USER_OCID,
  process.env.OCI_FINGERPRINT,
  process.env.OCI_PRIVATE_KEY.replace(/\\n/g, "\n"),
  process.env.OCI_PRIVATE_KEY_PASSPHRASE || null,
  common.Region.fromRegionId(process.env.OCI_REGION)
);

module.exports = provider;
