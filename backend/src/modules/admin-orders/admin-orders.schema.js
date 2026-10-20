import { z } from "zod";


const pedidoIdSchema = z.strictObject({
    pedidoId: z
        .string({
            error: "O identificador deve ser um texto."
        })
        .trim()
        .uuid("O identificador do pedido é inválido.")
});


const atualizarPedidoSchema = z.strictObject({
    acao: z.enum(
        [
            "confirmar_pagamento",
            "iniciar_preparacao",
            "marcar_pronto",
            "iniciar_entrega",
            "concluir",
            "cancelar"
        ],
        {
            error: "A ação informada é inválida."
        }
    )
});


export function validarPedidoId(parametros) {
    return pedidoIdSchema.safeParse(parametros);
}


export function validarAtualizacaoPedido(dados) {
    return atualizarPedidoSchema.safeParse(dados);
}
