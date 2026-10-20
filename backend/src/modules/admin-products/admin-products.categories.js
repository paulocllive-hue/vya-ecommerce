export const CATEGORIAS_PRODUTO = Object.freeze([
    {
        nome: "Fitness",
        prefixoSku: "FIT"
    },
    {
        nome: "Moda praia",
        prefixoSku: "PRAIA"
    },
    {
        nome: "Natação",
        prefixoSku: "NAT"
    },
    {
        nome: "Esportes aquáticos",
        prefixoSku: "AQUA"
    }
]);


export const NOMES_CATEGORIAS_PRODUTO =
    CATEGORIAS_PRODUTO.map(
        (categoria) => categoria.nome
    );


export function obterPrefixoSku(categoriaInformada) {
    const categoria = CATEGORIAS_PRODUTO.find(
        (item) => item.nome === categoriaInformada
    );

    return categoria?.prefixoSku ?? null;
}


export function calcularProximoSku(
    prefixo,
    skusExistentes = []
) {
    const padrao = new RegExp(
        `^VYA-${prefixo}-(\\d+)$`,
        "i"
    );
    const ultimoNumero = skusExistentes.reduce(
        (maior, sku) => {
            const correspondencia = sku.match(padrao);

            if (!correspondencia) {
                return maior;
            }

            return Math.max(
                maior,
                Number(correspondencia[1])
            );
        },
        0
    );
    const proximoNumero = String(ultimoNumero + 1)
        .padStart(3, "0");

    return `VYA-${prefixo}-${proximoNumero}`;
}
