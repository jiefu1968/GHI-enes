# Correções aplicadas (patch de segurança + consistência)

Conjunto **não-destrutivo** — nada muda o design intencional (doutrina,
modelo de código de acesso, BM25). Tudo compila (`tsc --noEmit` sem erros).

## 1. Segurança de crise (maior valor)
- **`src/lib/mentor.ts`**
  - Adicionadas palavras-chave de escalonamento em **chinês** (simplificado +
    variantes tradicionais) — o público declarado são missionários chineses,
    mas a lista era só EN/PT/ES e ignorava silenciosamente uma crise em chinês.
  - `isSelfHarmRisk(reason)` — distingue risco agudo de autolesão dos flags
    mais leves.
  - `buildCrisisSupportBlock()` — mensagem compassiva PT/ES/中文 com recursos
    internacionais (findahelpline.com, befrienders.org). **Único lugar** onde
    os recursos de crise são definidos — localize/ajuste aqui por país.
- **`src/app/api/chat/route.ts`**
  - Em mensagem com risco de autolesão, o bloco de apoio é enviado ao usuário
    **imediatamente**, antes da resposta da IA (antes só o mentor era
    notificado em silêncio, e ele pode estar offline).
  - A checagem de escalonamento agora roda para **toda** sessão (inclusive
    anônima); o flag/log no banco continua exigindo `missionaryId`.

## 2. Consistência de configuração (corrige premissas quebradas)
- **`src/lib/env.ts`**
  - Nova var **`SUPERVISOR_CRITIC_MODEL`** (default = `PRIMARY_MODEL_FALLBACK`):
    supervisor e crítico usavam o mesmo modelo 120b enquanto os comentários
    diziam "8B barato". Agora é explícito e sobreponível por um modelo menor
    (ex.: `openai/gpt-oss-20b` via Together).
  - Aviso de segurança (não derruba o app) quando `SESSION_SECRET` está num
    placeholder conhecido em produção — cookie de sessão forjável.
- **`src/lib/supervisor.ts`, `src/lib/critic.ts`** — passam a usar
  `SUPERVISOR_CRITIC_MODEL`; comentários "Llama 3.1 8B" corrigidos.
- **`src/lib/logger.ts` + `src/lib/groq.ts`** — contadores de provedor agora
  rotulados por papel (`primary`/`fallback`) em vez de "groq"/"cerebras"
  fixos, que rotulavam errado no log stream. `/api/health` não muda.
- **`README.md` / `.env.example`** — descrição de provedor/modelo atualizada
  (Cerebras `gpt-oss-120b` / Together), nova var documentada.

## O que NÃO foi tocado (de propósito)
- Guardrail doutrinário (escolha confessional intencional).
- Modelo de código de acesso compartilhado (mexer poderia te travar fora).
- BM25 → vetorial (mudança grande, exige infra — pgvector é o caminho).
- Ausência de testes automatizados (recomendado como próximo passo).

## Como testar localmente
```bash
npm install
cp .env.example .env      # preencha PRIMARY_API_KEY, DATABASE_URL, SESSION_SECRET
npx prisma migrate deploy
npm run dev
```
Teste de crise (com um missionaryId identificado ou anônimo): envie uma
mensagem contendo, por exemplo, "想死" ou "quiero morir" e confirme que o
bloco de apoio aparece antes da resposta da IA.

## Deploy na Railway
Faça commit e `git push`. Garanta as variáveis no painel da Railway:
`PRIMARY_API_KEY`, `DATABASE_URL`, `SESSION_SECRET` (use `openssl rand -base64 32`),
e opcionalmente `SUPERVISOR_CRITIC_MODEL`, `FALLBACK_API_KEY`.

---

# RAG híbrido (BM25 + pgvector) — OPT-IN

Adiciona busca semântica/cross-lingual por vetores **fundida** com o BM25
léxico via Reciprocal Rank Fusion (RRF). **Desligado por padrão**
(`ENABLE_HYBRID_RAG=false`) — com a flag off, a recuperação é
byte-a-byte a original (BM25 puro). Nada de infra nova é criado até você
ativar e rodar a reindexação.

**Por que RRF (e não média ponderada):** score BM25 e distância de cosseno
vivem em escalas incomparáveis; misturar os números crus não faz sentido.
O RRF ignora as magnitudes e funde por **rank**:
`score(chunk) = Σ 1/(k + rank_na_lista)`. Robusto e com um só parâmetro.

**Segurança do design:**
- A extensão `pgvector` e a tabela `chunk_embeddings` são criadas **sob
  demanda** por SQL cru idempotente (`IF NOT EXISTS`), **não** por
  migração Prisma — assim, um Postgres sem pgvector **não** derruba o
  `prisma migrate deploy`. Sem pgvector, a reindexação falha graciosamente
  e a recuperação cai no BM25.
- `fail-open` em tudo: embeddings não configurados, consulta vetorial vazia
  ou qualquer erro → retorna o resultado BM25 puro. Ativar o híbrido nunca
  piora a recuperação.
- Identidade de chunk = hash de conteúdo (`chunkId`), idêntico entre BM25
  (memória) e vetor (Postgres), que é a chave de junção do RRF.

**Arquivos novos:** `src/lib/embeddings.ts` (cliente OpenAI-compat,
fail-open), `src/lib/vectorStore.ts` (pgvector via SQL cru), 
`src/lib/retrieval.ts` (orquestra BM25 + vetor + RRF),
`src/app/api/admin/reindex/route.ts` (reindexação protegida por token).

**Arquivos alterados:** `rag.ts` (expõe `chunkId`, `collectChunks`,
`bm25RankedChunks`, `assembleContext`; `retrieveRelevantChunks` intacto
como fallback), `env.ts` (novas vars), e os 3 chamadores de recuperação
(`groq.ts` `buildMessages` virou `async`; `quiz.ts`; `caseStudies.ts`)
passaram a `await retrieveContext(...)`.

## Como ativar
1. No `.env` / painel da Railway:
   ```
   ENABLE_HYBRID_RAG=true
   EMBEDDING_API_KEY=<sua chave (ex.: Together AI)>
   EMBEDDING_BASE_URL=https://api.together.ai/v1/embeddings
   EMBEDDING_MODEL=BAAI/bge-m3          # multilíngue — confirme no provedor
   EMBEDDING_DIM=1024                    # DEVE bater com a dimensão do modelo
   REINDEX_TOKEN=<openssl rand -base64 32>
   ```
   Use um modelo de embedding **multilíngue** — o ganho cross-lingual
   (pergunta PT/ES/中文 × conteúdo em inglês) é o motivo principal de usar
   vetores aqui.
2. Deploy, depois rode a reindexação uma vez (e sempre que mudar os `.md`):
   ```bash
   curl -X POST https://SEU-APP.up.railway.app/api/admin/reindex \
     -H "Authorization: Bearer $REINDEX_TOKEN"
   # opcional: -d '{"modules":[12,21,29]}' para reindexar só alguns
   ```
   Resposta esperada: `{"ok":true,"embedded":N,"modules":M}`.

Para desativar a qualquer momento, sem redeploy de código: 
`ENABLE_HYBRID_RAG=false`.

## Escalar depois (corpus grande)
Sem índice ANN por padrão (força bruta de cosseno é rápida em alguns
milhares de chunks e maximiza compatibilidade). Para adicionar (pgvector
≥ 0.5): `CREATE INDEX ON chunk_embeddings USING hnsw (embedding vector_cosine_ops);`
