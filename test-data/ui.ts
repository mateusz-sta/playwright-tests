import { CalculatedPrices } from '../pages/products/ProductFormPage';

// Values and texts used by the UI tests – change them here, not in the tests.

// Pieces as the app shows them, e.g. 250 → "250 szt.", 2000 → "2 000 szt."
export function pcs(count: number): string {
  return `${count.toLocaleString('pl-PL')} szt.`;
}

// Packages, e.g. 3 → "3 pak."
export function pak(count: number): string {
  return `${count} pak.`;
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

export const MESSAGES = {
  wrongPassword: 'Nieprawidłowe hasło',
  symbolTaken: (symbol: string): string => `Symbol ${symbol} jest już zajęty`,
};

// Products created by UiTestData.product() and by the form tests.
export const PRODUCT = {
  netPrice: 42.5, // zł per 1000 pcs, VAT 23%
  netPricePerUnit: '0.0425', // the same price after switching to "za 1 szt."
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

// Stock movements. Packages from UiTestData have 100 pcs each and weigh 450 g.
export const STOCK = {
  received: 250, // receipt test
  initial: 500, // stock before issue / packing / shipment tests
  packagesIssued: 2,
  unitsPerPackage: 100,
};

// New Amazon package added through the form.
export const AMAZON_PACKAGE = {
  quantity: 50,
  weightG: 250,
  asin: 'B0C7654321',
  fnsku: 'X00PWTEST1',
  ean: '5901234123457',
  // Stock that makes 2 packages of 100 pcs available.
  stockForTwoPackages: 200,
};

// Packing list and shipment.
export const PACKING = {
  packagesToPack: 2,
};

export const SHIPMENT = {
  firstBox: 1, // packages in box 1
  secondBox: 2, // packages in box 2
  summary: 'Pudełka: 2 · pakiety: 3 · ~1,4 kg',
};

// Saved session age that makes the app refresh it on the next user activity.
export const OLD_SESSION_MINUTES = 10;
