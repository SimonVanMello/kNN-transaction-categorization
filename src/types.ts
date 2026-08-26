export type Transaction = {
  label: string;
  category: string;
};

export type EmbeddedTransaction = Transaction & {
  embedding: number[];
};
