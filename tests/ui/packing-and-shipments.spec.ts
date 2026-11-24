import { expect, test } from '../../fixtures/fixtures';
import {
  PACKING,
  SHIPMENT,
  STOCK,
  boxLabel,
  packingSummary,
  packingTotal,
  pcs,
  shipmentSummary,
} from '../../test-data/ui';
import { ITEM_STATUS } from '../../utils/appTexts';

test.describe('Packing lists and shipments', () => {
  test('user plans a packing list and marks the item as done', async ({
    shippingSteps,
    packingListFormPage,
    packingListDetailsPage,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: STOCK.initial,
    });
    const name = testData.name('packing list');
    const units = PACKING.packagesToPack * STOCK.unitsPerPackage;

    await shippingSteps.fillPackingList(platform.id, name, [
      { sku: pkg.sku, count: PACKING.packagesToPack },
    ]);
    await packingListFormPage.expectLine(
      pkg.sku,
      pcs(units),
      pcs(STOCK.initial),
    );
    await packingListFormPage.expectSummary(
      packingSummary(1, PACKING.packagesToPack, units),
    );
    await shippingSteps.savePackingList();

    await packingListDetailsPage.expectName(name);
    await packingListDetailsPage.expectTotal(
      packingTotal(PACKING.packagesToPack, units),
    );
    await packingListDetailsPage.expectProgress(0, 1);
    await packingListDetailsPage.expectItemStatus(pkg.sku, ITEM_STATUS.open);

    await packingListDetailsPage.toggleItem(pkg.sku);

    await packingListDetailsPage.expectItemStatus(pkg.sku, ITEM_STATUS.done);
    await packingListDetailsPage.expectListDone();
    // A packing list never changes stock.
    expect(await testData.stockOf(product)).toBe(STOCK.initial);
  });

  test('user ships packages in two boxes; deleting the shipment returns the stock', async ({
    shippingSteps,
    shipmentFormPage,
    shipmentDetailsPage,
    testData,
  }) => {
    const { platform, product, pkg } = await testData.catalog({
      kind: 'AMAZON',
      stock: STOCK.initial,
    });
    const name = testData.shipmentName();
    const packages = SHIPMENT.firstBox + SHIPMENT.secondBox;
    const units = packages * STOCK.unitsPerPackage;

    await shippingSteps.fillShipment(platform.id, name, [
      [{ sku: pkg.sku, count: SHIPMENT.firstBox }],
      [{ sku: pkg.sku, count: SHIPMENT.secondBox }],
    ]);
    await shipmentFormPage.expectInBox(
      boxLabel(name, 1),
      pkg.sku,
      SHIPMENT.firstBox,
    );
    await shipmentFormPage.expectInBox(
      boxLabel(name, 2),
      pkg.sku,
      SHIPMENT.secondBox,
    );
    await shipmentFormPage.expectSummary(
      shipmentSummary(
        SHIPMENT.boxes,
        packages,
        packages * SHIPMENT.packageWeightG,
      ),
    );
    await shippingSteps.saveShipment();

    await shipmentDetailsPage.expectShipment(name, {
      boxes: SHIPMENT.boxes,
      packages,
      units: pcs(units),
    });
    expect(await testData.stockOf(product)).toBe(STOCK.initial - units);

    await shipmentDetailsPage.delete();

    await expect.poll(() => testData.stockOf(product)).toBe(STOCK.initial);
  });
});
