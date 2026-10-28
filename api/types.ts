// Request and response bodies from the API documentation:
// https://magazyn-test.onrender.com/api/docs (JSON: /api/docs-json)
// Comments name the matching schema from the docs.

// ---------- Common ----------

// Error body returned with 4xx statuses
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
}

export type MovementType = 'IN' | 'OUT';
export type PlatformKind = 'AMAZON' | 'OTHER';
export type PackingItemStatus = 'IN_PROGRESS' | 'DONE';

// ---------- Auth & users ----------

// LoginDto
export interface LoginRequest {
  username: string;
  password: string;
}

// LoginResponseDto
export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  username: string;
}

// CurrentUserDto
export interface CurrentUser {
  id: number;
  username: string;
}

// ChangePasswordDto
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// CreateUserDto
export interface CreateUserRequest {
  username: string;
  password: string;
}

// ---------- Products ----------

// CreateProductDto
export interface CreateProductRequest {
  name: string;
  symbol: string;
  netPricePer1000: number;
  vatRate: number;
}

// UpdateProductDto
export type UpdateProductRequest = Partial<CreateProductRequest>;

// ProductDto
export interface Product {
  id: number;
  name: string;
  symbol: string;
  vatRate: number;
  netPricePer1000: number;
  grossPricePer1000: number;
  netUnitPrice: number;
  grossUnitPrice: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// DeleteProductsDto / DeletePackagesDto
export interface DeleteManyRequest {
  ids: number[];
}

// DeleteProductsResultDto
export interface DeleteProductsResult {
  deleted: number[];
  failed: { id: number; symbol: string; reason: string }[];
}

// StockMovementDto
export interface StockMovement {
  id: number;
  productId: number;
  documentId: number;
  type: MovementType;
  quantity: number;
  packageId?: number;
  packageSku?: string;
  packageCount?: number;
  documentDate: string;
  documentReference?: string;
  counterparty?: string;
  platformName?: string;
  createdAt: string;
}

// ---------- Platforms ----------

// CreatePlatformDto
export interface CreatePlatformRequest {
  name: string;
  kind?: PlatformKind;
}

// UpdatePlatformDto
export type UpdatePlatformRequest = Partial<CreatePlatformRequest>;

// PlatformDto
export interface Platform {
  id: number;
  name: string;
  kind: PlatformKind;
  packageCount: number;
  documentCount: number;
  packingListCount: number;
  createdAt: string;
}

// ---------- Packages ----------

// AmazonDetailsInputDto
export interface AmazonDetailsInput {
  fnsku?: string | null;
  asin?: string | null;
  codeType?: 'EAN' | 'UPC' | null;
  code?: string | null;
}

// CreatePackageDto
export interface CreatePackageRequest {
  platformId: number;
  name: string;
  sku: string;
  productId: number;
  quantity: number;
  weightG?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  amazon?: AmazonDetailsInput | null;
}

// UpdatePackageDto
export type UpdatePackageRequest = Partial<
  Omit<CreatePackageRequest, 'platformId'>
>;

// PackageDto
export interface Package {
  id: number;
  name: string;
  sku: string;
  platformId: number;
  platformName: string;
  productId: number;
  productSymbol: string;
  productName: string;
  quantity: number;
  vatRate: number;
  netPrice: number;
  grossPrice: number;
  weightG?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  available: number;
  createdAt: string;
  updatedAt: string;
}

// DeletePackagesResultDto
export interface DeletePackagesResult {
  deleted: number[];
  failed: { id: number; sku: string; reason: string }[];
}

// ---------- Documents (stock in / out) ----------

// CreateDocumentLineDto
export interface CreateDocumentLine {
  productId?: number;
  packageId?: number;
  quantity: number;
}

// CreateDocumentDto
export interface CreateDocumentRequest {
  type: MovementType;
  platformId?: number;
  date: string;
  reference?: string;
  counterparty?: string;
  note?: string;
  lines: CreateDocumentLine[];
}

// DocumentLineDto
export interface DocumentLine {
  productId: number;
  productSymbol: string;
  productName: string;
  quantity: number;
  packageId?: number;
  packageSku?: string;
  packageName?: string;
  packageCount?: number;
}

// DocumentSummaryDto
export interface DocumentSummary {
  id: number;
  type: MovementType;
  platformId?: number;
  platformName?: string;
  date: string;
  reference?: string;
  counterparty?: string;
  note?: string;
  lineCount: number;
  totalQuantity: number;
  shipmentId?: number;
  createdAt: string;
}

// DocumentDto
export interface Document extends DocumentSummary {
  lines: DocumentLine[];
}

// ---------- Orders ----------

// OrderItemInputDto
export interface OrderItemInput {
  packageId?: number;
  productId?: number;
  quantity: number;
}

// CreateOrderDto
export interface CreateOrderRequest {
  name: string;
  date: string;
  note?: string;
  items: OrderItemInput[];
}

// UpdateOrderDto
export type UpdateOrderRequest = Partial<CreateOrderRequest>;

// OrderItemDto
export interface OrderItem {
  id: number;
  position: number;
  productId: number;
  productSymbol: string;
  productName: string;
  packageId?: number;
  sku?: string;
  packageName?: string;
  platformId?: number;
  unitsPerItem: number;
  quantity: number;
  units: number;
}

// OrderSummaryDto
export interface OrderSummary {
  id: number;
  name: string;
  date: string;
  note?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// OrderDto
export interface Order extends OrderSummary {
  items: OrderItem[];
}

// ---------- Packing lists ----------

// PackingListItemInputDto
export interface PackingListItemInput {
  packageId: number;
  packageCount: number;
  status?: PackingItemStatus;
}

// CreatePackingListDto
export interface CreatePackingListRequest {
  platformId: number;
  name: string;
  date: string;
  note?: string;
  items: PackingListItemInput[];
}

// UpdatePackingListDto
export type UpdatePackingListRequest = Partial<
  Omit<CreatePackingListRequest, 'platformId'>
>;

// UpdatePackingItemsDto
export interface UpdatePackingItemsRequest {
  itemIds: number[];
  status: PackingItemStatus;
}

// UpdatePackingItemDto
export interface UpdatePackingItemRequest {
  status: PackingItemStatus;
}

// PackingListItemDto
export interface PackingListItem {
  id: number;
  position: number;
  packageId: number;
  sku: string;
  packageName: string;
  productId: number;
  productSymbol: string;
  productName: string;
  unitsPerPackage: number;
  packageCount: number;
  units: number;
  productStock: number;
  status: PackingItemStatus;
}

// PackingListSummaryDto
export interface PackingListSummary {
  id: number;
  platformId: number;
  name: string;
  date: string;
  note?: string;
  itemCount: number;
  doneCount: number;
  totalPackages: number;
  createdAt: string;
  updatedAt: string;
}

// PackingListDto
export interface PackingList extends PackingListSummary {
  items: PackingListItem[];
}

// ProductReservationDto
export interface ProductReservation {
  productId: number;
  units: number;
}

// ---------- Shipments ----------

// ShipmentBoxInputDto
export interface ShipmentBoxInput {
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  items: { packageId: number; packageCount: number }[];
}

// CreateShipmentDto
export interface CreateShipmentRequest {
  platformId: number;
  name: string;
  date: string;
  note?: string;
  boxes: ShipmentBoxInput[];
}

// UpdateShipmentDto
export type UpdateShipmentRequest = Partial<
  Omit<CreateShipmentRequest, 'platformId'>
>;

// ShipmentBoxItemDto
export interface ShipmentBoxItem {
  id: number;
  position: number;
  packageId: number;
  sku: string;
  packageName: string;
  productId: number;
  productSymbol: string;
  unitsPerPackage: number;
  packageCount: number;
  units: number;
  weightG?: number;
}

// ShipmentBoxDto
export interface ShipmentBox {
  id: number;
  position: number;
  label: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  contentWeightG: number;
  itemsWithoutWeight: number;
  totalPackages: number;
  items: ShipmentBoxItem[];
}

// ShipmentSummaryDto
export interface ShipmentSummary {
  id: number;
  platformId: number;
  name: string;
  date: string;
  note?: string;
  documentId?: number;
  boxCount: number;
  totalPackages: number;
  createdAt: string;
  updatedAt: string;
}

// ShipmentDto
export interface Shipment extends ShipmentSummary {
  boxes: ShipmentBox[];
}

// ---------- User settings ----------

// SaveSettingDto
export interface SaveSettingRequest {
  value: Record<string, unknown>;
}

export type UserSettings = Record<string, unknown>;
