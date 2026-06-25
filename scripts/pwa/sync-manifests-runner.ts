import {
  buildPwaManifestJson,
  PWA_MANIFEST_DEFINITIONS,
} from "../../src/core/pwa/pwaManifestDefinitions";

const files = PWA_MANIFEST_DEFINITIONS.map((definition) => ({
  filename: definition.filename,
  json: buildPwaManifestJson(definition),
}));

process.stdout.write(JSON.stringify(files));
