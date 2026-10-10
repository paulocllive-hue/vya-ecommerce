export class AppError extends Error {
    constructor(
        mensagem,
        statusCode = 400,
        codigo = "ERRO_DA_APLICACAO"
    ) {
        super(mensagem);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.codigo = codigo;

        Error.captureStackTrace?.(
            this,
            AppError
        );
    }
}