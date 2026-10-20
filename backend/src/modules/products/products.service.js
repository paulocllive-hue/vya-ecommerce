import {
    listarProdutosPublicos
} from "./products.repository.js";


function montarVariante(linha) {
    return {
        id: linha.variante_id,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        preco: Number(linha.preco),
        estoque: Number(linha.estoque),
        imagemUrl: linha.imagem_url,
        disponivel: Number(linha.estoque) > 0
    };
}


export async function obterProdutosPublicos() {
    const linhas = await listarProdutosPublicos();
    const produtos = new Map();

    for (const linha of linhas) {
        if (!produtos.has(linha.produto_id)) {
            produtos.set(linha.produto_id, {
                id: linha.produto_id,
                nome: linha.nome,
                categoria: linha.categoria,
                descricao: linha.descricao,
                variantes: []
            });
        }

        produtos
            .get(linha.produto_id)
            .variantes.push(montarVariante(linha));
    }

    return [...produtos.values()];
}
