import { randomUUID } from "node:crypto";

import { env } from "../../config/env.js";
import { pool } from "../../config/database.js";
import { AppError } from "../../errors/app-error.js";

import {
    baixarEstoqueVariante,
    buscarConfiguracaoEntrega,
    buscarEnderecoUsuario,
    buscarFaixaEntrega,
    buscarItensParaFinalizacao,
    buscarPedidoUsuario,
    cidadeEstaAtendida,
    contarEnderecosUsuario,
    desmarcarEnderecosPrincipais,
    esvaziarCarrinhoNaFinalizacao,
    inserirEndereco,
    inserirItemPedido,
    inserirPedido,
    listarEnderecosUsuario,
    listarItensPedido,
    listarPedidosUsuario,
    removerEnderecoUsuario
} from "./checkout.repository.js";


const URL_GOOGLE_ROUTES =
    "https://routes.googleapis.com/directions/v2:computeRoutes";


function montarEndereco(linha) {
    return {
        id: linha.id,
        nomeDestinatario:
            linha.nome_destinatario,
        cep: linha.cep,
        logradouro: linha.logradouro,
        numero: linha.numero,
        complemento: linha.complemento,
        bairro: linha.bairro,
        cidade: linha.cidade,
        estado: linha.estado,
        referencia: linha.referencia,
        principal: Boolean(
            Number(linha.principal)
        )
    };
}


function montarItemPedido(linha) {
    return {
        id: linha.id,
        produtoId: linha.produto_id,
        produtoVarianteId:
            linha.produto_variante_id,
        nome: linha.nome_produto,
        sku: linha.sku,
        tamanho: linha.tamanho,
        cor: linha.cor,
        precoUnitario:
            Number(linha.preco_unitario),
        quantidade:
            Number(linha.quantidade),
        subtotal:
            Number(linha.subtotal)
    };
}


function montarPedido(linha, itens = undefined) {
    const pedido = {
        id: linha.id,
        numeroPedido:
            Number(linha.numero_pedido),
        status: linha.status,
        statusPagamento:
            linha.status_pagamento,
        metodoPagamento:
            linha.metodo_pagamento,
        metodoEntrega:
            linha.metodo_entrega,
        subtotal: Number(linha.subtotal),
        valorFrete:
            Number(linha.valor_frete),
        desconto: Number(linha.desconto),
        total: Number(linha.total),
        statusEntrega:
            linha.status_entrega,
        distanciaEntregaKm:
            linha.distancia_entrega_km === null
                ? null
                : Number(linha.distancia_entrega_km),
        prazoEntregaDiasUteis:
            linha.prazo_entrega_dias_uteis === null
                ? null
                : Number(
                    linha.prazo_entrega_dias_uteis
                ),
        dataPrevistaEntrega:
            linha.data_prevista_entrega,
        criadoEm: linha.criado_em,
        atualizadoEm: linha.atualizado_em
    };

    if (itens) {
        pedido.itens = itens.map(
            montarItemPedido
        );
    }

    return pedido;
}


export async function obterEnderecos(
    usuarioId
) {
    const linhas = await listarEnderecosUsuario(
        usuarioId
    );

    return linhas.map(montarEndereco);
}


