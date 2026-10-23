import { randomUUID } from "node:crypto";

import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    atualizarProduto,
    atualizarVariante,
    buscarProdutoAdmin,
    buscarVarianteAdmin,
    contarItensPedidoDoProduto,
    excluirItensCarrinhoDoProduto,
    excluirProdutoPorId,
    excluirVariantesDoProduto,
    inserirProduto,
    inserirVariante,
    listarProdutosAdmin,
    listarSlugsPorPrefixo,
    listarSkusPorPrefixo,
    listarVariantesAdmin
} from "./admin-products.repository.js";

import {
    calcularProximoSku,
    CATEGORIAS_PRODUTO,
    obterPrefixoSku
} from "./admin-products.categories.js";


function montarVariante(linha) {
    return {
        id: linha.id,
        produtoId: linha.produto_id,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        preco: Number(linha.preco),
        estoque: Number(linha.estoque),
        imagemUrl: linha.imagem_url,
        ativo: Boolean(Number(linha.ativo)),
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em
    };
}


function montarProduto(linha, variantes = []) {
    const variantesMontadas = variantes.map(
        montarVariante
    );

    return {
        id: linha.id,
        nome: linha.nome,
        categoria: linha.categoria,
        descricao: linha.descricao,
        ativo: Boolean(Number(linha.ativo)),
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em,
        estoqueTotal: variantesMontadas.reduce(
            (total, variante) => {
                return total + variante.estoque;
            },
            0
        ),
        variantes: variantesMontadas
    };
}


function tratarDuplicidade(erro) {
    if (erro.code === "ER_DUP_ENTRY") {
        const mensagemBanco = String(
            erro.sqlMessage ?? erro.message ?? ""
        ).toLowerCase();

        if (mensagemBanco.includes("sku")) {
            throw new AppError(
                "O SKU calculado já está ocupado. Atualize o painel e tente salvar novamente.",
                409,
                "SKU_DUPLICADO"
            );
        }

        if (mensagemBanco.includes("slug")) {
            throw new AppError(
                "O endereço automático deste produto já está ocupado. Atualize o painel e tente salvar novamente.",
                409,
                "SLUG_DUPLICADO"
            );
        }

        throw new AppError(
            "Este produto já possui uma variação com o mesmo tamanho e a mesma cor.",
            409,
            "OPCAO_DE_VARIANTE_DUPLICADA"
        );
    }

    throw erro;
}


function criarSlugBase(nome) {
    const slug = nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140)
        .replace(/-+$/g, "");

    return slug || "produto";
}


async function gerarSlugProduto(
    nome,
    executor = pool,
    bloquear = false
) {
    const slugBase = criarSlugBase(nome);
    const existentes = new Set(
        await listarSlugsPorPrefixo(
            slugBase,
            executor,
            bloquear
        )
    );

    if (!existentes.has(slugBase)) {
        return slugBase;
    }

    let numero = 2;
    while (existentes.has(`${slugBase}-${numero}`)) {
        numero += 1;
    }

    return `${slugBase}-${numero}`;
}


async function gerarProximoSku(
    categoria,
    executor = pool,
    bloquear = false
) {
    const prefixo = obterPrefixoSku(categoria);

    if (!prefixo) {
        throw new AppError(
            "A categoria informada não possui uma regra de SKU.",
            422,
            "CATEGORIA_SEM_REGRA_DE_SKU"
        );
    }

    const skusExistentes = await listarSkusPorPrefixo(
        prefixo,
        executor,
        bloquear
    );
    return calcularProximoSku(
        prefixo,
        skusExistentes
    );
}


export async function obterProximoSku(categoria) {
    return gerarProximoSku(categoria);
}


export async function obterProdutosAdmin() {
    const [produtos, variantes] = await Promise.all([
        listarProdutosAdmin(),
        listarVariantesAdmin()
    ]);

    const variantesPorProduto = new Map();

    for (const variante of variantes) {
        const lista = variantesPorProduto.get(
            variante.produto_id
        ) ?? [];

        lista.push(variante);
        variantesPorProduto.set(
            variante.produto_id,
            lista
        );
    }

    return produtos.map((produto) => {
        return montarProduto(
            produto,
            variantesPorProduto.get(produto.id) ?? []
        );
    });
}


export function obterCategoriasProduto() {
    return CATEGORIAS_PRODUTO.map(
        (categoria) => ({ ...categoria })
    );
}


