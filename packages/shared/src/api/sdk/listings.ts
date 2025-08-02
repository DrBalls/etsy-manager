import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import { PaginatedResponse } from '../../types';
import { 
  Listing,
  CreateListingRequest,
  UpdateListingRequest,
  ListingState,
  ListingStateEnum,
  ListingImage,
  ListingVideo,
  ListingTranslation,
  GetListingsByShopRequest,
  UploadListingImageRequest,
  UploadListingVideoRequest,
  UpdateListingImageRequest,
  CreateListingTranslationRequest,
  UpdateListingTranslationRequest
} from '../../types/etsy-types';

/**
 * Listing Management SDK methods
 */
export class ListingsAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get a listing by ID
   * @see https://developers.etsy.com/documentation/reference/#operation/getListing
   */
  async getListing(
    listingId: string | number,
    includes?: string[]
  ): Promise<Listing> {
    const params: any = {};
    if (includes?.length) {
      params.includes = includes.join(',');
    }
    return this.client.get<Listing>(`/v3/application/listings/${listingId}`, params);
  }

  /**
   * Get listings by shop
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingsByShop
   */
  async getListingsByShop(
    shopId: string | number,
    params?: GetListingsByShopRequest
  ): Promise<PaginatedResponse<Listing>> {
    return this.client.getPaginated<Listing>(
      `/v3/application/shops/${shopId}/listings`,
      params
    );
  }

  /**
   * Get all listings for a shop (handles pagination)
   */
  async getAllListingsByShop(
    shopId: string | number,
    filters?: Omit<GetListingsByShopRequest, 'limit' | 'offset'>
  ): Promise<Listing[]> {
    return this.client.getAllPages<Listing>(
      `/v3/application/shops/${shopId}/listings`,
      filters
    );
  }

  /**
   * Get active listings by shop
   */
  async getActiveListingsByShop(
    shopId: string | number,
    params?: Omit<GetListingsByShopRequest, 'state'>
  ): Promise<PaginatedResponse<Listing>> {
    return this.getListingsByShop(shopId, {
      ...params,
      state: ListingStateEnum.ACTIVE,
    });
  }

  /**
   * Get draft listings by shop
   */
  async getDraftListingsByShop(
    shopId: string | number,
    params?: Omit<GetListingsByShopRequest, 'state'>
  ): Promise<PaginatedResponse<Listing>> {
    return this.getListingsByShop(shopId, {
      ...params,
      state: ListingStateEnum.DRAFT,
    });
  }

  /**
   * Create a new listing
   * @see https://developers.etsy.com/documentation/reference/#operation/createDraftListing
   */
  async createListing(
    shopId: string | number,
    data: CreateListingRequest
  ): Promise<Listing> {
    return this.client.post<Listing>(
      `/v3/application/shops/${shopId}/listings`,
      data
    );
  }

  /**
   * Update a listing
   * @see https://developers.etsy.com/documentation/reference/#operation/updateListing
   */
  async updateListing(
    listingId: string | number,
    data: UpdateListingRequest
  ): Promise<Listing> {
    return this.client.patch<Listing>(
      `/v3/application/listings/${listingId}`,
      data
    );
  }

  /**
   * Delete a listing
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteListing
   */
  async deleteListing(listingId: string | number): Promise<void> {
    await this.client.delete(`/v3/application/listings/${listingId}`);
  }

  /**
   * Update listing state (activate, deactivate, etc.)
   */
  async updateListingState(
    listingId: string | number,
    state: ListingState
  ): Promise<Listing> {
    return this.updateListing(listingId, { state });
  }

  /**
   * Activate a listing
   */
  async activateListing(listingId: string | number): Promise<Listing> {
    return this.updateListingState(listingId, ListingStateEnum.ACTIVE);
  }

  /**
   * Deactivate a listing
   */
  async deactivateListing(listingId: string | number): Promise<Listing> {
    return this.updateListingState(listingId, ListingStateEnum.INACTIVE);
  }

  /**
   * Get listing images
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingImages
   */
  async getListingImages(listingId: string | number): Promise<ListingImage[]> {
    const response = await this.client.get<{ results: ListingImage[] }>(
      `/v3/application/listings/${listingId}/images`
    );
    return response.results;
  }

  /**
   * Get a specific listing image
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingImage
   */
  async getListingImage(
    listingId: string | number,
    listingImageId: string | number
  ): Promise<ListingImage> {
    return this.client.get<ListingImage>(
      `/v3/application/listings/${listingId}/images/${listingImageId}`
    );
  }

  /**
   * Upload listing image
   * Note: This requires special handling for multipart/form-data
   * @see https://developers.etsy.com/documentation/reference/#operation/uploadListingImage
   */
  async uploadListingImage(
    shopId: string | number,
    listingId: string | number,
    imageData: UploadListingImageRequest
  ): Promise<ListingImage> {
    // This endpoint requires multipart form data
    // The actual implementation would need to handle file upload
    // For now, we'll use the regular POST with proper content type handling
    return this.client.post<ListingImage>(
      `/v3/application/shops/${shopId}/listings/${listingId}/images`,
      imageData
    );
  }

  /**
   * Update listing image
   * @see https://developers.etsy.com/documentation/reference/#operation/updateListingImage
   */
  async updateListingImage(
    shopId: string | number,
    listingId: string | number,
    listingImageId: string | number,
    data: UpdateListingImageRequest
  ): Promise<ListingImage> {
    return this.client.put<ListingImage>(
      `/v3/application/shops/${shopId}/listings/${listingId}/images/${listingImageId}`,
      data
    );
  }

  /**
   * Delete listing image
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteListingImage
   */
  async deleteListingImage(
    listingId: string | number,
    listingImageId: string | number
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/listings/${listingId}/images/${listingImageId}`
    );
  }

  /**
   * Get listing videos
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingVideos
   */
  async getListingVideos(listingId: string | number): Promise<ListingVideo[]> {
    const response = await this.client.get<{ results: ListingVideo[] }>(
      `/v3/application/listings/${listingId}/videos`
    );
    return response.results;
  }

  /**
   * Get a specific listing video
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingVideo
   */
  async getListingVideo(
    listingId: string | number,
    videoId: string | number
  ): Promise<ListingVideo> {
    return this.client.get<ListingVideo>(
      `/v3/application/listings/${listingId}/videos/${videoId}`
    );
  }

  /**
   * Upload listing video
   * @see https://developers.etsy.com/documentation/reference/#operation/uploadListingVideo
   */
  async uploadListingVideo(
    shopId: string | number,
    listingId: string | number,
    videoData: UploadListingVideoRequest
  ): Promise<ListingVideo> {
    return this.client.post<ListingVideo>(
      `/v3/application/shops/${shopId}/listings/${listingId}/videos`,
      videoData
    );
  }

  /**
   * Delete listing video
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteListingVideo
   */
  async deleteListingVideo(
    listingId: string | number,
    videoId: string | number
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/listings/${listingId}/videos/${videoId}`
    );
  }

  /**
   * Get listing translations
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingTranslations
   */
  async getListingTranslations(
    listingId: string | number
  ): Promise<ListingTranslation[]> {
    const response = await this.client.get<{ results: ListingTranslation[] }>(
      `/v3/application/listings/${listingId}/translations`
    );
    return response.results;
  }

  /**
   * Get listing translation for specific language
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingTranslation
   */
  async getListingTranslation(
    listingId: string | number,
    language: string
  ): Promise<ListingTranslation> {
    return this.client.get<ListingTranslation>(
      `/v3/application/listings/${listingId}/translations/${language}`
    );
  }

  /**
   * Create listing translation
   * @see https://developers.etsy.com/documentation/reference/#operation/createListingTranslation
   */
  async createListingTranslation(
    shopId: string | number,
    listingId: string | number,
    language: string,
    data: CreateListingTranslationRequest
  ): Promise<ListingTranslation> {
    return this.client.post<ListingTranslation>(
      `/v3/application/shops/${shopId}/listings/${listingId}/translations/${language}`,
      data
    );
  }

  /**
   * Update listing translation
   * @see https://developers.etsy.com/documentation/reference/#operation/updateListingTranslation
   */
  async updateListingTranslation(
    shopId: string | number,
    listingId: string | number,
    language: string,
    data: UpdateListingTranslationRequest
  ): Promise<ListingTranslation> {
    return this.client.put<ListingTranslation>(
      `/v3/application/shops/${shopId}/listings/${listingId}/translations/${language}`,
      data
    );
  }

  /**
   * Delete listing translation
   * @see https://developers.etsy.com/documentation/reference/#operation/deleteListingTranslation
   */
  async deleteListingTranslation(
    shopId: string | number,
    listingId: string | number,
    language: string
  ): Promise<void> {
    await this.client.delete(
      `/v3/application/shops/${shopId}/listings/${listingId}/translations/${language}`
    );
  }

  /**
   * Get listings by listing IDs
   * @see https://developers.etsy.com/documentation/reference/#operation/getListingsByListingIds
   */
  async getListingsByIds(
    listingIds: (string | number)[],
    includes?: string[]
  ): Promise<Listing[]> {
    const params: any = {
      listing_ids: listingIds.join(','),
    };
    if (includes?.length) {
      params.includes = includes.join(',');
    }
    const response = await this.client.get<{ results: Listing[] }>(
      '/v3/application/listings/batch',
      params
    );
    return response.results;
  }

  /**
   * Get featured listings
   * @see https://developers.etsy.com/documentation/reference/#operation/findAllFeaturedListings
   */
  async getFeaturedListings(params?: {
    limit?: number;
    offset?: number;
    region?: string;
  }): Promise<PaginatedResponse<Listing>> {
    return this.client.getPaginated<Listing>(
      '/v3/application/listings/featured',
      params
    );
  }

  /**
   * Search listings
   * @see https://developers.etsy.com/documentation/reference/#operation/findAllListingsActive
   */
  async searchListings(params: {
    keywords?: string;
    sort_on?: 'created' | 'price' | 'updated' | 'score';
    sort_order?: 'asc' | 'desc' | 'ascending' | 'descending';
    min_price?: number;
    max_price?: number;
    color?: string;
    color_accuracy?: number;
    tags?: string[];
    materials?: string[];
    shipping_profile_id?: string | number;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Listing>> {
    const queryParams: any = { ...params };
    if (params.tags?.length) {
      queryParams.tags = params.tags.join(',');
    }
    if (params.materials?.length) {
      queryParams.materials = params.materials.join(',');
    }
    return this.client.getPaginated<Listing>(
      '/v3/application/listings/active',
      queryParams
    );
  }
}