export async function cadastrarEndereco(
    usuarioId,
    dados
) {
    const atendida = await cidadeEstaAtendida(
        dados.cidade,
        dados.estado
    );

    if (!atendida) {
        throw new AppError(
            "No momento, as entregas estão disponíveis somente em Cuiabá e Várzea Grande.",
            422,
            "CIDADE_NAO_ATENDIDA"
        );
    }

    const conexao = await pool.getConnection();
    const enderecoId = randomUUID();

    try {
        await conexao.beginTransaction();

        const totalEnderecos =
            await contarEnderecosUsuario(
                usuarioId,
                conexao
            );

        const principal =
            dados.principal ||
            totalEnderecos === 0;

        if (principal) {
            await desmarcarEnderecosPrincipais(
                usuarioId,
                conexao
            );
        }

        await inserirEndereco(
            {
                id: enderecoId,
                usuarioId,
                ...dados,
                principal
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

    const enderecos = await obterEnderecos(
        usuarioId
    );

    return enderecos.find(
        (endereco) => endereco.id === enderecoId
    );
}


export async function excluirEndereco(
    usuarioId,
    enderecoId
) {
    const removido = await removerEnderecoUsuario(
        enderecoId,
        usuarioId
    );

    if (!removido) {
        throw new AppError(
            "Endereço não encontrado.",
            404,
            "ENDERECO_NAO_ENCONTRADO"
        );
    }
}


export function integracaoEntregaDisponivel() {
    return Boolean(
        env.GOOGLE_MAPS_API_KEY &&
        env.ENTREGA_ENDERECO_ORIGEM
    );
}


function montarEnderecoParaRota(endereco) {
    const complemento = endereco.complemento
        ? `, ${endereco.complemento}`
        : "";

    return [
        `${endereco.logradouro}, ${endereco.numero}${complemento}`,
        endereco.bairro,
        `${endereco.cidade} - ${endereco.estado}`,
        endereco.cep,
        "Brasil"
    ].join(", ");
}


async function calcularDistanciaEmKm(endereco) {
    let resposta;

    try {
        resposta = await fetch(
            URL_GOOGLE_ROUTES,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    "X-Goog-Api-Key":
                        env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask":
                        "routes.distanceMeters"
                },
                body: JSON.stringify({
                    origin: {
                        address:
                            env.ENTREGA_ENDERECO_ORIGEM
                    },
                    destination: {
                        address:
                            montarEnderecoParaRota(
                                endereco
                            )
                    },
                    travelMode: "DRIVE",
                    routingPreference:
                        "TRAFFIC_UNAWARE",
                    languageCode: "pt-BR",
                    units: "METRIC"
                }),
                signal: AbortSignal.timeout(10000)
            }
        );
    } catch {
        throw new AppError(
            "Não foi possível consultar a distância da entrega. Tente novamente.",
            502,
            "FALHA_CALCULO_DISTANCIA"
        );
    }

    if (!resposta.ok) {
        throw new AppError(
            "A API de rotas não conseguiu calcular a entrega. Verifique a configuração da chave.",
            502,
            "FALHA_API_ROTAS"
        );
    }

    const dados = await resposta.json();
    const distanciaMetros =
        Number(dados.routes?.[0]?.distanceMeters);

    if (
        !Number.isFinite(distanciaMetros) ||
        distanciaMetros <= 0
    ) {
        throw new AppError(
            "Não foi possível calcular uma rota até o endereço informado.",
            422,
            "ROTA_NAO_ENCONTRADA"
        );
    }

    return Math.ceil(distanciaMetros / 10) / 100;
}


function calcularDataPrevista(diasUteis) {
    const partes = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "America/Cuiaba",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).formatToParts(new Date());

    const valor = (tipo) => Number(
        partes.find((parte) => {
            return parte.type === tipo;
        }).value
    );

    const data = new Date(Date.UTC(
        valor("year"),
        valor("month") - 1,
        valor("day")
    ));

    let adicionados = 0;

    while (adicionados < diasUteis) {
        data.setUTCDate(data.getUTCDate() + 1);

        const diaSemana = data.getUTCDay();

        if (diaSemana !== 0 && diaSemana !== 6) {
            adicionados += 1;
        }
    }

    return data.toISOString().slice(0, 10);
}


async function prepararEntrega(
    usuarioId,
    metodoEntrega,
    enderecoId,
    executor
) {
    if (metodoEntrega === "retirada") {
        const configuracao =
            await buscarConfiguracaoEntrega(
                executor
            );

        if (
            configuracao &&
            !Number(configuracao.permite_retirada)
        ) {
            throw new AppError(
                "A retirada não está disponível no momento.",
                422,
                "RETIRADA_INDISPONIVEL"
            );
        }

        return {
            enderecoId: null,
            endereco: null,
            destinatario: null,
            valorFrete: 0,
            distanciaEntregaKm: null,
            prazoEntregaDiasUteis: null,
            dataPrevistaEntrega: null,
            statusEntrega:
                "aguardando_retirada"
        };
    }

    if (!integracaoEntregaDisponivel()) {
        throw new AppError(
            "O cálculo automático da entrega ainda não está disponível. Escolha a retirada gratuita.",
            503,
            "CALCULO_ENTREGA_INDISPONIVEL"
        );
    }

    const endereco = await buscarEnderecoUsuario(
        enderecoId,
        usuarioId,
        executor
    );

    if (!endereco) {
        throw new AppError(
            "O endereço de entrega não foi encontrado.",
            404,
            "ENDERECO_NAO_ENCONTRADO"
        );
    }

    const atendida = await cidadeEstaAtendida(
        endereco.cidade,
        endereco.estado,
        executor
    );

    if (!atendida) {
        throw new AppError(
            "No momento, as entregas estão disponíveis somente em Cuiabá e Várzea Grande.",
            422,
            "CIDADE_NAO_ATENDIDA"
        );
    }

    const configuracao =
        await buscarConfiguracaoEntrega(executor);

    if (!configuracao) {
        throw new AppError(
            "A configuração de entrega não está ativa.",
            503,
            "ENTREGA_NAO_CONFIGURADA"
        );
    }

    const distanciaEntregaKm =
        await calcularDistanciaEmKm(endereco);

    const faixa = await buscarFaixaEntrega(
        distanciaEntregaKm,
        executor
    );

    if (!faixa) {
        throw new AppError(
            "O endereço está fora da área atendida.",
            422,
            "FORA_DA_AREA_DE_ENTREGA"
        );
    }

    const prazoEntregaDiasUteis = Number(
        configuracao.prazo_dias_uteis
    );

    return {
        enderecoId: endereco.id,
        endereco,
        destinatario:
            endereco.nome_destinatario,
        valorFrete: Number(faixa.valor),
        distanciaEntregaKm,
        prazoEntregaDiasUteis,
        dataPrevistaEntrega:
            calcularDataPrevista(
                prazoEntregaDiasUteis
            ),
        statusEntrega: "aguardando_envio"
    };
}


