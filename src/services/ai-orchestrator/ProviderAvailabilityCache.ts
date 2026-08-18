import { TutorProviderId } from "./TutorProviderSelectionPolicy";
import { ProviderHealthSnapshot } from "./ProviderHealthMonitor";
import { ProviderCircuitSnapshot } from "./ProviderCircuitBreaker";

export interface ProviderAvailabilityEntry {
  readonly providerId: TutorProviderId;
  readonly health: ProviderHealthSnapshot;
  readonly circuit: ProviderCircuitSnapshot;
  readonly updatedAt: number;
}

export interface ProviderAvailabilityCache {
  readonly entries: ReadonlyMap<TutorProviderId, ProviderAvailabilityEntry>;
}

export function createEmptyAvailabilityCache(): ProviderAvailabilityCache {
  return Object.freeze({
    entries: new Map<TutorProviderId, ProviderAvailabilityEntry>(),
  });
}

export function upsertProviderAvailability(
  cache: ProviderAvailabilityCache,
  providerId: TutorProviderId,
  health: ProviderHealthSnapshot,
  circuit: ProviderCircuitSnapshot,
  timestamp: number
): ProviderAvailabilityCache {
  const newEntries = new Map<TutorProviderId, ProviderAvailabilityEntry>(cache.entries);
  
  const newEntry: ProviderAvailabilityEntry = Object.freeze({
    providerId,
    health,
    circuit,
    updatedAt: timestamp,
  });

  newEntries.set(providerId, newEntry);

  return Object.freeze({
    entries: newEntries,
  });
}

export function getProviderAvailability(
  cache: ProviderAvailabilityCache,
  providerId: TutorProviderId
): ProviderAvailabilityEntry | undefined {
  return cache.entries.get(providerId);
}

export function listProviderAvailability(
  cache: ProviderAvailabilityCache
): ReadonlyArray<ProviderAvailabilityEntry> {
  return Object.freeze(Array.from(cache.entries.values()));
}

export function removeProviderAvailability(
  cache: ProviderAvailabilityCache,
  providerId: TutorProviderId
): ProviderAvailabilityCache {
  if (!cache.entries.has(providerId)) {
    return cache;
  }
  
  const newEntries = new Map<TutorProviderId, ProviderAvailabilityEntry>(cache.entries);
  newEntries.delete(providerId);
  
  return Object.freeze({
    entries: newEntries,
  });
}
