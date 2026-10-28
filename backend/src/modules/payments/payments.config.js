// Etapa de preparação: registra a preferência, sem iniciar transações financeiras.
// A ativação real requer um adaptador do provedor, credenciais e webhooks validados.
export const METODOS_PAGAMENTO = Object.freeze([
    "pix", "cartao_credito", "cartao_debito", "boleto"
]);

const metodos = [
    { id: "pix", nome: "Pix", descricao: "Preferência por Pix. O QR Code será disponibilizado quando o pagamento online estiver ativo." },
    { id: "cartao_credito", nome: "Cartão de crédito", descricao: "Preferência por crédito. Bandeiras e parcelamento serão definidos na ativação." },
    { id: "cartao_debito", nome: "Cartão de débito", descricao: "Preferência por débito. A disponibilidade dependerá do provedor e do cartão." },
    { id: "boleto", nome: "Boleto", descricao: "Preferência por boleto. Nenhum boleto será emitido nesta etapa." }
];

export function obterConfiguracaoPagamento() {
    return {
        modo: "preparacao",
        cobrancaOnlineDisponivel: false,
        mensagem: "O pagamento online ainda não está disponível. Escolha sua preferência para registrá-la no pedido; nenhuma cobrança será realizada agora.",
        metodos: metodos.map((metodo) => ({ ...metodo }))
    };
}
