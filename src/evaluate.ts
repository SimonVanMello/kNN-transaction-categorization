import * as fs from "node:fs";
import { config } from "./config";
import type { EmbeddedTransaction } from "./types";

const cosineSimilarity = (a: number[], b: number[]) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const predictCategory = (
  target: number[],
  trainSet: EmbeddedTransaction[],
  k: number,
) => {
  const neighbours = trainSet
    .map((t) => ({
      category: t.category,
      similarity: cosineSimilarity(target, t.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);

  const votes = new Map<string, number>();

  for (const n of neighbours) {
    votes.set(n.category, (votes.get(n.category) ?? 0) + n.similarity);
  }

  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

const seededRandom = (seed: number) => {
  let state = seed % 2147483647 || 1;

  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
};

const shuffle = (transactions: EmbeddedTransaction[], random: () => number) => {
  const result = [...transactions];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const evaluate = () => {
  const all: EmbeddedTransaction[] = JSON.parse(
    fs.readFileSync(config.files.embeddings, "utf-8"),
  );

  const shuffled = shuffle(all, seededRandom(config.knn.seed));
  const splitIndex = Math.floor(shuffled.length * config.knn.trainRatio);
  const trainSet = shuffled.slice(0, splitIndex);
  const testSet = shuffled.slice(splitIndex);

  if (trainSet.length === 0 || testSet.length === 0) {
    throw new Error(`Not enough data to split: ${all.length} transactions`);
  }

  let correct = 0;
  for (const t of testSet) {
    if (predictCategory(t.embedding, trainSet, config.knn.k) === t.category) {
      correct++;
    }
  }

  const accuracy = (correct / testSet.length) * 100;
  console.log(
    `Train: ${trainSet.length}  Test: ${testSet.length}  k=${config.knn.k}`,
  );
  console.log(
    `Accuracy: ${accuracy.toFixed(1)}% (${correct}/${testSet.length})`,
  );
};

evaluate();
