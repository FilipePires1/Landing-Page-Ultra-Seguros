# Integração com o sistema atual da Ultra

Este documento descreve **como os dados do formulário de cotação chegam ao sistema
que a Ultra já utiliza**, sem expor credenciais no navegador.

## Arquitetura

```
FORMULÁRIO DO SITE (componente nativo, dentro do domínio da Ultra)
        │  POST /api/cotacao   { lead, meta }
        ▼
BACKEND / API  (server/server.js + server/integracao.js)
        │  valida → mapeia campos → encaminha
        ▼
SISTEMA ATUAL DA ULTRA  (webhook ou API)
        │
        ▼
EQUIPE COMERCIAL
```

O frontend **não contém chaves, tokens nem URLs privadas**. Ele apenas envia um
JSON estruturado para o endpoint do próprio site (`/api/cotacao`).

---

## 1. Configurar a integração

Toda a configuração é feita por **variáveis de ambiente** no servidor:

| Variável | O que é | Exemplo |
|---|---|---|
| `ULTRA_WEBHOOK_URL` | Endereço do webhook do sistema atual | `https://sistema.com.br/webhook/leads` |
| `ULTRA_WEBHOOK_TOKEN` | Token de autenticação do webhook (enviado como `Authorization: Bearer …`) | `abc123` |
| `ULTRA_API_URL` | Alternativa: endpoint REST do sistema atual | `https://api.sistema.com.br/v1/leads` |
| `ULTRA_API_KEY` | Chave da API (enviada no header `X-API-Key`) | `abc123` |
| `ULTRA_TIMEOUT_MS` | Timeout do envio (padrão 10000) | `15000` |
| `ULTRA_ADMIN_TOKEN` | Habilita `POST /api/reprocessar-fila` | `uma-senha-forte` |
| `PORT` | Porta do servidor (padrão 3000) | `8080` |

Exemplo de inicialização (Linux/macOS):

```bash
ULTRA_WEBHOOK_URL="https://sistema.com.br/webhook" \
ULTRA_WEBHOOK_TOKEN="seu-token" \
node server/server.js
```

Windows (PowerShell):

```powershell
$env:ULTRA_WEBHOOK_URL = "https://sistema.com.br/webhook"
$env:ULTRA_WEBHOOK_TOKEN = "seu-token"
npm start
```

> **Regra de ouro:** o token/credencial vive **apenas no servidor**.
> Nunca copie essas variáveis para `assets/js/*`.

---

## 2. Mapa de campos

O formulário visual usa nomes próprios. A conversão para os campos do sistema
acontece em **um único arquivo**:

- **`server/map.js`** → fonte da verdade da integração (lado servidor)
- `assets/js/field-map.js` → mesmo mapa, usado só para montar o payload inicial

| Campo visual do site | Chave enviada pelo site | Campo no sistema atual |
|---|---|---|
| Nome completo | `nome` | `nome_cliente` |
| WhatsApp | `whatsapp` | `telefone` |
| E-mail | `email` | `email` |
| Cidade | `cidade` / `cidade_plano` / `cidade_empresa` | `cidade` |
| Produto escolhido | `produto` | `produto` (`auto` → **Seguro Auto**) |
| Veículo | `veiculo` | `veiculo` |
| Ano | `ano_veiculo` | `ano_veiculo` |
| Uso do veículo | `uso_veiculo` | `uso_veiculo` |
| Tipo de imóvel | `tipo_imovel` | `tipo_imovel` |
| Situação do imóvel | `situacao_imovel` | `situacao_imovel` |
| Para quem (vida/saúde) | `para_quem` | `para_quem` |
| Nome da empresa | `nome_empresa` | `nome_empresa` |
| Segmento | `segmento` | `segmento` |
| Nº de funcionários | `funcionarios` | `numero_funcionarios` |
| Proteções desejadas | `protecao_desejada` | `tipo_seguro` |
| Destino da viagem | `destino` | `destino` |
| Objetivo do consórcio | `consorcio_objetivo` | `bem_desejado` |
| Valor do consórcio | `consorcio_valor` | `valor_desejado` |
| Outro seguro | `produto_outro` | `detalhes_produto` |
| Origem do lead | `meta.origem_lead` | `origem` |
| UTM | `meta.utm_*` | `utm_source`, `utm_medium`, `utm_campaign` |

