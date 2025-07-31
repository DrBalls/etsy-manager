import { EtsyApiClientV2 } from '../etsy-api-client-v2';
import {
  TaxonomyNode,
  TaxonomyNodeProperty,
  PropertyValue,
  SellerTaxonomyNode
} from '../../types/etsy-types';

/**
 * Taxonomy API SDK methods
 */
export class TaxonomyAPI {
  constructor(private client: EtsyApiClientV2) {}

  /**
   * Get seller taxonomy nodes
   * @see https://developers.etsy.com/documentation/reference/#operation/getSellerTaxonomyNodes
   */
  async getSellerTaxonomyNodes(): Promise<SellerTaxonomyNode[]> {
    const response = await this.client.get<{ results: SellerTaxonomyNode[] }>(
      '/v3/application/seller-taxonomy/nodes'
    );
    return response.results;
  }

  /**
   * Get properties for a taxonomy node
   * @see https://developers.etsy.com/documentation/reference/#operation/getPropertiesByTaxonomyId
   */
  async getTaxonomyNodeProperties(
    taxonomyId: string | number
  ): Promise<TaxonomyNodeProperty[]> {
    const response = await this.client.get<{ results: TaxonomyNodeProperty[] }>(
      `/v3/application/seller-taxonomy/nodes/${taxonomyId}/properties`
    );
    return response.results;
  }

  /**
   * Search for taxonomy nodes by keywords
   */
  async searchTaxonomyNodes(
    query: string
  ): Promise<SellerTaxonomyNode[]> {
    const allNodes = await this.getSellerTaxonomyNodes();
    
    const lowerQuery = query.toLowerCase();
    return allNodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery) ||
      node.path.some(p => p.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get taxonomy node by ID
   */
  async getTaxonomyNode(
    taxonomyId: string | number
  ): Promise<SellerTaxonomyNode | undefined> {
    const allNodes = await this.getSellerTaxonomyNodes();
    return allNodes.find(node => node.id === Number(taxonomyId));
  }

  /**
   * Get child nodes of a taxonomy node
   */
  async getChildTaxonomyNodes(
    parentId: string | number
  ): Promise<SellerTaxonomyNode[]> {
    const allNodes = await this.getSellerTaxonomyNodes();
    return allNodes.filter(node => node.parent_id === Number(parentId));
  }

  /**
   * Get root taxonomy nodes (top-level categories)
   */
  async getRootTaxonomyNodes(): Promise<SellerTaxonomyNode[]> {
    const allNodes = await this.getSellerTaxonomyNodes();
    return allNodes.filter(node => !node.parent_id || node.parent_id === null);
  }

  /**
   * Get full path for a taxonomy node
   */
  async getTaxonomyPath(
    taxonomyId: string | number
  ): Promise<SellerTaxonomyNode[]> {
    const allNodes = await this.getSellerTaxonomyNodes();
    const node = allNodes.find(n => n.id === Number(taxonomyId));
    
    if (!node) {
      return [];
    }

    const path: SellerTaxonomyNode[] = [node];
    let currentNode = node;

    while (currentNode.parent_id) {
      const parent = allNodes.find(n => n.id === currentNode.parent_id);
      if (!parent) break;
      path.unshift(parent);
      currentNode = parent;
    }

    return path;
  }

  /**
   * Get all required properties for a taxonomy node
   */
  async getRequiredProperties(
    taxonomyId: string | number
  ): Promise<TaxonomyNodeProperty[]> {
    const properties = await this.getTaxonomyNodeProperties(taxonomyId);
    return properties.filter(prop => prop.required);
  }

  /**
   * Validate listing properties against taxonomy requirements
   */
  async validateListingProperties(
    taxonomyId: string | number,
    properties: Array<{ property_id: number; value_ids: number[] }>
  ): Promise<{
    valid: boolean;
    missing_required: TaxonomyNodeProperty[];
    invalid_properties: Array<{ property_id: number; reason: string }>;
  }> {
    const taxonomyProperties = await this.getTaxonomyNodeProperties(taxonomyId);
    const requiredProperties = taxonomyProperties.filter(p => p.required);
    
    const providedPropertyIds = new Set(properties.map(p => p.property_id));
    const missingRequired = requiredProperties.filter(
      p => !providedPropertyIds.has(p.property_id)
    );

    const invalidProperties: Array<{ property_id: number; reason: string }> = [];

    // Validate each provided property
    for (const prop of properties) {
      const taxonomyProp = taxonomyProperties.find(
        tp => tp.property_id === prop.property_id
      );

      if (!taxonomyProp) {
        invalidProperties.push({
          property_id: prop.property_id,
          reason: 'Property not valid for this taxonomy',
        });
        continue;
      }

      // Validate value count
      if (taxonomyProp.max_values_allowed && prop.value_ids.length > taxonomyProp.max_values_allowed) {
        invalidProperties.push({
          property_id: prop.property_id,
          reason: `Too many values (max: ${taxonomyProp.max_values_allowed})`,
        });
      }

      // Validate value IDs if possible values are defined
      if (taxonomyProp.possible_values && taxonomyProp.possible_values.length > 0) {
        const validValueIds = new Set(
          taxonomyProp.possible_values.map(v => v.value_id)
        );
        
        for (const valueId of prop.value_ids) {
          if (!validValueIds.has(valueId)) {
            invalidProperties.push({
              property_id: prop.property_id,
              reason: `Invalid value ID: ${valueId}`,
            });
            break;
          }
        }
      }
    }

    return {
      valid: missingRequired.length === 0 && invalidProperties.length === 0,
      missing_required: missingRequired,
      invalid_properties: invalidProperties,
    };
  }

  /**
   * Get suggested categories for a product based on title and tags
   */
  async getSuggestedCategories(
    title: string,
    tags?: string[]
  ): Promise<SellerTaxonomyNode[]> {
    const allNodes = await this.getSellerTaxonomyNodes();
    
    // Simple keyword matching - in production, this could use ML
    const keywords = [
      ...title.toLowerCase().split(/\s+/),
      ...(tags || []).map(t => t.toLowerCase()),
    ];

    const scores = new Map<number, number>();

    for (const node of allNodes) {
      let score = 0;
      
      // Check node name
      for (const keyword of keywords) {
        if (node.name.toLowerCase().includes(keyword)) {
          score += 10;
        }
      }

      // Check path
      for (const pathItem of node.path) {
        for (const keyword of keywords) {
          if (pathItem.toLowerCase().includes(keyword)) {
            score += 5;
          }
        }
      }

      if (score > 0) {
        scores.set(node.id, score);
      }
    }

    // Sort by score and return top matches
    const sortedNodes = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId]) => allNodes.find(n => n.id === nodeId)!)
      .filter(Boolean);

    return sortedNodes;
  }
}