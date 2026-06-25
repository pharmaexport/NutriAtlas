import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const sourcePath = resolve("data/reference/search-index.json.gz.b64");
const outputPath = resolve("data/processed/search-index.json");

function assertFoodIndex(value) {
  if (!Array.isArray(value)) {
    throw new Error("La base décompressée doit être un tableau d'aliments.");
  }

  for (const [index, food] of value.entries()) {
    if (!food || typeof food !== "object") {
      throw new Error(`Entrée invalide à l'index ${index}.`);
    }

    for (const field of ["code", "name", "group", "nutrients"]) {
      if (!(field in food)) {
        throw new Error(`Champ manquant "${field}" à l'index ${index}.`);
      }
    }
  }
}

const base64 = readFileSync(sourcePath, "utf8").replace(/\s+/g, "");
const jsonText = gunzipSync(Buffer.from(base64, "base64")).toString("utf8");
const parsed = JSON.parse(jsonText);

assertFoodIndex(parsed);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

console.log(`Base de référence décompressée : ${parsed.length} aliments -> ${outputPath}`);
