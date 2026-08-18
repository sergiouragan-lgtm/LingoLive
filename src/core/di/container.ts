import "reflect-metadata";
import { container } from "tsyringe";
import { LoggerService } from "../logger/logger";

/**
 * Enterprise DI Container
 * Configures application-wide dependency injection.
 */
export const configureContainer = () => {
  // Register singletons
  container.registerSingleton(LoggerService);
  
  // Register repositories (placeholders)
  // container.registerSingleton(UserRepository);
};

export { container };
