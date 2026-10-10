import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/concepts/catalog.json");

export class ConceptCatalog {
  constructor(file = root) {
    this.file = file;
    this.reload();
  }

  reload() {
    this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
  }

  getCategories() {
    return this.data.categories.filter((category) => category.active);
  }

  getConcepts({ categoryId, tags = [], limit = 10 } = {}) {
    const normalizedTags = tags.map((tag) => tag.toLowerCase());
    return this.data.concepts
      .filter((concept) => concept.active)
      .filter((concept) => !categoryId || concept.categoryId === categoryId)
      .map((concept) => ({
        concept,
        score: normalizedTags.length === 0
          ? 0
          : normalizedTags.filter((tag) => concept.tags.includes(tag)).length
      }))
      .sort((a, b) => b.score - a.score || a.concept.code.localeCompare(b.concept.code))
      .slice(0, limit)
      .map(({ concept }) => concept);
  }

  getConcept(code) {
    return this.data.concepts.find((concept) => concept.active && concept.code.toUpperCase() === String(code).toUpperCase()) ?? null;
  }

  getImages(code) {
    return this.getConcept(code)?.images ?? [];
  }
}
