const str = (name: string, fallback: string) => {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
};

const num = (name: string, fallback: number) => {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be a number, got "${raw}"`);
  }

  return parsed;
};

const bool = (name: string, fallback: boolean) => {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  return raw.toLowerCase() === "true";
};

export const required = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in.`,
    );
  }

  return value;
};

export const config = {
  actual: {
    dataDir: str("ACTUAL_DATA_DIR", "./actual-data"),
    startDate: str("ACTUAL_START_DATE", "2000-01-01"),
    encryptionPassword: str("ACTUAL_ENCRYPTION_PASSWORD", ""),
    includeNotes: bool("INCLUDE_NOTES", true),
  },
  ollama: {
    url: str("OLLAMA_URL", "http://localhost:11434").replace(/\/$/, ""),
    model: str("EMBEDDING_MODEL", "nomic-embed-text"),
  },
  knn: {
    k: num("KNN_K", 5),
    trainRatio: num("TRAIN_RATIO", 0.8),
    seed: num("RANDOM_SEED", 42),
  },
  files: {
    transactions: str("TRANSACTIONS_FILE", "./transactions.json"),
    embeddings: str("EMBEDDINGS_FILE", "./embeddings.json"),
  },
};
