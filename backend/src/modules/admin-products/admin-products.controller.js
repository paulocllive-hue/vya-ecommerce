import { unlink } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

import { AppError } from "../../errors/app-error.js";
import {
    diretorioImagensProdutos
} from "../../middlewares/product-image-upload.middleware.js";

import {
    validarAtualizacaoProduto,
    validarAtualizacaoVariante,
    validarConsultaProximoSku,
    validarCriacaoProduto,
    validarCriacaoVariante,
    validarProdutoId,
    validarVarianteId
} from "./admin-products.schema.js";

import {
    criarProduto,
    criarVariante,
    editarProduto,
    editarVariante,
    obterCategoriasProduto,
    obterProximoSku,
    obterProdutosAdmin,
    removerProduto
} from "./admin-products.service.js";


function exigirValidacao(validacao, mensagem) {
    if (!validacao.success) {
        throw new AppError(
            mensagem,
            422,
            "DADOS_INVALIDOS",
            validacao.error.flatten().fieldErrors
        );
    }

    return validacao.data;
}


function interpretarDadosDoProduto(requisicao) {
    if (typeof requisicao.body?.dados !== "string") {
        return requisicao.body;
    }

    try {
        return JSON.parse(requisicao.body.dados);
    } catch {
        throw new AppError(
            "Os dados enviados junto com a imagem são inválidos.",
            400,
            "DADOS_MULTIPART_INVALIDOS"
        );
    }
}


function montarUrlDaImagem(requisicao) {
    const nomeSeguro = encodeURIComponent(
        requisicao.file.filename
    );

    return `${requisicao.protocol}://${requisicao.get("host")}` +
        `/uploads/produtos/${nomeSeguro}`;
}


async function removerUploadEmCasoDeErro(arquivo) {
    if (!arquivo?.path) {
        return;
    }

    try {
        await unlink(arquivo.path);
    } catch (erro) {
        if (erro.code !== "ENOENT") {
            console.error(
                "Não foi possível remover um upload incompleto:",
                erro
            );
        }
    }
}


async function removerImagemGerenciada(imagemUrl) {
    if (!imagemUrl) {
        return;
    }

    try {
        const caminhoUrl = new URL(
            imagemUrl,
            "http://localhost"
        ).pathname;
        const prefixo = "/uploads/produtos/";

        if (!caminhoUrl.startsWith(prefixo)) {
            return;
        }

        const nomeArquivo = decodeURIComponent(
            caminhoUrl.slice(prefixo.length)
        );

        if (
            !nomeArquivo ||
            basename(nomeArquivo) !== nomeArquivo
        ) {
            return;
        }

        const diretorioSeguro =
            `${resolve(diretorioImagensProdutos)}${sep}`;
        const caminhoArquivo = resolve(
            diretorioImagensProdutos,
            nomeArquivo
        );

        if (!caminhoArquivo.startsWith(diretorioSeguro)) {
            return;
        }

        await unlink(caminhoArquivo);
    } catch (erro) {
        if (erro.code !== "ENOENT") {
            console.error(
                "Não foi possível remover a imagem substituída:",
                erro
            );
        }
    }
}


export async function listarProdutos(
    requisicao,
    resposta
) {
    const produtos = await obterProdutosAdmin();

    return resposta.status(200).json({
        success: true,
        message: "Produtos administrativos consultados.",
        data: {
            produtos,
            categorias: obterCategoriasProduto()
        }
    });
}


export async function consultarProximoSku(
    requisicao,
    resposta
) {
    const consulta = exigirValidacao(
        validarConsultaProximoSku(requisicao.query),
        "Selecione uma categoria válida para gerar o SKU."
    );

    const sku = await obterProximoSku(
        consulta.categoria
    );

    return resposta.status(200).json({
        success: true,
        message: "Próximo SKU calculado com sucesso.",
        data: { sku }
    });
}


