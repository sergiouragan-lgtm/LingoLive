import { Firestore, collection, query, where, getDocs } from "firebase/firestore";
import { BrandConfig } from "../../domain/branding/BrandConfig";

/**
 * Repository for managing brand configurations.
 */
export class BrandRepository {
  private readonly collectionName = "tenant_brand_configs";
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Fetches the brand configuration for a given domain within a specific tenant.
   * @param tenantId - The ID of the tenant.
   * @param domain - The domain to search for.
   * @returns A promise resolving to the BrandConfig or null if not found.
   */
  async getConfigByDomain(tenantId: string, domain: string): Promise<BrandConfig | null> {
    const q = query(
      collection(this.db, this.collectionName),
      where("tenantId", "==", tenantId),
      where("domain", "==", domain)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as BrandConfig;
    }
    return null;
  }
}
