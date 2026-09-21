import { getFirestore } from 'firebase-admin/firestore';
export interface Version { versionId: string; service: string; version: string; releaseDate: Date; }
class VersioningService { private db = getFirestore();
  async createVersion(service: string, version: string): Promise<Version> {
    const id = `ver_${Date.now()}`;
    const v: Version = { versionId: id, service, version, releaseDate: new Date() };
    await this.db.collection('versions').doc(id).set(v);
    return v;
  }
}
export const versioningService = new VersioningService();
