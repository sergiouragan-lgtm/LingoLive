import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export enum SearchIndexType {
  EBOOKS = 'ebooks',
  COURSES = 'courses',
  USERS = 'users',
  VOCABULARY = 'vocabulary',
  LESSONS = 'lessons',
  EXERCISES = 'exercises',
}

export interface SearchFilter {
  field: string;
  operator: 'eq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains';
  value: any;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: SearchFilter[];
  userId?: string;
}

export interface SearchResult {
  id: string;
  type: SearchIndexType;
  title: string;
  description?: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchSuggestion {
  text: string;
  type: SearchIndexType;
  frequency: number;
  lastSearched: string;
}

class SearchService {
  private db: FirebaseFirestore.Firestore;
  private searchCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Full-text search across all indexes
   */
  public async search(
    query: string,
    indexTypes: SearchIndexType[] = Object.values(SearchIndexType),
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const cacheKey = this.getCacheKey(query, indexTypes, options);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const results: SearchResult[] = [];

      for (const indexType of indexTypes) {
        const indexResults = await this.searchIndex(query, indexType, options);
        results.push(...indexResults);
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      // Apply offset and limit
      const offset = options.offset || 0;
      const limit = options.limit || 20;
      const paginatedResults = results.slice(offset, offset + limit);

      // Cache results
      this.saveToCache(cacheKey, paginatedResults);

      // Log search event
      logSecurityEvent(
        'SEARCH_PERFORMED' as any,
        'info' as any,
        `Search performed: "${query}" in ${indexTypes.join(', ')}`,
        { userId: options.userId, query },
        { resultCount: paginatedResults.length, indexTypes }
      );

      return paginatedResults;
    } catch (error: any) {
      logSecurityEvent(
        'SEARCH_FAILED' as any,
        'warning' as any,
        `Search failed: ${error.message}`,
        { userId: options.userId, query },
        { error: error.message }
      );

      throw error;
    }
  }

  /**
   * Search specific index type
   */
  private async searchIndex(
    query: string,
    indexType: SearchIndexType,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const searchTerms = this.tokenizeQuery(query);
    const results: SearchResult[] = [];

    try {
      const collection = this.db.collection(indexType);
      const snapshot = await collection.get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const score = this.calculateRelevanceScore(data, searchTerms, indexType);

        if (score > 0) {
          // Apply filters if provided
          if (options.filters && !this.applyFilters(data, options.filters)) {
            return;
          }

          results.push({
            id: doc.id,
            type: indexType,
            title: this.extractTitle(data, indexType),
            description: this.extractDescription(data, indexType),
            score,
            metadata: this.extractMetadata(data, indexType),
          });
        }
      });