export async function criarProduto(dados) {
    const conexao = await pool.getConnection();
    const produtoId = randomUUID();

    try {
        await conexao.beginTransaction();

        await inserirProduto(
            {
                id: produtoId,
                nome: dados.nome,
                slug: await gerarSlugProduto(
                    dados.nome,
                    conexao,
                    true
                ),
                categoria: dados.categoria,
                descricao: dados.descricao,
                ativo: dados.ativo
            },
            conexao
        );

        await inserirVariante(
            {
                id: randomUUID(),
                produtoId,
                ...dados.varianteInicial,
                cor: "Padrão",
                sku: await gerarProximoSku(
                    dados.categoria,
                    conexao,
                    true
                )
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    const produtos = await obterProdutosAdmin();
    return produtos.find(
        (produto) => produto.id === produtoId
    );
}


export async function editarProduto(
    produtoId,
    dados
) {
    const conexao = await pool.getConnection();

    try {
        await conexao.beginTransaction();

        const atual = await buscarProdutoAdmin(
            produtoId,
            conexao,
            true
        );

        if (!atual) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        await atualizarProduto(
            {
                id: produtoId,
                nome: dados.nome ?? atual.nome,
                categoria:
                    dados.categoria ?? atual.categoria,
                descricao:
                    dados.descricao !== undefined
                        ? dados.descricao
                        : atual.descricao,
                ativo:
                    dados.ativo !== undefined
                        ? dados.ativo
                        : Boolean(Number(atual.ativo))
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    const produtos = await obterProdutosAdmin();
    return produtos.find(
        (produto) => produto.id === produtoId
    );
}


export async function criarVariante(
    produtoId,
    dados
) {
    const conexao = await pool.getConnection();
    const varianteId = randomUUID();

    try {
        await conexao.beginTransaction();

        const produto = await buscarProdutoAdmin(
            produtoId,
            conexao,
            true
        );

        if (!produto) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        await inserirVariante(
            {
                id: varianteId,
                produtoId,
                ...dados,
                sku: await gerarProximoSku(
                    produto.categoria,
                    conexao,
                    true
                )
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    return montarVariante(
        await buscarVarianteAdmin(
            produtoId,
            varianteId
        )
    );
}


export async function removerProduto(produtoId) {
    const conexao = await pool.getConnection();
    let produtoExcluido = null;

    try {
        await conexao.beginTransaction();

        const produto = await buscarProdutoAdmin(
            produtoId,
            conexao,
            true
        );

        if (!produto) {
            throw new AppError(
                "Produto não encontrado.",
                404,
                "PRODUTO_NAO_ENCONTRADO"
            );
        }

        const totalEmPedidos =
            await contarItensPedidoDoProduto(
                produtoId,
                conexao
            );

        if (totalEmPedidos > 0) {
            throw new AppError(
                "Este produto já faz parte de um pedido e não pode ser apagado. Inative o produto para removê-lo da loja sem perder o histórico da venda.",
                409,
                "PRODUTO_POSSUI_PEDIDOS"
            );
        }

        await excluirItensCarrinhoDoProduto(
            produtoId,
            conexao
        );
        await excluirVariantesDoProduto(
            produtoId,
            conexao
        );
        await excluirProdutoPorId(
            produtoId,
            conexao
        );

        await conexao.commit();
        produtoExcluido = {
            id: produto.id,
            nome: produto.nome
        };
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    return produtoExcluido;
}


export async function editarVariante(
    produtoId,
    varianteId,
    dados
) {
    const conexao = await pool.getConnection();
    let imagemAnterior = null;

    try {
        await conexao.beginTransaction();

        const atual = await buscarVarianteAdmin(
            produtoId,
            varianteId,
            conexao,
            true
        );

        if (!atual) {
            throw new AppError(
                "Variante não encontrada.",
                404,
                "VARIANTE_NAO_ENCONTRADA"
            );
        }

        imagemAnterior = atual.imagem_url;

        await atualizarVariante(
            {
                id: varianteId,
                produtoId,
                sku: dados.sku ?? atual.sku,
                tamanho:
                    dados.tamanho ?? atual.tamanho,
                cor: dados.cor ?? atual.cor,
                preco:
                    dados.preco ?? Number(atual.preco),
                estoque:
                    dados.estoque ?? Number(atual.estoque),
                imagemUrl:
                    dados.imagemUrl !== undefined
                        ? dados.imagemUrl
                        : atual.imagem_url,
                ativo:
                    dados.ativo !== undefined
                        ? dados.ativo
                        : Boolean(Number(atual.ativo))
            },
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        tratarDuplicidade(erro);
    } finally {
        conexao.release();
    }

    return {
        variante: montarVariante(
            await buscarVarianteAdmin(
                produtoId,
                varianteId
            )
        ),
        imagemAnterior
    };
}
