// Texts shown by the app that both page objects and tests need.
// Texts used only by tests are in test-data/ui.ts.

export const DOCUMENT_TYPE = {
  receipt: 'Przyjęcie',
  issue: 'Wydanie',
} as const;

export const ITEM_STATUS = {
  open: 'W trakcie',
  done: 'Gotowe',
} as const;

export const PRICE_UNIT = {
  perThousand: 'za 1000 szt.',
  perPiece: 'za 1 szt.',
} as const;

// Union of the values of one of the objects above, e.g. 'W trakcie' | 'Gotowe'.
export type TextOf<T> = T[keyof T];
