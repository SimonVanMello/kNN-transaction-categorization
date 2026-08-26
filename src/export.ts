import * as fs from "node:fs";
import * as actual from "@actual-app/api";
import { config, required } from "./config";
import type { Transaction } from "./types";

const exportTransactions = async () => {
  const serverURL = required("ACTUAL_SERVER_URL");
  const password = required("ACTUAL_PASSWORD");
  const syncId = required("ACTUAL_SYNC_ID");

  await actual.init({ dataDir: config.actual.dataDir, serverURL, password });
  await actual.downloadBudget(syncId, {
    password: config.actual.encryptionPassword || undefined,
  });

  const categories = await actual.getCategories();
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

  const payees = await actual.getPayees();
  const payeeNames = new Map(payees.map((p) => [p.id, p.name]));

  const today = new Date().toISOString().split("T")[0];
  const accounts = await actual.getAccounts();

  const allTransactions = [];
  for (const account of accounts) {
    const transactions = await actual.getTransactions(
      account.id,
      config.actual.startDate,
      today,
    );
    allTransactions.push(...transactions);
  }

  const data: Transaction[] = allTransactions
    .filter((t) => t.category)
    .map((t) => {
      const payee = t.imported_payee ?? payeeNames.get(t.payee ?? "") ?? "";
      const notes = config.actual.includeNotes ? (t.notes ?? "") : "";
      return {
        label: [payee, notes].filter(Boolean).join(" "),
        category: categoryNames.get(t.category ?? "") ?? "unknown",
      };
    })
    .filter((t) => t.label.trim() !== "");

  fs.writeFileSync(config.files.transactions, JSON.stringify(data, null, 2));
  await actual.shutdown();

  console.log(`Exported ${data.length} transactions to ${config.files.transactions}`);
};

exportTransactions().catch((err) => {
  console.error(err);
  process.exit(1);
});