      return results;
    } catch (error) {
      console.error(`Error searching ${indexType} index:`, error);
      return [];
    }
  }

  /**
   * Get search suggestions/autocomplete
   */
  public async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      const searchTerms = this.tokenizeQuery(query);
      const suggestions: SearchSuggestion[] = [];

      // Fetch recent searches
      const recentSearches = await this.db
        .collection('search_history')
        .where('query', '>=', query)
        .where('query', '<=', query + '')
        .orderBy('query')
        .orderBy('timestamp', 'desc')
        .limit(limit * 2)
        .get();

      const suggestionMap = new Map<string, SearchSuggestion>();

      recentSearches.forEach((doc) => {
        const data = doc.data();
        const key = data.query;

        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            text: data.query,
            type: data.type,
            frequency: 1,
            lastSearched: data.timestamp.toDate().toISOString(),
          });
        } else {
          const existing = suggestionMap.get(key)!;
          existing.frequency += 1;
          existing.lastSearched = data.timestamp.toDate().toISOString();
        }
      });

      // Convert to array and sort by frequency
      Array.from(suggestionMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, limit)
        .forEach((s) => suggestions.push(s));

      return suggestions;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Record search for analytics and suggestions
   */
  public async recordSearch(
    userId: string,
    query: string,
    indexType: SearchIndexType,
    resultCount: number
  ): Promise<void> {
    try {
      await this.db.collection('search_history').add({
        userId,
        query,
        type: indexType,
        resultCount,
        timestamp: new Date(),
      });

      // Update search analytics
      await this.updateSearchAnalytics(query, resultCount);
    } catch (error) {
      console.error('Error recording search:', error);
    }
  }

  /**
   * Update search analytics
   */
  private async updateSearchAnalytics(query: string, resultCount: number): Promise<void> {
    try {
      const analyticsRef = this.db.collection('search_analytics').doc(query);
      const doc = await analyticsRef.get();

      if (doc.exists) {
        await analyticsRef.update({
          searchCount: (doc.data()?.searchCount || 0) + 1,
          lastSearched: new Date(),
          averageResults: (doc.data()?.averageResults * (doc.data()?.searchCount || 0) + resultCount) / ((doc.data()?.searchCount || 0) + 1),
        });
      } else {
        await analyticsRef.set({
          query,
          searchCount: 1,
          lastSearched: new Date(),
          averageResults: resultCount,
          trendingScore: 1,
        });
      }
    } catch (error) {
      console.error('Error updating search analytics:', error);
    }
  }

  /**
   * Get trending searches
   */
  public async getTrendingSearches(limit: number = 10): Promise<string[]> {
    try {
      const snapshot = await this.db
        .collection('search_analytics')
        .orderBy('trendingScore', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => doc.data().query);
    } catch (error) {
      console.error('Error fetching trending searches:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score based on query match
   */
  private calculateRelevanceScore(
    document: Record<string, any>,
    searchTerms: string[],
    indexType: SearchIndexType
  ): number {
    let score = 0;

    const searchableFields = this.getSearchableFields(indexType);
    const documentText = searchableFields
      .map((field) => this.getNestedProperty(document, field))
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    searchTerms.forEach((term) => {
      // Exact phrase match: high score
      if (documentText.includes(term)) {
        score += 10;
      }

      // Word boundary match: medium score
      if (new RegExp(`\\b${term}`, 'i').test(documentText)) {
        score += 5;
      }

      // Partial match: low score
      if (documentText.includes(term.substring(0, Math.max(1, term.length - 1)))) {
        score += 1;
      }
    });

    // Boost score for verified/popular items
    if (document.verified) score += 3;
    if (document.rating && document.rating >= 4) score += 2;
    if (document.downloads && document.downloads > 100) score += 1;

    return score;
  }

  /**
   * Get searchable fields for index type
   */
  private getSearchableFields(indexType: SearchIndexType): string[] {
    const fieldMap: Record<SearchIndexType, string[]> = {
      [SearchIndexType.EBOOKS]: ['title', 'description', 'author', 'tags'],
      [SearchIndexType.COURSES]: ['title', 'description', 'instructor', 'category'],
      [SearchIndexType.USERS]: ['displayName', 'bio', 'expertise'],
      [SearchIndexType.VOCABULARY]: ['word', 'definition', 'examples'],
      [SearchIndexType.LESSONS]: ['title', 'content', 'objectives'],
      [SearchIndexType.EXERCISES]: ['title', 'description', 'content'],
    };

    return fieldMap[indexType] || [];
  }

  /**
   * Extract title from document
   */
  private extractTitle(document: Record<string, any>, indexType: SearchIndexType): string {
    switch (indexType) {
      case SearchIndexType.USERS:
        return document.displayName || document.email;
      case SearchIndexType.VOCABULARY:
        return document.word;
      default:
        return document.title || document.name || '';
    }
  }

  /**
   * Extract description from document
   */
  private extractDescription(
    document: Record<string, any>,
    indexType: SearchIndexType
  ): string | undefined {
    switch (indexType) {
      case SearchIndexType.VOCABULARY:
        return document.definition;
      case SearchIndexType.USERS:
        return document.bio;
      default:
        return document.description;
    }
  }

  /**
   * Extract metadata from document
   */
  private extractMetadata(
    document: Record<string, any>,
    indexType: SearchIndexType
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      type: indexType,
    };

    if (document.rating) metadata.rating = document.rating;
    if (document.downloads) metadata.downloads = document.downloads;
    if (document.author) metadata.author = document.author;
    if (document.category) metadata.category = document.category;
    if (document.language) metadata.language = document.language;
    if (document.level) metadata.level = document.level;

    return metadata;
  }

  /**
   * Apply filters to document
   */
  private applyFilters(document: Record<string, any>, filters: SearchFilter[]): boolean {
    return filters.every((filter) => {
      const value = this.getNestedProperty(document, filter.field);

      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'lt':
          return value < filter.value;
        case 'lte':
          return value <= filter.value;
        case 'gt':
          return value > filter.value;
        case 'gte':
          return value >= filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'contains':
          return (
            typeof value === 'string' &&
            value.toLowerCase().includes(String(filter.value).toLowerCase())
          );
        default:
          return true;
      }
    });
  }

  /**
   * Tokenize search query
   */
  private tokenizeQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 2);
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Cache management
   */
  private getCacheKey(query: string, types: SearchIndexType[], options: SearchOptions): string {
    return `${query}:${types.join(',')}:${options.offset || 0}:${options.limit || 20}`;
  }

  private getFromCache(key: string): SearchResult[] | null {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.results;
    }
    this.searchCache.delete(key);
    return null;
  }

  private saveToCache(key: string, results: SearchResult[]): void {
    this.searchCache.set(key, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get search statistics
   */
  public async getSearchStatistics(): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    averageResultsPerSearch: number;
    topSearches: Array<{ query: string; count: number }>;
  }> {
    try {
      const snapshot = await this.db.collection('search_analytics').get();

      const topSearches = snapshot.docs
        .map((doc) => ({
          query: doc.data().query,
          count: doc.data().searchCount,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const totalSearches = snapshot.docs.reduce((sum, doc) => sum + doc.data().searchCount, 0);
      const averageResultsPerSearch =
        snapshot.docs.reduce((sum, doc) => sum + doc.data().averageResults, 0) /
        Math.max(1, snapshot.size);

      return {
        totalSearches,
        uniqueQueries: snapshot.size,
        averageResultsPerSearch,
        topSearches,
      };
    } catch (error) {
      console.error('Error fetching search statistics:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResultsPerSearch: 0,
        topSearches: [],
      };
    }
  }
}

export const searchService = new SearchService();
