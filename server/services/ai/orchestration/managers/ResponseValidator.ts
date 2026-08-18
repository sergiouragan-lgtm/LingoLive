import { IResponseValidator } from "../interfaces/IEngineComponents";
import { AIOrchestrationLogger } from "../utils/Logger";

export class ResponseValidator implements IResponseValidator {
  validate(text: string, schema: any): { valid: boolean; data?: any; error?: string } {
    let cleanedText = text.trim();

    // 1. Defensively strip markdown block wrappers if present (e.g., ```json ... ```)
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }

    try {
      const parsedData = JSON.parse(cleanedText);

      // 2. Validate against simple structural schemas (if keys are required)
      if (schema && schema.required && Array.isArray(schema.required)) {
        for (const reqKey of schema.required) {
          if (!(reqKey in parsedData)) {
            return {
              valid: false,
              error: `Missing mandatory JSON property: '${reqKey}'`
            };
          }
        }
      }

      return { valid: true, data: parsedData };
    } catch (e: any) {
      AIOrchestrationLogger.warn(`JSON Validation failed for output. Raw text prefix: ${text.substring(0, 100)}. Error: ${e.message}`);
      return {
        valid: false,
        error: `Invalid JSON structure: ${e.message}`
      };
    }
  }
}
