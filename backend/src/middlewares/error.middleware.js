import { AppError } from "../errors/app-error.js";

/*
    Middleware centralizado de erros.

    Ele precisa possuir quatro parâmetros para
    o Express reconhecê-lo como tratador de erros.
*/
export function tratarErros(
    erro,
    requisicao,
    resposta,
    proximo
) {
    /*
        Trata JSON digitado incorretamente.
    */
    if (
        erro instanceof SyntaxError &&
        "body" in erro
    ) {
        return resposta.status(400).json({
            success: false,
            code: "JSON_INVALIDO",
            message: "O JSON enviado é inválido."
        });
    }

    /*
        Erros previstos pela nossa aplicação.
    */
    if (erro instanceof AppError) {
        const corpo = {
            success: false,
            code: erro.codigo,
            message: erro.message
        };

        if (erro.detalhes) {
            corpo.errors = erro.detalhes;
        }

        return resposta
            .status(erro.statusCode)
            .json(corpo);
    }

    /*
        O erro completo fica somente no servidor.

        O cliente não recebe SQL, caminhos,
        senhas ou informações internas.
    */
    console.error(erro);

    return resposta.status(500).json({
        success: false,
        code: "ERRO_INTERNO",
        message: "Ocorreu um erro interno."
    });
}