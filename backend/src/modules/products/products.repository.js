import { pool } from "../../config/database.js";


export async function listarProdutosPublicos(
    executor = pool
) {
    const [linhas] = await executor.execute(
        `
            SELECT
                p.id AS produto_id,
                p.nome,
                p.categoria,
                p.descricao,
                pv.id AS variante_id,
                pv.sku,
                pv.tamanho,
                pv.cor,
                pv.preco,
                pv.estoque,
                pv.imagem_url
            FROM produtos AS p
            INNER JOIN produto_variantes AS pv
                ON pv.produto_id = p.id
            WHERE p.ativo = 1
              AND pv.ativo = 1
            ORDER BY
                p.nome ASC,
                pv.preco ASC,
                pv.tamanho ASC,
                pv.cor ASC
        `
    );

    return linhas;
}
