import { DialectRepository, CountryRepository, CourseRepository, AvatarRepository } from '../firestore/repositories';

export class Seeder {
  private dialectRepo: DialectRepository;
  private countryRepo: CountryRepository;
  private courseRepo: CourseRepository;
  private avatarRepo: AvatarRepository;

  constructor() {
    this.dialectRepo = new DialectRepository();
    this.countryRepo = new CountryRepository();
    this.courseRepo = new CourseRepository();
    this.avatarRepo = new AvatarRepository();
  }

  /**
   * Run full database seed programmatically
   */
  public async executeSeed(tenantId: string, actorUid: string): Promise<void> {
    console.log(`[Database Seeder] Initiating bootstrap routine under Tenant ID: ${tenantId}...`);

    // 1. Seed Dialects (e.g. Kimbundu, Umbundu)
    await this.dialectRepo.create({
      tenantId,
      status: 'ACTIVE',
      version: 1,
      name: 'Kimbundu',
      parentLanguage: 'Portuguese (Angola)',
      pronunciationTip: 'Foco na entoação tônica das sílabas paroxítonas e aspiração suave do r.',
      vocabularyOverrides: {
        'menino': 'monandengue',
        'amigo': 'kamba',
        'criança': 'pula'
      }
    } as any, actorUid);

    // 2. Seed Countries (e.g. Angola, Moçambique)
    await this.countryRepo.create({
      tenantId,
      status: 'ACTIVE',
      version: 1,
      countryCode: 'AO',
      countryName: 'Angola',
      officialLanguages: ['pt'],
      regionalLanguages: ['Kimbundu', 'Umbundu', 'Chokwe']
    } as any, actorUid);

    // 3. Seed Courses (Core dynamic language courses)
    await this.courseRepo.create({
      tenantId,
      status: 'ACTIVE',
      version: 1,
      title: 'Introdução ao Kimbundu Clássico',
      description: 'Aprenda os dialetos regionais, saudações tradicionais, provérbios e pronúncias de forma interativa.',
      sourceLanguage: 'pt',
      targetLanguage: 'kmb',
      cefrLevel: 'A1',
      totalLessons: 10
    } as any, actorUid);

    // 4. Seed Avatars (Collectible skins in the marketplace)
    await this.avatarRepo.create({
      tenantId,
      status: 'ACTIVE',
      version: 1,
      name: 'Kamba Sábio',
      imageUrl: 'https://cdn.lingolive.ia/avatars/kamba_sabio.png',
      associatedVoiceId: 'voice_kmb_male_1',
      rarity: 'LEGENDARY',
      unlockedByCoins: 1200
    } as any, actorUid);

    console.log("[Database Seeder] Bootstrap routine executed successfully.");
  }
}