**Se o sistema mudar o nome de um campo, altere somente `server/map.js`.**
Nenhum componente de interface precisa ser tocado.

---

## 3. Exemplo de payload enviado pelo site

```json
{
  "lead": {
    "produto": "auto",
    "veiculo": "Honda Civic",
    "ano_veiculo": "2024",
    "uso_veiculo": "Particular",
    "cidade": "Ipatinga",
    "nome": "João Silva",
    "whatsapp": "(31) 98888-7777",
    "email": "joao@email.com"
  },
  "meta": {
    "origem_lead": "Instagram",
    "utm_source": "instagram",
    "utm_medium": "social",
    "utm_campaign": "lancamento",
    "ref": "linkbio",
    "landing_page": "https://ultra.com.br/",
    "primeira_visita": "2026-10-07T16:58:01.698Z"
  },
  "versao_mapa": "1.0",
  "recebido_em": "2026-10-07T17:01:00.000Z"
}
```

Depois do mapeamento no servidor, o corpo entregue ao sistema fica:

```json
{
  "lead": {
    "nome_cliente": "João Silva",
    "telefone": "(31) 98888-7777",
    "email": "joao@email.com",
    "produto": "Seguro Auto",
    "veiculo": "Honda Civic",
    "ano_veiculo": "2024",
    "uso_veiculo": "Particular",
    "cidade": "Ipatinga",
    "origem": "Instagram",
    "utm_source": "instagram",
    "landing_page": "https://ultra.com.br/"
  },
  "meta": { "...metadados brutos para auditoria..." },
  "origem": "site_ultra_cotacao",
  "enviado_em": "2026-10-07T17:01:02.000Z"
}
```

---

## 4. Fila de segurança (nenhum lead se perde)

Enquanto a integração não estiver configurada — ou se o sistema externo
estiver fora do ar — o lead é gravado em:

```
server/data/fila_leads.jsonl     (um JSON por linha)
server/data/log_integracao.log   (log de envios e falhas)
```

Para reprocessar depois de configurar a integração:

```bash
ULTRA_ADMIN_TOKEN="sua-senha" ULTRA_WEBHOOK_URL="..." npm run reprocessar
```

Ou enviando um POST manual:

```bash
curl -X POST http://localhost:3000/api/reprocessar-fila -H "x-admin-token: sua-senha"
```

> Os arquivos de `server/data/` nunca são servidos publicamente
> (bloqueados no servidor Node e no `.htaccess`).

---

## 5. Respostas da API

| Status | Quando |
|---|---|
| `200 { ok:true, destino:"webhook"\|"api"\|"fila_local" }` | Lead aceito (enviado ou guardado na fila) |
| `422 { ok:false, erro }` | Payload incompleto (validação) |
| `400 { ok:false, erro }` | JSON inválido |
| `413` | Payload acima de 64 KB |

O formulário mostra a tela de sucesso quando recebe `200`. Em caso de falha
persistente, ele preserva as respostas e oferece conclusão pelo WhatsApp.

---

## 6. Quando o sistema atual não tiver API nem webhook

A camada de integração já está pronta: basta preencher `ULTRA_WEBHOOK_URL`
quando a forma oficial de comunicação for definida. Nada no frontend muda.

Caso o sistema aceite **envio por e-mail**, a alternativa é criar um endpoint
próprio (ex.: função serverless do provedor de e-mail) e apontar
`ULTRA_WEBHOOK_URL` para ele — mantendo a mesma estrutura de JSON descrita acima.
