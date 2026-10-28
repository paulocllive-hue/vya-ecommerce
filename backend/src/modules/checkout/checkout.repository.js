import { pool } from "../../config/database.js";


export async function listarEnderecosUsuario(
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                nome_destinatario,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                principal,
                criado_em,
                atualizado_em
            FROM enderecos
            WHERE usuario_id = ?
            ORDER BY
                principal DESC,
                atualizado_em DESC
        `,
        [usuarioId]
    );

    return linhas;
}


export async function contarEnderecosUsuario(
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT COUNT(*) AS total
            FROM enderecos
            WHERE usuario_id = ?
        `,
        [usuarioId]
    );

    return Number(linhas[0].total);
}


export async function cidadeEstaAtendida(
    cidade,
    estado,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT id
            FROM cidades_entrega
            WHERE cidade = ?
              AND estado = ?
              AND ativo = 1
            LIMIT 1
        `,
        [cidade, estado]
    );

    return Boolean(linhas[0]);
}


export async function desmarcarEnderecosPrincipais(
    usuarioId,
    executor
) {
    await executor.execute(
        `
            UPDATE enderecos
            SET principal = 0
            WHERE usuario_id = ?
        `,
        [usuarioId]
    );
}


export async function inserirEndereco(
    {
        id,
        usuarioId,
        nomeDestinatario,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        referencia,
        principal
    },
    executor
) {
    await executor.execute(
        `
            INSERT INTO enderecos (
                id,
                usuario_id,
                nome_destinatario,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                principal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            id,
            usuarioId,
            nomeDestinatario,
            cep,
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            referencia,
            principal ? 1 : 0
        ]
    );
}


export async function removerEnderecoUsuario(
    enderecoId,
    usuarioId,
    executor = pool
) {
    const [resultado] = await executor.execute(
        `
            DELETE FROM enderecos
            WHERE id = ?
              AND usuario_id = ?
        `,
        [enderecoId, usuarioId]
    );

    return resultado.affectedRows > 0;
}


export async function buscarEnderecoUsuario(
    enderecoId,
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                usuario_id,
                nome_destinatario,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                referencia,
                principal
            FROM enderecos
            WHERE id = ?
              AND usuario_id = ?
            LIMIT 1
        `,
        [enderecoId, usuarioId]
    );

    return linhas[0] ?? null;
}


export async function buscarConfiguracaoEntrega(
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                cep_origem,
                bairro_origem,
                cidade_origem,
                estado_origem,
                permite_retirada,
                prazo_dias_uteis
            FROM configuracoes_entrega
            WHERE ativo = 1
            ORDER BY id ASC
            LIMIT 1
        `
    );

    return linhas[0] ?? null;
}


export async function buscarFaixaEntrega(
    distanciaKm,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                ate_km,
                valor
            FROM faixas_entrega
            WHERE ativo = 1
              AND ate_km >= ?
            ORDER BY ate_km ASC
            LIMIT 1
        `,
        [distanciaKm]
    );

    return linhas[0] ?? null;
}


export async function buscarItensParaFinalizacao(
    usuarioId,
    executor
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                c.id AS carrinho_id,
                ci.id AS carrinho_item_id,
                ci.quantidade,

                pv.id AS produto_variante_id,
                pv.produto_id,
                pv.sku,
                pv.tamanho,
                pv.cor,
                pv.preco,
                pv.estoque,
                pv.ativo AS variante_ativa,

                p.nome,
                p.ativo AS produto_ativo

            FROM carrinhos AS c

            INNER JOIN carrinho_itens AS ci
                ON ci.carrinho_id = c.id

            INNER JOIN produto_variantes AS pv
                ON pv.id = ci.produto_variante_id

            INNER JOIN produtos AS p
                ON p.id = pv.produto_id

            WHERE c.usuario_id = ?

            ORDER BY
                ci.criado_em ASC,
                ci.id ASC

            FOR UPDATE
        `,
        [usuarioId]
    );

    return linhas;
}


