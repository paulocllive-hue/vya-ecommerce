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
