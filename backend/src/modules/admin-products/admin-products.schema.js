import { z } from "zod";


const identificadorUuid = z
    .string({ error: "O identificador deve ser um texto." })
    .trim()
    .uuid("O identificador informado é inválido.");


const texto = (nome, minimo, maximo) => z
    .string({ error: `${nome} deve ser um texto.` })
    .trim()
    .min(minimo, `${nome} deve possuir pelo menos ${minimo} caracteres.`)
    .max(maximo, `${nome} deve possuir no máximo ${maximo} caracteres.`)
    .transform((valor) => valor.replace(/\s+/g, " "));


const descricaoBase = z
    .string({ error: "A descrição deve ser um texto." })
    .trim()
    .max(3000, "A descrição deve possuir no máximo 3000 caracteres.")
    .transform((valor) => valor || null)
    .nullable();


const imagemUrlBase = z
    .string({ error: "O caminho da imagem deve ser um texto." })
    .trim()
    .max(500, "O caminho da imagem deve possuir no máximo 500 caracteres.")
    .refine((valor) => {
        if (!valor) {
            return true;
        }

        const minusculo = valor.toLowerCase();
        return !minusculo.startsWith("javascript:") &&
            !minusculo.startsWith("data:");
    }, "Informe uma URL HTTP/HTTPS ou um caminho relativo seguro.")
    .transform((valor) => valor || null)
    .nullable();


const varianteBase = {
    sku: texto("O SKU", 2, 80)
        .transform((valor) => valor.toUpperCase()),
    tamanho: texto("O tamanho", 1, 50),
    cor: texto("A cor", 1, 80),
    preco: z
        .number({ error: "O preço deve ser um número." })
        .positive("O preço precisa ser maior que zero.")
        .max(999999.99, "O preço informado é muito alto."),
    estoque: z
        .number({ error: "O estoque deve ser um número." })
        .int("O estoque deve ser um número inteiro.")
        .min(0, "O estoque não pode ser negativo.")
        .max(999999, "O estoque informado é muito alto."),
    imagemUrl: imagemUrlBase.optional().default(null),
    ativo: z
        .boolean({ error: "O campo ativo deve ser verdadeiro ou falso." })
        .default(true)
};


const varianteCriacaoSchema = z.strictObject(
    varianteBase
);


const produtoCriacaoSchema = z.strictObject({
    nome: texto("O nome", 2, 150),
    categoria: texto("A categoria", 2, 80),
    descricao: descricaoBase.optional().default(null),
    ativo: z
        .boolean({ error: "O campo ativo deve ser verdadeiro ou falso." })
        .default(true),
    varianteInicial: varianteCriacaoSchema
});


const produtoAtualizacaoSchema = z
    .strictObject({
        nome: texto("O nome", 2, 150).optional(),
        categoria: texto("A categoria", 2, 80).optional(),
        descricao: descricaoBase.optional(),
        ativo: z.boolean({
            error: "O campo ativo deve ser verdadeiro ou falso."
        }).optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, {
        message: "Informe pelo menos um campo para atualizar."
    });


const varianteAtualizacaoSchema = z
    .strictObject({
        sku: varianteBase.sku.optional(),
        tamanho: varianteBase.tamanho.optional(),
        cor: varianteBase.cor.optional(),
        preco: varianteBase.preco.optional(),
        estoque: varianteBase.estoque.optional(),
        imagemUrl: imagemUrlBase.optional(),
        ativo: z.boolean({
            error: "O campo ativo deve ser verdadeiro ou falso."
        }).optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, {
        message: "Informe pelo menos um campo para atualizar."
    });


const produtoIdSchema = z.strictObject({
    produtoId: identificadorUuid
});


const varianteIdSchema = z.strictObject({
    produtoId: identificadorUuid,
    varianteId: identificadorUuid
});


export const validarCriacaoProduto = (dados) =>
    produtoCriacaoSchema.safeParse(dados);

export const validarAtualizacaoProduto = (dados) =>
    produtoAtualizacaoSchema.safeParse(dados);

export const validarCriacaoVariante = (dados) =>
    varianteCriacaoSchema.safeParse(dados);

export const validarAtualizacaoVariante = (dados) =>
    varianteAtualizacaoSchema.safeParse(dados);

export const validarProdutoId = (dados) =>
    produtoIdSchema.safeParse(dados);

export const validarVarianteId = (dados) =>
    varianteIdSchema.safeParse(dados);