export async function inserirPedido(
    {
        id,
        usuarioId,
        enderecoId,
        metodoEntrega,
        metodoPagamento,
        destinatario,
        subtotal,
        valorFrete,
        total,
        distanciaEntregaKm,
        prazoEntregaDiasUteis,
        dataPrevistaEntrega,
        statusEntrega,
        endereco
    },
    executor
) {
    const [resultado] = await executor.execute(
        `
            INSERT INTO pedidos (
                id,
                usuario_id,
                endereco_id,
                status,
                status_pagamento,
                metodo_pagamento,
                metodo_entrega,
                subtotal,
                valor_frete,
                desconto,
                total,
                distancia_entrega_km,
                prazo_entrega_dias_uteis,
                data_prevista_entrega,
                status_entrega,
                destinatario,
                cep,
                logradouro,
                numero_endereco,
                complemento,
                bairro,
                cidade,
                estado
            )
            VALUES (
                ?, ?, ?,
                'aguardando_pagamento',
                'pendente',
                ?,
                ?,
                ?, ?, 0.00, ?,
                ?, ?, ?,
                ?,
                ?,
                ?, ?, ?,
                ?, ?, ?, ?
            )
        `,
        [
            id,
            usuarioId,
            enderecoId,
            metodoPagamento,
            metodoEntrega,
            subtotal,
            valorFrete,
            total,
            distanciaEntregaKm,
            prazoEntregaDiasUteis,
            dataPrevistaEntrega,
            statusEntrega,
            destinatario,
            endereco?.cep ?? null,
            endereco?.logradouro ?? null,
            endereco?.numero ?? null,
            endereco?.complemento ?? null,
            endereco?.bairro ?? null,
            endereco?.cidade ?? null,
            endereco?.estado ?? null
        ]
    );

    return Number(resultado.insertId);
}


export async function inserirItemPedido(
    {
        id,
        pedidoId,
        produtoId,
        produtoVarianteId,
        nomeProduto,
        sku,
        tamanho,
        cor,
        precoUnitario,
        quantidade,
        subtotal
    },
    executor
) {
    await executor.execute(
        `
            INSERT INTO pedido_itens (
                id,
                pedido_id,
                produto_id,
                produto_variante_id,
                nome_produto,
                sku,
                tamanho,
                cor,
                preco_unitario,
                quantidade,
                subtotal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            id,
            pedidoId,
            produtoId,
            produtoVarianteId,
            nomeProduto,
            sku,
            tamanho,
            cor,
            precoUnitario,
            quantidade,
            subtotal
        ]
    );
}


export async function baixarEstoqueVariante(
    produtoVarianteId,
    quantidade,
    executor
) {
    const [resultado] = await executor.execute(
        `
            UPDATE produto_variantes
            SET estoque = estoque - ?
            WHERE id = ?
              AND estoque >= ?
        `,
        [
            quantidade,
            produtoVarianteId,
            quantidade
        ]
    );

    return resultado.affectedRows > 0;
}


export async function esvaziarCarrinhoNaFinalizacao(
    carrinhoId,
    executor
) {
    await executor.execute(
        `
            DELETE FROM carrinho_itens
            WHERE carrinho_id = ?
        `,
        [carrinhoId]
    );

    await executor.execute(
        `
            UPDATE carrinhos
            SET atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
        [carrinhoId]
    );
}


export async function buscarPedidoUsuario(
    pedidoId,
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                numero_pedido,
                status,
                status_pagamento,
                metodo_pagamento,
                metodo_entrega,
                subtotal,
                valor_frete,
                desconto,
                total,
                status_entrega,
                distancia_entrega_km,
                prazo_entrega_dias_uteis,
                data_prevista_entrega,
                destinatario,
                criado_em,
                atualizado_em
            FROM pedidos
            WHERE id = ?
              AND usuario_id = ?
            LIMIT 1
        `,
        [pedidoId, usuarioId]
    );

    return linhas[0] ?? null;
}


export async function listarPedidosUsuario(
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                numero_pedido,
                status,
                status_pagamento,
                metodo_pagamento,
                metodo_entrega,
                subtotal,
                valor_frete,
                desconto,
                total,
                status_entrega,
                distancia_entrega_km,
                prazo_entrega_dias_uteis,
                data_prevista_entrega,
                criado_em,
                atualizado_em
            FROM pedidos
            WHERE usuario_id = ?
            ORDER BY criado_em DESC
        `,
        [usuarioId]
    );

    return linhas;
}


export async function listarItensPedido(
    pedidoId,
    executor = pool
) {
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
        `,
        [pedidoId]
    );

    return linhas;
}
