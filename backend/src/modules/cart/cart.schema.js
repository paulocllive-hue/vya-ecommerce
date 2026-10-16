import { z } from "zod";


/*
    ============================================
    IDENTIFICADORES
    ============================================
*/

const identificadorUuidSchema = z
    .string({
        error:
            "O identificador deve ser um texto."
    })
    .trim()
    .uuid(
        "O identificador informado é inválido."
    );


/*
    ============================================
    ADICIONAR ITEM
    ============================================
*/

const adicionarItemSchema = z.strictObject({
    produtoVarianteId:
        identificadorUuidSchema,

    quantidade: z
        .number({
            error:
                "A quantidade deve ser um número."
        })
        .int(
            "A quantidade deve ser um número inteiro."
        )
        .min(
            1,
            "A quantidade mínima é 1."
        )
        .max(
            99,
            "A quantidade máxima é 99."
        )
        .default(1)
});


export function validarAdicaoItem(dados) {
    return adicionarItemSchema.safeParse(
        dados
    );
}


/*
    ============================================
    ATUALIZAR QUANTIDADE
    ============================================
*/

const atualizarQuantidadeSchema =
    z.strictObject({
        quantidade: z
            .number({
                error:
                    "A quantidade deve ser um número."
            })
            .int(
                "A quantidade deve ser um número inteiro."
            )
            .min(
                1,
                "A quantidade mínima é 1."
            )
            .max(
                99,
                "A quantidade máxima é 99."
            )
    });


export function validarAtualizacaoQuantidade(
    dados
) {
    return atualizarQuantidadeSchema.safeParse(
        dados
    );
}


/*
    ============================================
    IDENTIFICADOR DO ITEM NA URL
    ============================================
*/

const itemIdSchema = z.strictObject({
    itemId: identificadorUuidSchema
});


export function validarItemId(parametros) {
    return itemIdSchema.safeParse(
        parametros
    );
}