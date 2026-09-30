# Integração ASP.NET Core / SQL Server

## Limite atual

Somente o frontend foi implementado. Não há banco, provedor de pagamentos, webhook ou reserva real. Nunca confirmar pagamentos com base no estado guardado no navegador.

## Adaptadores

Em `app.config.ts`, substituir `DemoCatalogService` por `ApiCatalogService` no token CATALOG_GATEWAY e `DemoOrderService` por `ApiOrderService` no token ORDER_GATEWAY. HttpClient já está provisionado. Ambos usam URLs relativas /api; configurar reverse proxy ou proxy de desenvolvimento. A API deve responder JSON em camelCase. Configurar CORS restrito se frontend e API tiverem origens diferentes.

Os adaptadores são pontos de partida: antes de usar a API, o checkout deve passar a tratar cotação, reserva e sessão de pagamento retornadas pelo backend, e a seleção de resultado da simulação deve ser removida.

## Contrato inicial

- GET /api/products → Product[] (id, name, description, category, price em centavos, stock, image, tag opcional).
- POST /api/orders, header Idempotency-Key → Order. Entrada: items[{productId,sauce,quantity}], fulfillment{mode,date,slot,cep,street,number,neighborhood,city,extra,name,phone,method}. Não confiar em valores ou status enviados pelo navegador.
- GET /api/orders/{id} → Order autorizado, com status atual do pedido e pagamento.

Os modelos TypeScript estão em src/app/models.ts. A imagem corresponde ao nome de recurso /images/{image}.webp. O backend pode ampliar esse contrato para URLs de CDN.

## Endpoints a implementar

- GET /api/availability?date=YYYY-MM-DD&mode=pickup|delivery → intervalos com capacidade atual e fuso America/Sao_Paulo.
- POST /api/quotes → itens e complementos válidos, subtotal, desconto, entrega e total recalculados.
- POST /api/orders/{id}/payment-sessions → sessão do provedor com Pix real ou tokenização segura de cartão. Dados de cartão nunca devem passar pelo frontend próprio ou banco; usar componentes hospedados do provedor.
- POST /api/payments/webhook → verificar assinatura e correlacionar evento, sessão, valor e pedido; atualizar estados de forma idempotente.
- Consulta de pedido deve exigir token opaco de acesso ou autenticação. Um número de pedido não deve expor dados pessoais.

## Persistência proposta em SQL Server

Usar ASP.NET Core com Entity Framework Core e migrations. Entidades:

- Products, Sauces e PromotionRules: preço inteiro em centavos, ativo, estoque e RowVersion.
- Orders: Guid, PublicNumber único, cliente, endereço congelado, modalidade, data/horário, totais calculados e OrderStatus.
- OrderItems: produto e calda com nomes e preços congelados, quantidade positiva.
- Payments: método, sessão do provedor, PaymentStatus independente, total, eventos.
- FulfillmentSlots: início, fim, capacidade, quantidade reservada e RowVersion.
- Reservations: pedido, produto/slot, quantidade, ExpiresAtUtc, status.
- IdempotencyRecords: chave única, hash da entrada e resposta criada.
- PaymentEvents: EventId único, recebido/processado, resultado.

Valores não negativos, quantidades positivas e índices únicos no banco. Datas de auditoria em UTC; converter horários da loja para America/Sao_Paulo. Não armazenar cartão completo.

## Concorrência e expiração

Criar pedido e reservar estoque/vaga em uma transação. Usar concorrência otimista por RowVersion ou bloqueio transacional para impedir venda além do estoque. Repetir a mesma requisição com a mesma chave deve retornar o mesmo pedido; entrada diferente com a mesma chave deve gerar conflito.
Retornar expiresAt do servidor. Um job deve liberar reservas expiradas. Aprovação tardia após expiração exige reconciliação: verificar estoque/vaga e, se necessário, estornar ou encaminhar para atendimento, sem confirmar automaticamente.
A confirmação ocorre apenas após aprovação validada por webhook ou consulta servidor-servidor. O frontend consulta status; não decide a verdade do pagamento.
Tratar 409 (estoque/vaga alterados), 410 (reserva expirada), 422 (campos inválidos), 429 e falhas temporárias. Proteger operações com autorização, limites e HTTPS.

## Antes de produção

Conectar catálogo, cotação, disponibilidade e pedidos; contratar/configurar provedor e webhooks; preencher dados reais da loja; confirmar preços, alergênicos, área de entrega e política de cancelamento; definir retenção e acesso aos dados pessoais; testar falhas, concorrência e expiração de ponta a ponta.
