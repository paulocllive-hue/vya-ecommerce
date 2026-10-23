import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import multer from "multer";

import { AppError } from "../errors/app-error.js";


export const diretorioImagensProdutos = fileURLToPath(
    new URL("../../uploads/produtos/", import.meta.url)
);

mkdirSync(diretorioImagensProdutos, {
    recursive: true
});


const extensoesPorMime = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"]
]);


const armazenamento = multer.diskStorage({
    destination(requisicao, arquivo, concluir) {
        concluir(null, diretorioImagensProdutos);
    },

    filename(requisicao, arquivo, concluir) {
        const extensao = extensoesPorMime.get(
            arquivo.mimetype
        );

        concluir(
            null,
            `${Date.now()}-${randomUUID()}${extensao}`
        );
    }
});


const upload = multer({
    storage: armazenamento,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 10
    },
    fileFilter(requisicao, arquivo, concluir) {
        if (!extensoesPorMime.has(arquivo.mimetype)) {
            concluir(
                new AppError(
                    "A imagem deve estar no formato JPG, PNG ou WebP.",
                    422,
                    "FORMATO_DE_IMAGEM_INVALIDO"
                )
            );
            return;
        }

        concluir(null, true);
    }
});


export function receberImagemProduto(
    requisicao,
    resposta,
    proximo
) {
    upload.single("imagem")(
        requisicao,
        resposta,
        (erro) => {
            if (!erro) {
                proximo();
                return;
            }

            if (
                erro instanceof multer.MulterError &&
                erro.code === "LIMIT_FILE_SIZE"
            ) {
                proximo(
                    new AppError(
                        "A imagem deve possuir no máximo 5 MB.",
                        422,
                        "IMAGEM_MUITO_GRANDE"
                    )
                );
                return;
            }

            if (erro instanceof AppError) {
                proximo(erro);
                return;
            }

            proximo(
                new AppError(
                    "Não foi possível receber a imagem do produto.",
                    400,
                    "FALHA_NO_UPLOAD_DA_IMAGEM"
                )
            );
        }
    );
}
