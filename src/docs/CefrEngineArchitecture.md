# CEFR Engine Architecture

## 1. Core Concepts
- **Competency Matrix**: Defines granular objectives mapped to A1-C2.
- **Assessment Engine**: Evaluates learner performance against rubrics.
- **Adaptive Difficulty**: Dynamically adjusts prompts based on `UserMemory` and performance metrics.

## 2. Dashboards
- **Student Dashboard**: Visualizes mastery percentage per skill/level.
- **Teacher Dashboard**: Provides aggregated insights and intervention recommendations based on rubric scores.

## 3. Progression Rules
Progression is achieved when consistent `evaluate()` scores meet the `minScore` defined in `AssessmentRubric` over a window of interactions.
