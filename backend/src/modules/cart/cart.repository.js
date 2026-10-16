import { pool } from "../../config/database.js";


/*
    ============================================
    BUSCAR CARRINHO DO USUÁRIO
    ============================================
*/

export async function buscarCarrinhoPorUsuario(
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                usuario_id,
                criado_em,
                atualizado_em
            FROM carrinhos
            WHERE usuario_id = ?
            LIMIT 1
        `,
        [usuarioId]
    );

    return linhas[0] ?? null;
}


/*
    Cria o carrinho somente se o usuário ainda
    não possuir um.

    A restrição UNIQUE de usuario_id impede
    carrinhos duplicados.
*/
export async function criarCarrinhoSeNaoExistir(
    {
        id,
        usuarioId
    },
    executor = pool
) {
    await executor.execute(
        `
            INSERT INTO carrinhos (
                id,
                usuario_id
            )
            VALUES (?, ?)

            ON DUPLICATE KEY UPDATE
                usuario_id = VALUES(usuario_id)
        `,
        [
            id,
            usuarioId
        ]
    );
}


/*
    ============================================
    LISTAR ITENS
    ============================================
*/

export async function listarItensCarrinho(
    usuarioId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                ci.id AS item_id,
                ci.quantidade,

                pv.id AS produto_variante_id,
                pv.sku,
                pv.tamanho,
                pv.cor,
                pv.preco,
                pv.estoque,
                pv.imagem_url,
                pv.ativo AS variante_ativa,

                p.id AS produto_id,
                p.nome,
                p.categoria,
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
        `,
        [usuarioId]
    );

    return linhas;
}


/*
    ============================================
    BUSCAR VARIANTE COM BLOQUEIO
    ============================================
*/

export async function buscarVarianteParaAtualizacao(
    produtoVarianteId,
    executor
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                pv.id,
                pv.produto_id,
                pv.sku,
                pv.tamanho,
                pv.cor,
                pv.preco,
                pv.estoque,
                pv.ativo AS variante_ativa,

                p.nome,
                p.ativo AS produto_ativo

            FROM produto_variantes AS pv

            INNER JOIN produtos AS p
                ON p.id = pv.produto_id

            WHERE pv.id = ?

            LIMIT 1
            FOR UPDATE
        `,
        [produtoVarianteId]
    );

    return linhas[0] ?? null;
}


/*
    ============================================
    BUSCAR ITEM PELA VARIANTE
    ============================================
*/

export async function buscarItemPorVariante(
    carrinhoId,
    produtoVarianteId,
    executor
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                carrinho_id,
                produto_variante_id,
                quantidade
            FROM carrinho_itens
            WHERE carrinho_id = ?
              AND produto_variante_id = ?
            LIMIT 1
            FOR UPDATE
        `,
        [
            carrinhoId,
            produtoVarianteId
        ]
    );

    return linhas[0] ?? null;
}


/*
    ============================================
    INSERIR ITEM
    ============================================
*/

export async function inserirItemCarrinho(
    {
        id,
        carrinhoId,
        produtoVarianteId,
        quantidade
    },
    executor
) {
    await executor.execute(
        `
            INSERT INTO carrinho_itens (
                id,
                carrinho_id,
                produto_variante_id,
                quantidade
            )
            VALUES (?, ?, ?, ?)
        `,
        [
            id,
            carrinhoId,
            produtoVarianteId,
            quantidade
        ]
    );
}


/*
    ============================================
    BUSCAR ITEM DO USUÁRIO
    ============================================
*/

export async function buscarItemDoUsuario(
    itemId,
    usuarioId,
    executor
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                ci.id,
                ci.carrinho_id,
                ci.produto_variante_id,
                ci.quantidade,

                pv.estoque,
                pv.ativo AS variante_ativa,

                p.ativo AS produto_ativo

            FROM carrinho_itens AS ci

            INNER JOIN carrinhos AS c
                ON c.id = ci.carrinho_id

            INNER JOIN produto_variantes AS pv
                ON pv.id = ci.produto_variante_id

            INNER JOIN produtos AS p
                ON p.id = pv.produto_id

            WHERE ci.id = ?
              AND c.usuario_id = ?

            LIMIT 1
            FOR UPDATE
        `,
        [
            itemId,
            usuarioId
        ]
    );

    return linhas[0] ?? null;
}


/*
    ============================================
    ATUALIZAR QUANTIDADE
    ============================================
*/

export async function atualizarQuantidadeItem(
    itemId,
    quantidade,
    executor
) {
    await executor.execute(
        `
            UPDATE carrinho_itens
            SET quantidade = ?
            WHERE id = ?
        `,
        [
            quantidade,
            itemId
        ]
    );
}


/*
    ============================================
    REMOVER ITEM
    ============================================
*/

export async function removerItemDoUsuario(
    itemId,
    usuarioId,
    executor = pool
) {
    const [resultado] = await executor.execute(
        `
            DELETE ci

            FROM carrinho_itens AS ci

            INNER JOIN carrinhos AS c
                ON c.id = ci.carrinho_id

            WHERE ci.id = ?
              AND c.usuario_id = ?
        `,
        [
            itemId,
            usuarioId
        ]
    );

    return resultado.affectedRows > 0;
}


/*
    ============================================
    ESVAZIAR CARRINHO
    ============================================
*/

export async function esvaziarCarrinhoDoUsuario(
    usuarioId,
    executor = pool
) {
    const [resultado] = await executor.execute(
        `
            DELETE ci

            FROM carrinho_itens AS ci

            INNER JOIN carrinhos AS c
                ON c.id = ci.carrinho_id

            WHERE c.usuario_id = ?
        `,
        [usuarioId]
    );

    return resultado.affectedRows;
}


/*
    Atualiza a data do carrinho quando algum
    de seus itens é alterado.
*/
export async function marcarCarrinhoAtualizado(
    carrinhoId,
    executor = pool
) {
    await executor.execute(
        `
            UPDATE carrinhos
            SET atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
        [carrinhoId]
    );
}