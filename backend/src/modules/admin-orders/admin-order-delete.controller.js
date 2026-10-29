import { z } from "zod";
import { AppError } from "../../errors/app-error.js";
import { validarPedidoId } from "./admin-orders.schema.js";
import { excluirPedidoTeste } from "./admin-order-delete.service.js";

export const confirmacaoExclusaoSchema = z.strictObject({
    confirmarPedidoTeste: z.literal(true),
    numeroPedido: z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
});

export async function excluirTeste(requisicao, resposta) {
    // A rota já exige autenticação e papel administrador; esta conferência
    // mantém a restrição mesmo se o controller for reutilizado futuramente.
    if (requisicao.autenticacao?.usuario?.papel !== "administrador") {
        throw new AppError("Esta função é exclusiva para administradores.", 403, "ACESSO_ADMINISTRATIVO_NECESSARIO");
    }
    if (!requisicao.is("application/json")) {
        throw new AppError("Envie a confirmação em JSON.", 415, "FORMATO_NAO_SUPORTADO");
    }
    const id = validarPedidoId(requisicao.params);
    const corpo = confirmacaoExclusaoSchema.safeParse(requisicao.body);
    if (!id.success || !corpo.success) {
        throw new AppError("Confirme o número do pedido e que ele foi criado exclusivamente para testes.", 422, "CONFIRMACAO_TESTE_INVALIDA");
    }
    const resultado = await excluirPedidoTeste(id.data.pedidoId, corpo.data);
    return resposta.status(200).json({
        success: true, message: "Pedido de teste excluído com sucesso.", data: resultado
    });
}
