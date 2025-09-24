export type SearchParamsPrimitive = string | number | boolean
export type SearchParamsValue = SearchParamsPrimitive | Array<SearchParamsPrimitive>
export type SearchParamsInput = string | URLSearchParams | Record<string, SearchParamsValue>

export interface RetryOptions {
  attempts?: number
  delayMs?: number
  factor?: number
  maxDelayMs?: number | null
  jitterMs?: number
  timeoutMs?: number
  timeout?: number
  idempotent?: boolean
  methods?: Array<string>
}

export interface RequestOptions {
  headers?: HeadersInit | Record<string, string>
  searchParams?: SearchParamsInput
  query?: SearchParamsInput
  json?: unknown
  body?: BodyInit | null
  signal?: AbortSignal | null
  retry?: RetryOptions
}

export interface Logger {
  debug?: (...args: unknown[]) => void
  warn?: (...args: unknown[]) => void
}

export type PaginateStopReason = 'exhausted' | 'max-pages' | 'duplicate-cursor'

export interface PaginatedPageContext<TParams extends Record<string, any> = Record<string, any>> {
  page: number
  cursor: unknown
  params: Readonly<TParams>
}

export interface CollectPaginatedOptions<
  TResult = unknown,
  TParams extends Record<string, any> = Record<string, any>,
> {
  fetchPage: (
    params: Readonly<TParams>,
    context: { page: number; cursor: unknown },
  ) => Promise<TResult> | TResult
  initialParams?: TParams
  cursorParam?: string
  maxPages?: number
  getCursor?: (
    result: TResult,
    context: { page: number; previousCursor: unknown; params: Readonly<TParams> },
  ) => unknown
  hasNext?: (
    result: TResult,
    context: { page: number; cursor: unknown; params: Readonly<TParams> },
  ) => boolean
  extractItems?: (
    result: TResult,
    context: { page: number; cursor: unknown },
  ) => unknown[] | null | undefined
  onPage?: (result: TResult, context: PaginatedPageContext<TParams>) => void | Promise<void>
  accumulateItems?: boolean
  stopOnDuplicateCursor?: boolean
}

export interface CollectPaginatedResult<
  TResult = unknown,
  TParams extends Record<string, any> = Record<string, any>,
> {
  pages: TResult[]
  items?: unknown[]
  cursor: unknown
  nextParams?: TParams
  pageCount: number
  stopReason: PaginateStopReason
  hasMore: boolean
}

export declare function collectPaginatedResults<
  TResult = unknown,
  TParams extends Record<string, any> = Record<string, any>,
>(options: CollectPaginatedOptions<TResult, TParams>): Promise<CollectPaginatedResult<TResult, TParams>>

export interface CreateClientOptions {
  baseUrl: string
  getAccessToken?: () => string | Promise<string>
  fetch?: typeof fetch
  logger?: Logger
  retry?: RetryOptions
  defaultHeaders?: HeadersInit | Record<string, string>
  userAgent?: string
}

export interface HttpResponse<T = unknown> {
  data: T
  response: Response
}