export async function calcularEntregaUsuario(
    usuarioId,
    enderecoId
) {
    const entrega = await prepararEntrega(
        usuarioId,
        "entrega_propria",
        enderecoId,
        pool
    );

    return {
        enderecoId: entrega.enderecoId,
        distanciaKm:
            entrega.distanciaEntregaKm,
        valor: entrega.valorFrete,
        prazoDiasUteis:
            entrega.prazoEntregaDiasUteis,
        dataPrevista:
            entrega.dataPrevistaEntrega
    };
}


export async function finalizarPedido(
    usuario,
    {
        metodoEntrega,
        enderecoId,
        metodoPagamento
    }
) {
    const conexao = await pool.getConnection();
    const pedidoId = randomUUID();

    try {
        await conexao.beginTransaction();

        const entrega = await prepararEntrega(
            usuario.id,
            metodoEntrega,
            enderecoId,
            conexao
        );

        const itens =
            await buscarItensParaFinalizacao(
                usuario.id,
                conexao
            );

        if (itens.length === 0) {
            throw new AppError(
                "O carrinho está vazio.",
                422,
                "CARRINHO_VAZIO"
            );
        }

        let subtotalCentavos = 0;

        for (const item of itens) {
            const quantidade =
                Number(item.quantidade);

            const estoque =
                Number(item.estoque);

            if (
                !Number(item.produto_ativo) ||
                !Number(item.variante_ativa)
            ) {
                throw new AppError(
                    `O produto ${item.nome} não está mais disponível.`,
                    409,
                    "PRODUTO_INDISPONIVEL"
                );
            }

            if (quantidade > estoque) {
                throw new AppError(
                    `Não há estoque suficiente para ${item.nome}.`,
                    409,
                    "ESTOQUE_INSUFICIENTE"
                );
            }

            const precoCentavos = Math.round(
                Number(item.preco) * 100
            );

            subtotalCentavos +=
                precoCentavos * quantidade;
        }

        const subtotal =
            subtotalCentavos / 100;

        const totalCentavos =
            subtotalCentavos +
            Math.round(
                entrega.valorFrete * 100
            );

        await inserirPedido(
            {
                id: pedidoId,
                usuarioId: usuario.id,
                enderecoId:
                    entrega.enderecoId,
                metodoEntrega,
                metodoPagamento,
                destinatario:
                    entrega.destinatario ??
                    usuario.nome,
                subtotal,
                valorFrete:
                    entrega.valorFrete,
                total: totalCentavos / 100,
                distanciaEntregaKm:
                    entrega.distanciaEntregaKm,
                prazoEntregaDiasUteis:
                    entrega.prazoEntregaDiasUteis,
                dataPrevistaEntrega:
                    entrega.dataPrevistaEntrega,
                statusEntrega:
                    entrega.statusEntrega,
                endereco: entrega.endereco
            },
            conexao
        );

        for (const item of itens) {
            const quantidade =
                Number(item.quantidade);

            const precoCentavos = Math.round(
                Number(item.preco) * 100
            );

            const precoUnitario =
                precoCentavos / 100;

            const subtotalItem =
                (precoCentavos * quantidade) / 100;

            await inserirItemPedido(
                {
                    id: randomUUID(),
                    pedidoId,
                    produtoId: item.produto_id,
                    produtoVarianteId:
                        item.produto_variante_id,
                    nomeProduto: item.nome,
                    sku: item.sku,
                    tamanho: item.tamanho,
                    cor: item.cor,
                    precoUnitario,
                    quantidade,
                    subtotal: subtotalItem
                },
                conexao
            );

            const estoqueAtualizado =
                await baixarEstoqueVariante(
                    item.produto_variante_id,
                    quantidade,
                    conexao
                );

            if (!estoqueAtualizado) {
                throw new AppError(
                    `O estoque de ${item.nome} foi alterado durante a compra.`,
                    409,
                    "ESTOQUE_ALTERADO"
                );
            }
        }

        await esvaziarCarrinhoNaFinalizacao(
            itens[0].carrinho_id,
            conexao
        );

        await conexao.commit();
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }

    return obterPedido(
        usuario.id,
        pedidoId
    );
}


export async function obterPedido(
    usuarioId,
    pedidoId
) {
    const pedido = await buscarPedidoUsuario(
        pedidoId,
        usuarioId
    );

    if (!pedido) {
        throw new AppError(
            "Pedido não encontrado.",
            404,
            "PEDIDO_NAO_ENCONTRADO"
        );
    }

    const itens = await listarItensPedido(
        pedidoId
    );

    return montarPedido(pedido, itens);
}


export async function obterPedidos(
    usuarioId
) {
    const linhas = await listarPedidosUsuario(
        usuarioId
    );

    return linhas.map((linha) => {
        return montarPedido(linha);
    });
}
