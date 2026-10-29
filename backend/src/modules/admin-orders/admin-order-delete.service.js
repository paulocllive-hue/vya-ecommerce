import { pool } from "../../config/database.js";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/app-error.js";

const STATUS_CONHECIDOS = new Set([
    "aguardando_pagamento", "pago", "em_preparacao", "pronto_para_retirada",
    "pronto_para_envio", "em_transporte", "concluido", "cancelado"
]);

export function exclusaoTestesDisponivel() {
    return ["development", "test"].includes(env.NODE_ENV);
}

export async function excluirPedidoTeste(pedidoId, confirmacao) {
    if (!exclusaoTestesDisponivel()) {
        throw new AppError("A exclusão de pedidos de teste está desativada em produção.", 403, "EXCLUSAO_TESTE_DESATIVADA");
    }
    if (confirmacao?.confirmarPedidoTeste !== true || !Number.isSafeInteger(confirmacao.numeroPedido)) {
        throw new AppError("Confirme que o pedido é exclusivamente de teste.", 422, "CONFIRMACAO_TESTE_NECESSARIA");
    }
    const conexao = await pool.getConnection();
    try {
        await conexao.beginTransaction();
        // O mesmo bloqueio é usado pelo fluxo de cancelamento. Assim, duas
        // requisições não podem devolver o estoque do mesmo pedido duas vezes.
        const [pedidos] = await conexao.execute(
            "SELECT id, numero_pedido, status FROM pedidos WHERE id = ? FOR UPDATE", [pedidoId]
        );
        const pedido = pedidos[0];
        if (!pedido) throw new AppError("Pedido não encontrado ou já excluído.", 404, "PEDIDO_NAO_ENCONTRADO");
        if (Number(pedido.numero_pedido) !== confirmacao.numeroPedido) {
            throw new AppError("A confirmação não corresponde ao pedido selecionado.", 409, "CONFIRMACAO_PEDIDO_DIVERGENTE");
        }
        if (!STATUS_CONHECIDOS.has(pedido.status)) {
            throw new AppError("Este pedido possui um estado que exige revisão antes da exclusão.", 409, "ESTADO_PEDIDO_DESCONHECIDO");
        }
        // Evita apagar por cascata registros de módulos futuros (pagamentos,
        // notas etc.). Somente pedido_itens é um vínculo permitido nesta versão.
        const [vinculos] = await conexao.execute(
            `SELECT TABLE_SCHEMA AS esquema, TABLE_NAME AS tabela, COLUMN_NAME AS coluna,
                    REFERENCED_COLUMN_NAME AS referencia
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
               AND REFERENCED_TABLE_NAME = 'pedidos' AND TABLE_NAME <> 'pedido_itens'`
        );
        for (const vinculo of vinculos) {
            const identificador = (valor) => "`" + String(valor).replaceAll("`", "``") + "`";
            if (!["id", "numero_pedido"].includes(vinculo.referencia)) {
                throw new AppError("O pedido possui um vínculo que exige revisão.", 409, "PEDIDO_COM_VINCULOS");
            }
            const [registros] = await conexao.execute(
                `SELECT 1 FROM ${identificador(vinculo.esquema)}.${identificador(vinculo.tabela)} WHERE ${identificador(vinculo.coluna)} = ? LIMIT 1 FOR UPDATE`,
                [pedido[vinculo.referencia]]
            );
            if (registros.length) throw new AppError("O pedido possui registros vinculados e não pode ser excluído por esta função.", 409, "PEDIDO_COM_VINCULOS");
        }
        const [itens] = await conexao.execute(
            "SELECT produto_variante_id, quantidade FROM pedido_itens WHERE pedido_id = ? ORDER BY produto_variante_id FOR UPDATE", [pedidoId]
        );
        if (pedido.status !== "cancelado") {
            for (const item of itens) {
                const quantidade = Number(item.quantidade);
                if (!Number.isSafeInteger(quantidade) || quantidade <= 0 || !item.produto_variante_id) {
                    throw new AppError("Não foi possível conferir o estoque deste pedido.", 409, "ESTOQUE_TESTE_INVALIDO");
                }
                const [resultado] = await conexao.execute(
                    "UPDATE produto_variantes SET estoque = estoque + ? WHERE id = ?",
                    [quantidade, item.produto_variante_id]
                );
                if (resultado.affectedRows !== 1) throw new AppError("A variação do produto não foi encontrada. Nenhum dado foi excluído.", 409, "VARIANTE_NAO_ENCONTRADA");
            }
        }
        await conexao.execute("DELETE FROM pedido_itens WHERE pedido_id = ?", [pedidoId]);
        const [resultado] = await conexao.execute("DELETE FROM pedidos WHERE id = ?", [pedidoId]);
        if (resultado.affectedRows !== 1) throw new AppError("Não foi possível excluir o pedido.", 409, "EXCLUSAO_PEDIDO_FALHOU");
        await conexao.commit();
        return { pedidoId, numeroPedido: Number(pedido.numero_pedido) };
    } catch (erro) {
        await conexao.rollback();
        if (["ER_ROW_IS_REFERENCED", "ER_ROW_IS_REFERENCED_2"].includes(erro.code)) {
            throw new AppError("O pedido possui registros vinculados. A exclusão foi desfeita.", 409, "PEDIDO_COM_VINCULOS");
        }
        throw erro;
    } finally {
        conexao.release();
    }
}
