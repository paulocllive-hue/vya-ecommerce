import { z } from "zod";


const identificadorUuidSchema = z
    .string({
        error: "O identificador deve ser um texto."
    })
    .trim()
    .uuid("O identificador informado é inválido.");


const cepSchema = z
    .string({
        error: "O CEP deve ser um texto."
    })
    .trim()
    .transform((cep) => {
        return cep.replace(/\D/g, "");
    })
    .refine((cep) => /^\d{8}$/.test(cep), {
        message: "Informe um CEP válido com 8 números."
    });


const textoObrigatorio = (
    nome,
    minimo,
    maximo
) => z
    .string({
        error: `${nome} deve ser um texto.`
    })
    .trim()
    .min(
        minimo,
        `${nome} deve possuir pelo menos ${minimo} caracteres.`
    )
    .max(
        maximo,
        `${nome} deve possuir no máximo ${maximo} caracteres.`
    )
    .transform((valor) => {
        return valor.replace(/\s+/g, " ");
    });


const textoOpcional = (nome, maximo) => z
    .string({
        error: `${nome} deve ser um texto.`
    })
    .trim()
    .max(
        maximo,
        `${nome} deve possuir no máximo ${maximo} caracteres.`
    )
    .transform((valor) => {
        const texto = valor.replace(/\s+/g, " ");
        return texto || null;
    })
    .nullable()
    .optional()
    .default(null);


const enderecoSchema = z.strictObject({
    nomeDestinatario:
        textoObrigatorio(
            "O nome do destinatário",
            2,
            120
        ),

    cep: cepSchema,

    logradouro:
        textoObrigatorio(
            "O logradouro",
            2,
            180
        ),

    numero:
        textoObrigatorio(
            "O número",
            1,
            20
        ),

    complemento:
        textoOpcional(
            "O complemento",
            120
        ),

    bairro:
        textoObrigatorio(
            "O bairro",
            2,
            100
        ),

    cidade:
        textoObrigatorio(
            "A cidade",
            2,
            100
        ),

    estado: z
        .string({
            error: "O estado deve ser um texto."
        })
        .trim()
        .length(
            2,
            "Informe a sigla do estado."
        )
        .toUpperCase(),

    referencia:
        textoOpcional(
            "A referência",
            180
        ),

    principal: z
        .boolean({
            error: "O campo principal deve ser verdadeiro ou falso."
        })
        .default(false)
});


const finalizarCheckoutSchema = z
    .strictObject({
        metodoEntrega: z.enum(
            [
                "retirada",
                "entrega_propria"
            ],
            {
                error: "O método de entrega é inválido."
            }
        ),

        enderecoId: identificadorUuidSchema
            .nullable()
            .optional()
            .default(null)
    })
    .superRefine((dados, contexto) => {
        if (
            dados.metodoEntrega ===
                "entrega_propria" &&
            !dados.enderecoId
        ) {
            contexto.addIssue({
                code: "custom",
                path: ["enderecoId"],
                message:
                    "Escolha um endereço para a entrega."
            });
        }
    });


const enderecoIdSchema = z.strictObject({
    enderecoId: identificadorUuidSchema
});


const pedidoIdSchema = z.strictObject({
    pedidoId: identificadorUuidSchema
});


export function validarEndereco(dados) {
    return enderecoSchema.safeParse(dados);
}


export function validarFinalizacao(dados) {
    return finalizarCheckoutSchema.safeParse(dados);
}


export function validarEnderecoId(parametros) {
    return enderecoIdSchema.safeParse(parametros);
}


export function validarPedidoId(parametros) {
    return pedidoIdSchema.safeParse(parametros);
}
