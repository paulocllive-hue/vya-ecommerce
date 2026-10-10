export class AppError extends Error {
    constructor(
        mensagem,
        statusCode = 400,
        codigo = "ERRO_DA_APLICACAO",
        detalhes = null
    ) {
        super(mensagem);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.codigo = codigo;
        this.detalhes = detalhes;

        Error.captureStackTrace?.(
            this,
            AppError
        );
    }
}