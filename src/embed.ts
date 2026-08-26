import * as fs from "node:fs";
import { config } from "./config";
import type { EmbeddedTransaction, Transaction } from "./types";

const embed = async (text: string) => {
  const response = await fetch(`${config.ollama.url}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.ollama.model, prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { embedding?: number[] };

  if (!data.embedding) {
    throw new Error(`No embedding returned for "${text.slice(0, 60)}"`);
  }

  return data.embedding;
};

const embedAll = async () => {
  const transactions: Transaction[] = JSON.parse(
    fs.readFileSync(config.files.transactions, "utf-8"),
  );

  const embedded: EmbeddedTransaction[] = [];

  for (const transaction of transactions) {
    embedded.push({
      ...transaction,
      embedding: await embed(transaction.label),
    });

    if (embedded.length % 100 === 0) {
      console.log(`Embedded ${embedded.length}/${transactions.length}`);
    }
  }

  fs.writeFileSync(config.files.embeddings, JSON.stringify(embedded));
  console.log(
    `Wrote ${embedded.length} embeddings to ${config.files.embeddings}`,
  );
};

embedAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
