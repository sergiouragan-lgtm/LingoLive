import { RegionalExpressionEngine } from './index';
import { PORTUGUESE_REGIONAL_EXPRESSIONS } from './lexicon.pt';
import { buildTutorGeoContext, protectRegionalExpressions, type CorrectionCandidate, type GeoTelemetrySink } from './integration';
export interface TutorPipelineInput { selectedLanguage: string; targetLanguage?: string; explicitVariant?: string; deviceLocale?: string; country?: string; region?: string; learnerText: string; geoSystemInstructions?: string[]; }
export interface TutorModelRequest { systemInstructions: string[]; learnerText: string; }
export interface TutorCorrectionAdapter { correct(request: TutorModelRequest): Promise<CorrectionCandidate[]>; }
export class GeoAwareTutorPipeline { private readonly engine: RegionalExpressionEngine; constructor(private readonly correctionAdapter: TutorCorrectionAdapter, private readonly telemetry?: GeoTelemetrySink, engine = new RegionalExpressionEngine(PORTUGUESE_REGIONAL_EXPRESSIONS)) { this.engine = engine; } async correct(input: TutorPipelineInput): Promise<CorrectionCandidate[]> { const context = buildTutorGeoContext(input); const corrections = await this.correctionAdapter.correct({ systemInstructions: [...(input.geoSystemInstructions ?? []), context.instruction], learnerText: input.learnerText }); return protectRegionalExpressions({ text: input.learnerText, corrections, profile: context.profile, engine: this.engine, telemetry: this.telemetry }); } }
export interface AIEngineOrchestratorLike { correctLearnerText(input: TutorPipelineInput): Promise<CorrectionCandidate[]>; }
const ATTACHED = Symbol.for('lingolive.geolinguistic-correction-pipeline');
export function attachGeoLinguisticCorrectionPipeline<T extends AIEngineOrchestratorLike>(orchestrator: T, options?: { telemetry?: GeoTelemetrySink; engine?: RegionalExpressionEngine }): T {
  const stateful = orchestrator as T & { [ATTACHED]?: boolean }; if (stateful[ATTACHED]) return orchestrator;
  const originalCorrection = orchestrator.correctLearnerText.bind(orchestrator); const engine = options?.engine ?? new RegionalExpressionEngine(PORTUGUESE_REGIONAL_EXPRESSIONS);
  orchestrator.correctLearnerText = async (input) => { const context = buildTutorGeoContext(input); const corrections = await originalCorrection({ ...input, geoSystemInstructions: [...(input.geoSystemInstructions ?? []), context.instruction] }); return protectRegionalExpressions({ text: input.learnerText, corrections, profile: context.profile, engine, telemetry: options?.telemetry }); };
  Object.defineProperty(stateful, ATTACHED, { value: true, enumerable: false }); return orchestrator;
}
