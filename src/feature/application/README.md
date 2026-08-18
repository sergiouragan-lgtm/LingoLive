# Application Layer (`feature/application`)

Esta camada é responsável por abrigar as lógicas da aplicação e regras de fluxo. Ela não deve conhecer componentes visuais ou detalhes de frameworks de persistência específicos (como Firebase ou SQL bruto).

## O que colocar aqui
- **Casos de Uso (Use Cases / Interactors):** Funções e classes que definem fluxos específicos como `ProcessarAvaliacaoDeVoz.ts` ou `IniciarChamadaDeTutor.ts`.
- **Orquestradores de Integração:** Mecanismos que intermedeiam as requisições para os provedores de inteligência artificial (Gemini/OpenAI) e inteligência de logs.
