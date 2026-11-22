import { PackingListDetailsPage } from '../pages/packing/PackingListDetailsPage';
import { PackingListFormPage } from '../pages/packing/PackingListFormPage';
import { ShipmentDetailsPage } from '../pages/shipments/ShipmentDetailsPage';
import { ShipmentFormPage } from '../pages/shipments/ShipmentFormPage';

export interface PackageCount {
  sku: string;
  count: number;
}

// Packing lists and shipments of an Amazon platform.
export class ShippingSteps {
  constructor(
    private readonly listForm: PackingListFormPage,
    private readonly listDetails: PackingListDetailsPage,
    private readonly shipmentForm: ShipmentFormPage,
    private readonly shipmentDetails: ShipmentDetailsPage,
  ) {}

  // Opens "Nowa lista pakowania", sets the name and adds the packages (not saved yet).
  async fillPackingList(
    platformId: number,
    name: string,
    items: PackageCount[],
  ): Promise<void> {
    await this.listForm.forPlatform(platformId).open();
    await this.listForm.setName(name);
    for (const item of items) {
      await this.listForm.addPackage(item.sku, item.count);
    }
  }

  // Saves the filled packing list; the app shows the saved list.
  async savePackingList(): Promise<void> {
    await this.listForm.save();
    await this.listDetails.rememberIdFromUrl();
  }

  // Opens "Nowa wysyłka", sets the name and fills the boxes – each inner array
  // is one box ("+ Pudełko" between them). Not saved yet.
  async fillShipment(
    platformId: number,
    name: string,
    boxes: PackageCount[][],
  ): Promise<void> {
    await this.shipmentForm.forPlatform(platformId).open();
    await this.shipmentForm.setName(name);
    for (const [index, box] of boxes.entries()) {
      if (index > 0) await this.shipmentForm.addBox();
      for (const item of box) {
        await this.shipmentForm.addPackage(item.sku, item.count);
      }
    }
  }

  // Saves the filled shipment; the app shows the saved shipment.
  async saveShipment(): Promise<void> {
    await this.shipmentForm.save();
    await this.shipmentDetails.rememberIdFromUrl();
  }
}
