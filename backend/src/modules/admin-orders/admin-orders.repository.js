import { pool } from "../../config/database.js";


const CAMPOS_PEDIDO = `
    p.id,
    p.numero_pedido,
    p.usuario_id,
    p.endereco_id,
    p.status,
    p.status_pagamento,
    p.metodo_pagamento,
    p.metodo_entrega,
    p.subtotal,
    p.valor_frete,
    p.desconto,
    p.total,
    p.distancia_entrega_km,
    p.prazo_entrega_dias_uteis,
    p.data_prevista_entrega,
    p.status_entrega,
    p.entregue_em,
    p.destinatario,
    p.cep,
    p.logradouro,
    p.numero_endereco,
    p.complemento,
    p.bairro,
    p.cidade,
    p.estado,
    p.criado_em,
    p.atualizado_em,
    u.nome AS cliente_nome,
    u.email AS cliente_email
`;


export async function listarPedidosAdmin(
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                ${CAMPOS_PEDIDO},
                COALESCE((
                    SELECT SUM(pi.quantidade)
                    FROM pedido_itens AS pi
                    WHERE pi.pedido_id = p.id
                ), 0) AS quantidade_itens
            FROM pedidos AS p
            INNER JOIN usuarios AS u
                ON u.id = p.usuario_id
            ORDER BY
                p.criado_em DESC,
                p.numero_pedido DESC
        `
    );

    return linhas;
}


export async function buscarPedidoAdmin(
    pedidoId,
    executor = pool,
    bloquear = false
) {
    const bloqueio = bloquear
        ? "FOR UPDATE"
        : "";

    const [linhas] = await executor.execute(
        `
            SELECT
                ${CAMPOS_PEDIDO}
            FROM pedidos AS p
            INNER JOIN usuarios AS u
                ON u.id = p.usuario_id
            WHERE p.id = ?
            LIMIT 1
            ${bloqueio}
        `,
        [pedidoId]
    );

    return linhas[0] ?? null;
}


export async function listarItensPedidoAdmin(
    pedidoId,
    executor = pool,
    bloquear = false
) {
    const bloqueio = bloquear
        ? "FOR UPDATE"
        : "";

    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                produto_id,
                produto_variante_id,
                nome_produto,
                sku,
                tamanho,
                cor,
                preco_unitario,
                quantidade,
                subtotal
            FROM pedido_itens
            WHERE pedido_id = ?
            ORDER BY criado_em ASC, id ASC
            ${bloqueio}
        `,
        [pedidoId]
    );

    return linhas;
}


export async function atualizarSituacaoPedido(
    {
        pedidoId,
        status,
        statusPagamento,
        statusEntrega,
        entregueEm
    },
    executor
) {
    await executor.execute(
        `
            UPDATE pedidos
            SET
                status = ?,
                status_pagamento = ?,
                status_entrega = ?,
                entregue_em = ?
            WHERE id = ?
        `,
        [
            status,
            statusPagamento,
            statusEntrega,
            entregueEm,
            pedidoId
        ]
    );
}


export async function devolverEstoque(
    produtoVarianteId,
    quantidade,
    executor
) {
    await executor.execute(
        `
            UPDATE produto_variantes
            SET estoque = estoque + ?
            WHERE id = ?
        `,
        [quantidade, produtoVarianteId]
    );
}
