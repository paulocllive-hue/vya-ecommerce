/*
    ========================================
    1. ELEMENTOS DA PÁGINA
    ========================================
*/

const botaoMenu = document.querySelector("#menu-botao");

const menuPrincipal = document.querySelector(
    "#menu-principal"
);

const botoesCarrinho = document.querySelectorAll(
    ".adicionar-carrinho"
);

const quantidadeCarrinho = document.querySelector(
    "#quantidade-carrinho"
);

const anoAtual = document.querySelector("#ano-atual");

/*const bannerImagem = document.querySelector(
    "#banner-imagem"
);


/*
    ========================================
    2. RECUPERAR O CARRINHO
    ========================================
*/

let carrinho = [];

try {
    carrinho = JSON.parse(
        localStorage.getItem("carrinhoVya")
    ) || [];
} catch (erro) {
    carrinho = [];

    console.error(
        "Não foi possível recuperar o carrinho:",
        erro
    );
}


/*
    ========================================
    3. MENU DO CELULAR
    ========================================
*/

if (botaoMenu && menuPrincipal) {
    botaoMenu.addEventListener("click", () => {
        const menuEstaAberto =
            menuPrincipal.classList.toggle(
                "menu--aberto"
            );

        botaoMenu.setAttribute(
            "aria-expanded",
            String(menuEstaAberto)
        );
    });

    const linksMenu =
        menuPrincipal.querySelectorAll("a");

    linksMenu.forEach((link) => {
        link.addEventListener("click", () => {
            menuPrincipal.classList.remove(
                "menu--aberto"
            );

            botaoMenu.setAttribute(
                "aria-expanded",
                "false"
            );
        });
    });
}


/*
    ========================================
    4. CONTADOR DO CARRINHO
    ========================================
*/

function atualizarContadorCarrinho() {
    const quantidadeTotal = carrinho.reduce(
        (total, produto) => {
            return total + produto.quantidade;
        },
        0
    );

    if (quantidadeCarrinho) {
        quantidadeCarrinho.textContent =
            quantidadeTotal;
    }
}


/*
    ========================================
    5. SALVAR O CARRINHO
    ========================================
*/

function salvarCarrinho() {
    localStorage.setItem(
        "carrinhoVya",
        JSON.stringify(carrinho)
    );

    atualizarContadorCarrinho();
}


/*
    ========================================
    6. ADICIONAR PRODUTO
    ========================================
*/

function adicionarProduto(evento) {
    const botao = evento.currentTarget;

    const produto = {
        id: Number(botao.dataset.id),
        nome: botao.dataset.nome,
        preco: Number(botao.dataset.preco),
        quantidade: 1
    };

    const produtoExistente = carrinho.find(
        (item) => {
            return item.id === produto.id;
        }
    );

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    salvarCarrinho();

    const textoOriginal =
        botao.textContent.trim();

    botao.textContent = "Produto adicionado";
    botao.disabled = true;

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }, 1500);
}


/*
    ========================================
    7. BOTÕES DOS PRODUTOS
    ========================================
*/

botoesCarrinho.forEach((botao) => {
    botao.addEventListener(
        "click",
        adicionarProduto
    );
});


/*
    ========================================
    8. ANO DO RODAPÉ
    ========================================
*/

if (anoAtual) {
    anoAtual.textContent =
        new Date().getFullYear();
}


/*
    ========================================
    9. INICIAR O CONTADOR
    ========================================
*/

atualizarContadorCarrinho();


/*
    ========================================
    10. TROCA AUTOMÁTICA DO BANNER
    ========================================
*/

const bannerImagem = document.querySelector(
    "#banner-imagem"
);

const imagensBanner = [
    "images/banners/banner-01.png",
    "images/banners/banner-02.png",
    "images/banners/banner-03.png",
    "images/banners/banner-04.png",
    "images/banners/banner-05.png",
    "images/banners/banner-06.png",
    "images/banners/banner-07.png",
    "images/banners/banner-08.png",
    "images/banners/banner-09.png",
    "images/banners/banner-10.png",
    "images/banners/banner-11.png",
    "images/banners/banner-12.png",
    "images/banners/banner-13.png",
    "images/banners/banner-14.png",
    "images/banners/banner-15.png",
    "images/banners/banner-16.png",
    "images/banners/banner-17.png",
    "images/banners/banner-18.png",
    "images/banners/banner-19.png",
    "images/banners/banner-20.png",
    "images/banners/banner-21.png",
    "images/banners/banner-22.png",
    "images/banners/banner-23.png",
    "images/banners/banner-24.png",
    "images/banners/banner-25.png",
    "images/banners/banner-26.png"
];

let bannerAtual = 0;

if (bannerImagem) {
    console.log("Banner encontrado:", bannerImagem);

    setInterval(() => {
        bannerAtual++;

        if (bannerAtual >= imagensBanner.length) {
            bannerAtual = 0;
        }

        console.log(
            "Trocando para:",
            imagensBanner[bannerAtual]
        );

        bannerImagem.src =
            imagensBanner[bannerAtual];
    }, 3000);
} else {
    console.error(
        "ERRO: o elemento #banner-imagem não foi encontrado."
    );
}