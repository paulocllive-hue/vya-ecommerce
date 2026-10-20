import { pool } from "../../config/database.js";


export async function listarProdutosAdmin(
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                nome,
                categoria,
                descricao,
                ativo,
                criado_em,
                atualizado_em
            FROM produtos
            ORDER BY criado_em DESC, nome ASC
        `
    );

    return linhas;
}


export async function listarVariantesAdmin(
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                produto_id,
                sku,
                tamanho,
                cor,
                preco,
                estoque,
                imagem_url,
                ativo,
                criado_em,
                atualizado_em
            FROM produto_variantes
            ORDER BY produto_id ASC, criado_em ASC, sku ASC
        `
    );

    return linhas;
}


export async function listarSkusPorPrefixo(
    prefixo,
    executor = pool,
    bloquear = false
) {
    const [linhas] = await executor.execute(
        `
            SELECT sku
            FROM produto_variantes
            WHERE sku LIKE ?
            ORDER BY sku ASC
            ${bloquear ? "FOR UPDATE" : ""}
        `,
        [`VYA-${prefixo}-%`]
    );

    return linhas.map((linha) => linha.sku);
}


export async function contarItensPedidoDoProduto(
    produtoId,
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT COUNT(*) AS total
            FROM pedido_itens AS pi
            WHERE pi.produto_id = ?
               OR pi.produto_variante_id IN (
                    SELECT id
                    FROM produto_variantes
                    WHERE produto_id = ?
               )
        `,
        [produtoId, produtoId]
    );

    return Number(linhas[0]?.total ?? 0);
}


export async function excluirItensCarrinhoDoProduto(
    produtoId,
    executor
) {
    await executor.execute(
        `
            DELETE ci
            FROM carrinho_itens AS ci
            INNER JOIN produto_variantes AS pv
                ON pv.id = ci.produto_variante_id
            WHERE pv.produto_id = ?
        `,
        [produtoId]
    );
}


export async function excluirVariantesDoProduto(
    produtoId,
    executor
) {
    await executor.execute(
        `
            DELETE FROM produto_variantes
            WHERE produto_id = ?
        `,
        [produtoId]
    );
}


export async function excluirProdutoPorId(
    produtoId,
    executor
) {
    await executor.execute(
        `
            DELETE FROM produtos
            WHERE id = ?
        `,
        [produtoId]
    );
}


export async function buscarProdutoAdmin(
    produtoId,
    executor = pool,
    bloquear = false
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                nome,
                categoria,
                descricao,
                ativo,
                criado_em,
                atualizado_em
            FROM produtos
            WHERE id = ?
            LIMIT 1
            ${bloquear ? "FOR UPDATE" : ""}
        `,
        [produtoId]
    );

    return linhas[0] ?? null;
}


export async function buscarVarianteAdmin(
    produtoId,
    varianteId,
    executor = pool,
    bloquear = false
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                id,
                produto_id,
                sku,
                tamanho,
                cor,
                preco,
                estoque,
                imagem_url,
                ativo,
                criado_em,
                atualizado_em
            FROM produto_variantes
            WHERE id = ?
              AND produto_id = ?
            LIMIT 1
            ${bloquear ? "FOR UPDATE" : ""}
        `,
        [varianteId, produtoId]
    );

    return linhas[0] ?? null;
}


export async function inserirProduto(
    { id, nome, categoria, descricao, ativo },
    executor
) {
    await executor.execute(
        `
            INSERT INTO produtos (
                id,
                nome,
                categoria,
                descricao,
                ativo
            )
            VALUES (?, ?, ?, ?, ?)
        `,
        [id, nome, categoria, descricao, ativo ? 1 : 0]
    );
}


export async function atualizarProduto(
    { id, nome, categoria, descricao, ativo },
    executor
) {
    await executor.execute(
        `
            UPDATE produtos
            SET
                nome = ?,
                categoria = ?,
                descricao = ?,
                ativo = ?
            WHERE id = ?
        `,
        [nome, categoria, descricao, ativo ? 1 : 0, id]
    );
}


export async function inserirVariante(
    {
        id,
        produtoId,
        sku,
        tamanho,
        cor,
        preco,
        estoque,
        imagemUrl,
        ativo
    },
    executor
) {
    await executor.execute(
        `
            INSERT INTO produto_variantes (
                id,
                produto_id,
                sku,
                tamanho,
                cor,
                preco,
                estoque,
                imagem_url,
                ativo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            id,
            produtoId,
            sku,
            tamanho,
            cor,
            preco,
            estoque,
            imagemUrl,
            ativo ? 1 : 0
        ]
    );
}


export async function atualizarVariante(
    {
        id,
        produtoId,
        sku,
        tamanho,
        cor,
        preco,
        estoque,
        imagemUrl,
        ativo
    },
    executor
) {
    await executor.execute(
        `
            UPDATE produto_variantes
            SET
                sku = ?,
                tamanho = ?,
                cor = ?,
                preco = ?,
                estoque = ?,
                imagem_url = ?,
                ativo = ?
            WHERE id = ?
              AND produto_id = ?
        `,
        [
            sku,
            tamanho,
            cor,
            preco,
            estoque,
            imagemUrl,
            ativo ? 1 : 0,
            id,
            produtoId
        ]
    );
}
