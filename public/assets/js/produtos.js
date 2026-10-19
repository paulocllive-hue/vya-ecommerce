(() => {
    const URL_CARRINHO =
        "http://localhost:3000/api/carrinho";

    const botoesAdicionar =
        document.querySelectorAll(
            ".adicionar-carrinho[data-variante-id]"
        );


    async function adicionarProduto(
        evento
    ) {
        const botao =
            evento.currentTarget;

        const produtoVarianteId =
            botao.dataset.varianteId;

        const textoOriginal =
            botao.textContent.trim();

        botao.disabled = true;
        botao.textContent =
            "Adicionando...";

        try {
            const resposta = await fetch(
                `${URL_CARRINHO}/itens`,
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json"
                    },

                    body: JSON.stringify({
                        produtoVarianteId,
                        quantidade: 1
                    })
                }
            );

            const resultado =
                await resposta.json();

            if (resposta.status === 401) {
                const botaoConta =
                    document.querySelector(
                        "#botao-conta"
                    );

                botaoConta?.click();

                throw new Error(
                    "Entre na sua conta para adicionar produtos."
                );
            }

            if (!resposta.ok) {
                throw new Error(
                    resultado.message ||
                    "Não foi possível adicionar o produto."
                );
            }

            const carrinho =
                resultado.data.carrinho;

            window.CarrinhoVya
                ?.atualizarContador(
                    carrinho
                );

            botao.textContent =
                "Produto adicionado";

            window.setTimeout(() => {
                botao.textContent =
                    textoOriginal;

                botao.disabled = false;
            }, 1500);
        } catch (erro) {
            alert(erro.message);

            botao.textContent =
                textoOriginal;

            botao.disabled = false;
        }
    }


    botoesAdicionar.forEach(
        (botao) => {
            botao.addEventListener(
                "click",
                adicionarProduto
            );
        }
    );
})();