export async function cadastrarProduto(
    requisicao,
    resposta
) {
    try {
        if (!requisicao.file) {
            throw new AppError(
                "Selecione uma imagem para o novo produto.",
                422,
                "IMAGEM_DO_PRODUTO_OBRIGATORIA"
            );
        }

        const corpo = interpretarDadosDoProduto(
            requisicao
        );

        const dados = exigirValidacao(
            validarCriacaoProduto({
                ...corpo,
                varianteInicial: {
                    ...corpo?.varianteInicial,
                    imagemUrl: montarUrlDaImagem(
                        requisicao
                    )
                }
            }),
            "Os dados do produto são inválidos."
        );

        const produto = await criarProduto(dados);

        return resposta.status(201).json({
            success: true,
            message: "Produto e imagem cadastrados com sucesso.",
            data: { produto }
        });
    } catch (erro) {
        await removerUploadEmCasoDeErro(
            requisicao.file
        );
        throw erro;
    }
}


export async function atualizarProduto(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarProdutoId(requisicao.params),
        "O identificador do produto é inválido."
    );

    const dados = exigirValidacao(
        validarAtualizacaoProduto(requisicao.body),
        "Os dados do produto são inválidos."
    );

    const produto = await editarProduto(
        parametros.produtoId,
        dados
    );

    return resposta.status(200).json({
        success: true,
        message: "Produto atualizado com sucesso.",
        data: { produto }
    });
}


export async function excluirProduto(
    requisicao,
    resposta
) {
    const parametros = exigirValidacao(
        validarProdutoId(requisicao.params),
        "O identificador do produto é inválido."
    );

    const produto = await removerProduto(
        parametros.produtoId
    );

    return resposta.status(200).json({
        success: true,
        message: "Produto excluído definitivamente.",
        data: { produto }
    });
}


export async function cadastrarVariante(
    requisicao,
    resposta
) {
    try {
        const parametros = exigirValidacao(
            validarProdutoId(requisicao.params),
            "O identificador do produto é inválido."
        );

        const corpo = interpretarDadosDoProduto(
            requisicao
        );
        const dados = exigirValidacao(
            validarCriacaoVariante({
                ...corpo,
                ...(requisicao.file
                    ? {
                        imagemUrl: montarUrlDaImagem(
                            requisicao
                        )
                    }
                    : {})
            }),
            "Os dados da variante são inválidos."
        );

        const variante = await criarVariante(
            parametros.produtoId,
            dados
        );

        return resposta.status(201).json({
            success: true,
            message: "Variante cadastrada com sucesso.",
            data: { variante }
        });
    } catch (erro) {
        await removerUploadEmCasoDeErro(
            requisicao.file
        );
        throw erro;
    }
}


export async function atualizarVariante(
    requisicao,
    resposta
) {
    try {
        const parametros = exigirValidacao(
            validarVarianteId(requisicao.params),
            "Os identificadores informados são inválidos."
        );

        const corpo = interpretarDadosDoProduto(
            requisicao
        );
        const novaImagemUrl = requisicao.file
            ? montarUrlDaImagem(requisicao)
            : null;
        const dados = exigirValidacao(
            validarAtualizacaoVariante({
                ...corpo,
                ...(novaImagemUrl
                    ? { imagemUrl: novaImagemUrl }
                    : {})
            }),
            "Os dados da variante são inválidos."
        );

        const resultado = await editarVariante(
            parametros.produtoId,
            parametros.varianteId,
            dados
        );

        if (
            novaImagemUrl &&
            resultado.imagemAnterior !== novaImagemUrl
        ) {
            await removerImagemGerenciada(
                resultado.imagemAnterior
            );
        }

        return resposta.status(200).json({
            success: true,
            message: "Variante atualizada com sucesso.",
            data: { variante: resultado.variante }
        });
    } catch (erro) {
        await removerUploadEmCasoDeErro(
            requisicao.file
        );
        throw erro;
    }
}
