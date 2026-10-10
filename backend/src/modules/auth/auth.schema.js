import { z } from "zod";

/*
    Define o formato permitido para uma
    solicitação de cadastro.
*/
export const cadastroSchema = z
    .strictObject({
        nome: z
            .string({
                error: "O nome deve ser um texto."
            })
            .trim()
            .min(
                2,
                "O nome deve possuir pelo menos 2 caracteres."
            )
            .max(
                120,
                "O nome deve possuir no máximo 120 caracteres."
            )
            .transform((nome) => {
                /*
                    Substitui vários espaços seguidos
                    por apenas um espaço.
                */
                return nome.replace(/\s+/g, " ");
            }),

        email: z
            .string({
                error: "O e-mail deve ser um texto."
            })
            .trim()
            .toLowerCase()
            .max(
                254,
                "O e-mail deve possuir no máximo 254 caracteres."
            )
            .email(
                "Informe um endereço de e-mail válido."
            ),

        senha: z
            .string({
                error: "A senha deve ser um texto."
            })
            .min(
                15,
                "A senha deve possuir pelo menos 15 caracteres."
            )
            .max(
                128,
                "A senha deve possuir no máximo 128 caracteres."
            ),

        confirmacaoSenha: z
            .string({
                error: "A confirmação da senha é obrigatória."
            })
    })
    .refine(
        (dados) => {
            return dados.senha === dados.confirmacaoSenha;
        },
        {
            message: "As senhas não são iguais.",
            path: ["confirmacaoSenha"]
        }
    );

    /*
    Validação da entrada do login.
*/
export const loginSchema = z.strictObject({
    email: z
        .string({
            error: "O e-mail deve ser um texto."
        })
        .trim()
        .toLowerCase()
        .max(
            254,
            "O e-mail deve possuir no máximo 254 caracteres."
        )
        .email(
            "Informe um endereço de e-mail válido."
        ),

    senha: z
        .string({
            error: "A senha deve ser um texto."
        })
        .min(
            1,
            "A senha é obrigatória."
        )
        .max(
            128,
            "A senha deve possuir no máximo 128 caracteres."
        )
});

export function validarLogin(dados) {
    return loginSchema.safeParse(dados);
}

/*
    Executa a validação sem lançar uma exceção.

    O resultado possuirá:
    success: true  → dados aprovados
    success: false → dados rejeitados
*/
export function validarCadastro(dados) {
    return cadastroSchema.safeParse(dados);
}