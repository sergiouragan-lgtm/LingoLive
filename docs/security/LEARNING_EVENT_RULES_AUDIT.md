# Auditoria adversarial — modelo de aprendizagem

Escopo: `learning_activity_definitions`, `learning_events`, `student_learning_gaps`, `learning_recommendations` e `corrective_activities`.

| Ataque | Resultado |
| --- | --- |
| leitura pública/listagem sem autenticação | bloqueada por `isSignedIn` |
| leitura de outro aluno/tenant | bloqueada pela propriedade `studentId == auth.uid` |
| criação ou atualização direta pelo proprietário | bloqueada; escrita apenas via Admin SDK |
| troca de proprietário, schema pollution e payload de 1 MB | bloqueados porque clientes não escrevem |
| alteração de timestamps ou evidência histórica | bloqueada; eventos são imutáveis |
| replay da mesma tentativa | neutralizado por ID determinístico e transação |
| corrupção de tipo/omissão de campo | rejeitada pela validação server-side antes da transação |
| tenant ou student spoofing no endpoint | rejeitado contra token e documento canónico do utilizador |
| estado `mastered` forjado | bloqueado; somente o projetor server-side calcula transições |
| gap órfão sem evento | a transação grava evento e projeção atomicamente |
| classificação forjada pelo aluno | endpoint público aceita apenas tentativa bruta; não existe rota pública para eventos classificados |
| regionalismo válido convertido em erro | respostas regionais provêm da definição server-only e são classificadas como corretas |

Os testes no emulador comprovam isolamento, leitura do proprietário e bloqueio de escritas clientes. Estas regras são um protótipo seguro por padrão e devem ser revistas novamente com os claims e tenants reais antes de uma disponibilização ampla.
