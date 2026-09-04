const common = require("oci-common");

const provider = new common.ConfigFileAuthenticationDetailsProvider(
  "C:\\Users\\USER\\.oci\\config",
  "DEFAULT"
);

module.exports = provider;