export interface HttpClient {
  request<T = unknown>(
    method: string,
    path: string,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T>
  post<T = unknown>(path: string, options?: RequestOptions): Promise<T>
  put<T = unknown>(path: string, options?: RequestOptions): Promise<T>
  patch<T = unknown>(path: string, options?: RequestOptions): Promise<T>
  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T>
}

export declare class ApiError extends Error {
  status?: number
  statusText?: string
  data?: unknown
  response?: Response
  request?: { method: string; url: string }
  cause?: unknown
}

export declare function createClient(options: CreateClientOptions): HttpClient
export { createClient as default }

export interface NormalizedApiErrorDetail {
  message: string
  code: string | null
  field: string | null
  path: string | null
}

export interface NormalizedApiError {
  message: string
  status?: number
  statusText?: string
  code: string | null
  details: NormalizedApiErrorDetail[]
  fieldErrors: Record<string, string[]>
  hasFieldErrors: boolean
  data?: unknown
  cause?: unknown
  isApiError: boolean
  original: unknown
}

export declare function normalizeApiError(error: unknown): NormalizedApiError

export interface HealthResponse {
  status: string
  service?: string
  region?: string
  version?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface PageInfo {
  total: number
  hasNextPage: boolean
  endCursor?: string | null
}

export interface CatalogFacetBucket {
  value: string
  label?: string
  count: number
}

export interface CatalogFacets {
  productTypes?: CatalogFacetBucket[]
  fulfillment?: CatalogFacetBucket[]
  tags?: CatalogFacetBucket[]
  [key: string]: CatalogFacetBucket[] | undefined
}

export interface CatalogItemPrice {
  amount: number
  currency: string
  interval?: string | null
  trialDays?: number | null
}

export interface CatalogItemAvailability {
  status: string
  stock?: number | null
  releaseDate?: string | null
  fulfillment?: string
  shipsIn?: string | null
}

export interface CatalogItemMedia {
  type: string
  url: string
  preview?: string | null
}

export interface CatalogItem {
  id: string
  sku?: string
  slug?: string
  title: string
  subtitle?: string
  description?: string
  type?: string
  format?: string
  tags: string[]
  badges: string[]
  rating?: number | null
  duration?: number | null
  productUrl?: string | null
  previewUrl?: string | null
  price: CatalogItemPrice
  availability: CatalogItemAvailability
  media: CatalogItemMedia[]
  metadata?: Record<string, unknown>
}

export interface CatalogSearchParams {
  query?: string
  q?: string
  type?: string | string[]
  tags?: string | string[]
  cursor?: string
  limit?: number
  sort?: string
  locale?: string
  tenantId?: string
  tenant?: string
}

export interface CatalogSearchResponse {
  items: CatalogItem[]
  pageInfo: PageInfo
  facets?: CatalogFacets
  query?: {
    q?: string
    type?: string | string[]
    tags?: string[]
    sort?: string
  }
  metadata?: Record<string, unknown>
}

export interface CatalogAutocompleteParams {
  query?: string
  q?: string
  limit?: number
  tenantId?: string
  tenant?: string
  locale?: string
}

export interface CatalogAutocompleteSuggestion {
  id: string
  type: string
  title: string
  subtitle?: string
  imageUrl?: string | null
  description?: string | null
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface CatalogAutocompleteResponse {
  suggestions: CatalogAutocompleteSuggestion[]
  query?: {
    q?: string
  }
  metadata?: Record<string, unknown>
}

export interface CatalogItemRequest {
  tenantId?: string
  tenant?: string
  locale?: string
  includeRecommendations?: boolean
}

export type CatalogItemResponse = CatalogItem & {
  longDescription?: string
  content?: Record<string, unknown>
  related?: CatalogItem[]
}

export interface CatalogArtistRequest {
  tenantId?: string
  tenant?: string
  locale?: string
}

export interface CatalogCollectionRequest {
  tenantId?: string
  tenant?: string
  locale?: string
  includeItems?: boolean
}

export interface CatalogCollectionResponse {
  id: string
  slug?: string
  title: string
  description?: string
  heroImageUrl?: string | null
  items?: CatalogItem[]
  metadata?: Record<string, unknown>
}

export interface ArtistSocialLinks {
  website?: string
  twitter?: string
  instagram?: string
  youtube?: string
  tiktok?: string
  [key: string]: string | undefined
}

export interface ArtistProfile {
  id: string
  slug: string
  name: string
  bio?: string
  avatarUrl?: string | null
  heroImageUrl?: string | null
  social?: ArtistSocialLinks
  featured?: CatalogItem[]
  metadata?: Record<string, unknown>
}

export interface DownloadLinkRequest {
  assetIds: string[]
  tenantId?: string
  format?: string
  includeMetadata?: boolean
  [key: string]: unknown
}

export interface DownloadLinkResponse {
  url: string
  token: string
  expiresAt: string
  contentType?: string
  fileName?: string
  size?: number
  integrity?: string
  [key: string]: unknown
}

export interface DownloadLinkStatusResponse {
  token: string
  status: 'pending' | 'ready' | 'expired' | 'revoked' | string
  url?: string
  expiresAt?: string
  contentType?: string
  fileName?: string
  size?: number
  checksum?: string
  metadata?: Record<string, unknown>
}

export interface EntitlementUsage {
  consumed: number
  limit?: number | null
  period?: string | null
}

export type EntitlementStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REVOKED' | string

export interface Entitlement {
  entitlementId: string
  productId: string
  sku?: string
  title?: string
  type?: string
  status: EntitlementStatus
  acquiredAt: string
  expiresAt?: string | null
  usage?: EntitlementUsage
  metadata?: Record<string, unknown>
}

export interface EntitlementListParams {
  tenantId?: string
  tenant?: string
  status?: EntitlementStatus | EntitlementStatus[]
  cursor?: string
  limit?: number
}

export interface EntitlementsResponse {
  items: Entitlement[]
  cursor?: string | null
  hasNextPage?: boolean
  updatedAt?: string
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | string

export interface Invoice {
  id: string
  number: string
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  currency: string
  issuedAt: string
  dueAt?: string | null
  downloadUrl?: string | null
  pdfUrl?: string | null
  metadata?: Record<string, unknown>
}

export interface InvoiceListParams {
  tenantId?: string
  tenant?: string
  status?: InvoiceStatus | InvoiceStatus[]
  cursor?: string
  limit?: number
}

export interface InvoicesResponse {
  items: Invoice[]
  cursor?: string | null
  hasNextPage?: boolean
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
  locale?: string
  roles?: string[]
  tenantId?: string
  metadata?: Record<string, unknown>
}

export interface CartItemInput {
  sku: string
  quantity?: number
  price?: { amount: number; currency: string }
  metadata?: Record<string, unknown>
}

export interface CartCreateRequest {
  tenantId?: string
  items: CartItemInput[]
  promoCode?: string
  customerId?: string
  currency?: string
  metadata?: Record<string, unknown>
}

export interface CartItem extends CartItemInput {
  id: string
  name?: string
  description?: string
  image?: string | null
}

export interface CartTotals {
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
  currency: string
}

export interface CartResponse {
  id: string
  items: CartItem[]
  totals: CartTotals
  promoCode?: string | null
  updatedAt: string
  metadata?: Record<string, unknown>
}

export type CartRetrieveResponse = CartResponse & {
  status?: string
  createdAt?: string
  expiresAt?: string | null
}

export type CheckoutMode = 'payment' | 'subscription' | string

export interface CheckoutSessionRequest {
  cartId?: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  customerId?: string
  currency?: string
  mode?: CheckoutMode
  allowPromotionCodes?: boolean
  locale?: string
  metadata?: Record<string, unknown>
}

export interface CheckoutSessionResponse {
  sessionId: string
  url?: string
  clientSecret?: string
  expiresAt: string
  publishableKey?: string
  metadata?: Record<string, unknown>
}

export interface CheckoutSessionDetailsResponse extends CheckoutSessionResponse {
  status?: string
  customerEmail?: string
  customerId?: string
  amountTotal?: number
  currency?: string
  paymentStatus?: string
}

export interface CatalogImportRequest {
  source: string
  format?: string
  dryRun?: boolean
  upsert?: boolean
  tenantId?: string
  options?: Record<string, unknown>
}

export interface CatalogImportResponse {
  jobId: string
  status: 'accepted' | 'started' | string
  summary?: {
    created?: number
    updated?: number
    failed?: number
  }
  warnings?: string[]
  metadata?: Record<string, unknown>
}

export interface DomainCreateRequest {
  domain: string
  tenantId: string
  certificateArn?: string
  autoVerify?: boolean
  metadata?: Record<string, unknown>
}

export type DomainStatus = 'pending' | 'provisioning' | 'active' | 'failed' | string

export interface DomainResponse {
  id: string
  domain: string
  status: DomainStatus
  createdAt: string
  updatedAt?: string
  validation?: {
    method: string
    value: string
    status: 'pending' | 'verified' | 'failed' | string
  }
  metadata?: Record<string, unknown>
}

export interface UpdateUserRolesRequest {
  roles: string[]
  tenantId: string
  notifyUser?: boolean
  metadata?: Record<string, unknown>
}

export interface UserRolesResponse {
  userId: string
  roles: string[]
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface StoreCreateRequest {
  name: string
  tenantId: string
  defaultCurrency: string
  slug?: string
  timezone?: string
  metadata?: Record<string, unknown>
}

export type StoreStatus = 'draft' | 'active' | 'inactive' | string

export interface StoreResponse {
  id: string
  slug: string
  name: string
  status: StoreStatus
  defaultCurrency: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface StoreProductPrice {
  amount: number
  currency: string
  interval?: string | null
}

export interface StoreProductCreateRequest {
  title: string
  price: StoreProductPrice
  sku?: string
  description?: string
  inventory?: {
    stock?: number
    allowBackorder?: boolean
  }
  fulfillment?: string
  metadata?: Record<string, unknown>
}

export interface StoreProductResponse {
  id: string
  storeId: string
  status: string
  slug?: string
  title: string
  price: StoreProductPrice
  availability?: CatalogItemAvailability
  metadata?: Record<string, unknown>
}

export interface CreateApiOptions extends Partial<CreateClientOptions> {
  client?: HttpClient
}

export interface HealthApi {
  check(options?: RequestOptions): Promise<HealthResponse>
}

export interface CatalogApi {
  autocomplete(
    params?: CatalogAutocompleteParams,
    options?: RequestOptions,
  ): Promise<CatalogAutocompleteResponse>
  search(params?: CatalogSearchParams, options?: RequestOptions): Promise<CatalogSearchResponse>
  getItem(
    id: string,
    params?: CatalogItemRequest,
    options?: RequestOptions,
  ): Promise<CatalogItemResponse>
  getArtist(
    slug: string,
    params?: CatalogArtistRequest,
    options?: RequestOptions,
  ): Promise<ArtistProfile>
  getCollection(
    id: string,
    params?: CatalogCollectionRequest,
    options?: RequestOptions,
  ): Promise<CatalogCollectionResponse>
}

export interface DownloadsApi {
  createLink(input: DownloadLinkRequest, options?: RequestOptions): Promise<DownloadLinkResponse>
  getLinkStatus(token: string, options?: RequestOptions): Promise<DownloadLinkStatusResponse>
}

export interface AccountApi {
  getProfile(options?: RequestOptions): Promise<UserProfile>
  getEntitlements(
    params?: EntitlementListParams,
    options?: RequestOptions,
  ): Promise<EntitlementsResponse>
  getInvoices(params?: InvoiceListParams, options?: RequestOptions): Promise<InvoicesResponse>
}

export interface CartApi {
  create(input: CartCreateRequest, options?: RequestOptions): Promise<CartResponse>
  retrieve(cartId: string, options?: RequestOptions): Promise<CartRetrieveResponse>
}

export interface CheckoutApi {
  createSession(
    input: CheckoutSessionRequest,
    options?: RequestOptions,
  ): Promise<CheckoutSessionResponse>
  getSession(sessionId: string, options?: RequestOptions): Promise<CheckoutSessionDetailsResponse>
}

export interface AdminCatalogApi {
  import(input: CatalogImportRequest, options?: RequestOptions): Promise<CatalogImportResponse>
}

export interface AdminDomainsApi {
  create(input: DomainCreateRequest, options?: RequestOptions): Promise<DomainResponse>
}

export interface AdminUsersApi {
  updateRoles(
    userId: string,
    input: UpdateUserRolesRequest,
    options?: RequestOptions,
  ): Promise<UserRolesResponse>
}

export interface AdminStoresApi {
  create(input: StoreCreateRequest, options?: RequestOptions): Promise<StoreResponse>
  createProduct(
    storeId: string,
    input: StoreProductCreateRequest,
    options?: RequestOptions,
  ): Promise<StoreProductResponse>
}

export interface AdminApi {
  catalog: AdminCatalogApi
  domains: AdminDomainsApi
  users: AdminUsersApi
  stores: AdminStoresApi
}

export interface ApiClient {
  http: HttpClient
  health: HealthApi
  catalog: CatalogApi
  downloads: DownloadsApi
  me: AccountApi
  cart: CartApi
  checkout: CheckoutApi
  admin: AdminApi
}

export declare function createApi(options: CreateApiOptions): ApiClient
