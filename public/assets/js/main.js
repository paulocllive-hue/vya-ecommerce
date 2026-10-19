/*
    ========================================
    ELEMENTOS COMPARTILHADOS
    ========================================
*/

const botaoMenu =
    document.querySelector("#menu-botao");

const menuPrincipal =
    document.querySelector("#menu-principal");

const quantidadeCarrinho =
    document.querySelector(
        "#quantidade-carrinho"
    );

const anoAtual =
    document.querySelector("#ano-atual");

const bannerImagem =
    document.querySelector("#banner-imagem");

const API_CARRINHO_URL =
    "http://localhost:3000/api/carrinho";


/*
    ========================================
    MENU DO CELULAR
    ========================================
*/

if (botaoMenu && menuPrincipal) {
    botaoMenu.addEventListener(
        "click",
        () => {
            const menuEstaAberto =
                menuPrincipal.classList.toggle(
                    "menu--aberto"
                );

            botaoMenu.setAttribute(
                "aria-expanded",
                String(menuEstaAberto)
            );
        }
    );

    const linksMenu =
        menuPrincipal.querySelectorAll("a");

    linksMenu.forEach((link) => {
        link.addEventListener(
            "click",
            () => {
                menuPrincipal.classList.remove(
                    "menu--aberto"
                );

                botaoMenu.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        );
    });
}


/*
    ========================================
    CONTADOR DO CARRINHO
    ========================================
*/

function atualizarContadorCarrinho(
    carrinho
) {
    if (!quantidadeCarrinho) {
        return;
    }

    quantidadeCarrinho.textContent =
        String(
            carrinho?.quantidadeTotal ?? 0
        );
}


/*
    Consulta o carrinho vinculado à conta.

    Quando não existe uma sessão, o contador
    permanece zerado.
*/
async function carregarCarrinhoDaConta() {
    try {
        const resposta = await fetch(
            API_CARRINHO_URL,
            {
                method: "GET",
                credentials: "include",

                headers: {
                    Accept: "application/json"
                }
            }
        );

        const resultado =
            await resposta.json();

        if (resposta.status === 401) {
            atualizarContadorCarrinho(null);
            return null;
        }

        if (!resposta.ok) {
            throw new Error(
                resultado.message ||
                "Não foi possível consultar o carrinho."
            );
        }

        const carrinho =
            resultado.data.carrinho;

        atualizarContadorCarrinho(
            carrinho
        );

        return carrinho;
    } catch (erro) {
        atualizarContadorCarrinho(null);

        console.error(
            "Não foi possível carregar o carrinho:",
            erro
        );

        return null;
    }
}


/*
    Permite que outros arquivos atualizem
    o contador sem acessar variáveis internas.
*/
window.CarrinhoVya = {
    recarregar:
        carregarCarrinhoDaConta,

    atualizarContador:
        atualizarContadorCarrinho,

    zerarContador() {
        atualizarContadorCarrinho(null);
    }
};


/*
    ========================================
    ANO DO RODAPÉ
    ========================================
*/

if (anoAtual) {
    anoAtual.textContent =
        new Date().getFullYear();
}


/*
    ========================================
    BANNER ROTATIVO
    ========================================
*/

if (bannerImagem) {
    const prefixoCaminho =
        window.location.pathname.includes(
            "/pages/"
        )
            ? "../"
            : "";

    const imagensBanner =
        Array.from(
            {
                length: 26
            },
            (item, indice) => {
                const numero =
                    String(indice + 1)
                        .padStart(2, "0");

                return (
                    `${prefixoCaminho}` +
                    `images/banners/` +
                    `banner-${numero}.png`
                );
            }
        );

    let bannerAtual = 0;

    window.setInterval(() => {
        bannerAtual =
            (
                bannerAtual + 1
            ) % imagensBanner.length;

        bannerImagem.src =
            imagensBanner[bannerAtual];
    }, 3000);
}


/*
    ========================================
    INICIALIZAÇÃO
    ========================================
*/

carregarCarrinhoDaConta();