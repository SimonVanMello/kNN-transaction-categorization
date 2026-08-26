# kNN Transaction Categorization

A proof of concept: can a simple vector similarity search predict the categoryof a bank transaction, based only on the transactions you already categorized?

Most transactions repeat. The same supermarket, the same subscription, the samerent every month. So instead of asking an LLM to classify each new one,
embed the labels, find the nearest neighbours among the ones already filed, and let them vote.

This repo is just the experiment: export, embed, measure the accuracy. It isnot a production classifier.

## How it works

1. `export` pulls your already categorized transactions into a flat `[{ label, category }]` list
2. `embed` runs each label through a local embedding model (`nomic-embed-text` on Ollama, so nothing leaves the machine)
3. `evaluate` splits train/test, finds the k nearest neighbours by cosine similarity for each test transaction, and votes on the category

## Requirements

- Node.js 20.6+
- [Ollama](https://ollama.com/download) running locally:
  ```bash
  ollama pull nomic-embed-text
  ```
- Transactions you already categorized. The included exporter reads
  [Actual Budget](https://actualbudget.org), but any source works (see below).

## Setup

```bash
npm install
cp .env.example .env
```

Everything is configured through env vars. Only the Actual Budget credentials are mandatory, and only for the export step.

| Variable                     | Default                  | Purpose                                    |
| ---------------------------- | ------------------------ | ------------------------------------------ |
| `ACTUAL_SERVER_URL`          | /                        | Actual sync server URL                     |
| `ACTUAL_PASSWORD`            | /                        | Actual server password                     |
| `ACTUAL_SYNC_ID`             | /                        | Sync ID of the budget to download          |
| `ACTUAL_ENCRYPTION_PASSWORD` | empty                    | Only if the budget is end-to-end encrypted |
| `ACTUAL_DATA_DIR`            | `./actual-data`          | Local cache of the downloaded budget       |
| `ACTUAL_START_DATE`          | `2000-01-01`             | Earliest transaction to export             |
| `INCLUDE_NOTES`              | `false`                  | Append notes to the embedded text          |
| `OLLAMA_URL`                 | `http://localhost:11434` | Ollama endpoint                            |
| `EMBEDDING_MODEL`            | `nomic-embed-text`       | Embedding model                            |
| `KNN_K`                      | `5`                      | Neighbours in the vote                     |
| `TRAIN_RATIO`                | `0.8`                    | Share of the data used for training        |
| `RANDOM_SEED`                | `42`                     | Seed for the split                         |
| `TRANSACTIONS_FILE`          | `./transactions.json`    | Export output, embed input                 |
| `EMBEDDINGS_FILE`            | `./embeddings.json`      | Embed output, evaluate input               |

## Usage

```bash
npm run export     # -> transactions.json
npm run embed      # -> embeddings.json
npm run evaluate   # prints the accuracy
```

## Using another source

Only `src/export.ts` knows about Actual Budget. Everything downstream reads a plain JSON array:

```json
[
  { "label": "CARD PAYMENT SUPERMARKET CENTRAL", "category": "Groceries" },
  {
    "label": "DIRECT DEBIT STREAMING VIDEO MONTHLY",
    "category": "Subscriptions"
  }
]
```

Write your own exporter, point `TRANSACTIONS_FILE` at the result, and run `npm run embed`.
