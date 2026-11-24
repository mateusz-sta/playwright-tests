import { CalculatedPrices } from '../pages/products/ProductPage';
import { DOCUMENT_TYPE, PRICE_UNIT } from '../utils/appTexts';
import { DEFAULT_PACKAGE } from './defaults';

// Values and texts used by the UI tests – change them here, not in the tests.

// Pieces as the app shows them, e.g. 250 → "250 szt.", 2000 → "2 000 szt."
export function pcs(count: number): string {
  return `${count.toLocaleString('pl-PL')} szt.`;
}

// Packages, e.g. 3 → "3 pak."
export function pak(count: number): string {
  return `${count} pak.`;
}

// Grams, e.g. 250 → "250 g"
export function grams(weightG: number): string {
  return `${weightG} g`;
}

// Name and SKU suggested by the package form: "Screw – 50 szt." / "KN1-50"
export function suggestedPackageName(product: string, count: number): string {
  return `${product} – ${pcs(count)}`;
}

export function suggestedSku(symbol: string, count: number): string {
  return `${symbol}-${count}`;
}

// Boxes of a shipment: "R158-1", "R158-2"…
export function boxLabel(shipment: string, box: number): string {
  return `${shipment}-${box}`;
}

// Product history entry: "Przyjęcie +250 szt."
export function receiptHistoryEntry(units: number): string {
  return `${DOCUMENT_TYPE.receipt} +${pcs(units)}`;
}

// Shipment form summary: "Pudełka: 2 · pakiety: 3 · ~1,4 kg"
export function shipmentSummary(
  boxes: number,
  packages: number,
  weightG: number,
): string {
  const kg = (weightG / 1000).toLocaleString('pl-PL', {
    maximumFractionDigits: 1,
  });
  return `Pudełka: ${boxes} · pakiety: ${packages} · ~${kg} kg`;
}

// Issue line: "2 pak. = 200 szt."
export function issuedPackages(packages: number, units: number): string {
  return `${pak(packages)} = ${pcs(units)}`;
}

// Receipt form summary: "Razem: 1 poz. · 250 szt."
export function receiptSummary(lines: number, units: number): string {
  return `Razem: ${lines} poz. · ${pcs(units)}`;
}

// Packing list form summary: "Pozycje: 1 · paczki: 2 · sztuki produktów: 200"
export function packingSummary(
  lines: number,
  packages: number,
  units: number,
): string {
  return `Pozycje: ${lines} · paczki: ${packages} · sztuki produktów: ${units}`;
}

// Packing list total: "2 paczek · 200 szt. produktów"
export function packingTotal(packages: number, units: number): string {
  return `${packages} paczek · ${pcs(units)} produktów`;
}

export const APP_TITLE = /Magazyn/;

export const WRONG_PASSWORD = 'wrong-password';

export const MESSAGES = {
  wrongPassword: 'Nieprawidłowe hasło',
  symbolTaken: (symbol: string): string => `Symbol ${symbol} jest już zajęty`,
};

// Product entered in the form.
export const PRODUCT = {
  netPrice: 42.5, // zł per 1000 pcs, VAT 23%
  // The same price after switching the unit
  otherPriceUnit: PRICE_UNIT.perPiece,
  netPricePerUnit: '0.0425',
  prices: {
    per1000Net: '42,50 zł',
    per1000Gross: '52,28 zł',
    unitNet: '0,0425 zł',
    unitGross: '0,05228 zł',
  } satisfies CalculatedPrices,
};

// Price change in the edit form.
export const PRODUCT_UPDATE = {
  netPrice: 20,
  vatRate: '5%' as const,
  prices: {
    per1000Net: '20,00 zł',
    per1000Gross: '21,00 zł',
    unitNet: '0,02 zł',
    unitGross: '0,021 zł',
  } satisfies CalculatedPrices,
};

// Stock movements.
export const STOCK = {
  received: 250, // receipt test
  initial: 5 * DEFAULT_PACKAGE.quantity, // before issue / packing / shipment tests
  packagesIssued: 2,
  unitsPerPackage: DEFAULT_PACKAGE.quantity,
};

// New Amazon package added through the form.
export const AMAZON_PACKAGE = {
  quantity: 50,
  weightG: 250,
  asin: 'B0C7654321',
  fnsku: 'X00PWTEST1',
  codeType: 'EAN' as const,
  code: '5901234123457',
};

// Package that cannot be deleted, because its stock makes 2 packages available.
export const AVAILABLE_PACKAGES = {
  count: 2,
  stock: 2 * DEFAULT_PACKAGE.quantity,
};

// Packing list and shipment.
export const PACKING = {
  packagesToPack: 2,
};

export const SHIPMENT = {
  firstBox: 1, // packages in box 1
  secondBox: 2, // packages in box 2
  boxes: 2,
  packageWeightG: DEFAULT_PACKAGE.weightG,
};

// Saved session age that makes the app refresh it on the next user activity.
export const OLD_SESSION_MINUTES = 10;
