const botaoMenu = document.querySelector("#menu-botao");
const menuPrincipal = document.querySelector("#menu-principal");
const botoesCarrinho = document.querySelectorAll(".adicionar-carrinho");
const quantidadeCarrinho = document.querySelector("#quantidade-carrinho");
const anoAtual = document.querySelector("#ano-atual");

let carrinho = JSON.parse(localStorage.getItem("carrinhoVya")) || [];

function atualizarContadorCarrinho() {
    const quantidadeTotal = carrinho.reduce((total, produto) => {
        return total + produto.quantidade;
    }, 0);

    quantidadeCarrinho.textContent = quantidadeTotal;
}

function salvarCarrinho() {
    localStorage.setItem("carrinhoVya", JSON.stringify(carrinho));
    atualizarContadorCarrinho();
}

function adicionarProduto(evento) {
    const botao = evento.currentTarget;

    const produto = {
        id: Number(botao.dataset.id),
        nome: botao.dataset.nome,
        preco: Number(botao.dataset.preco),
        quantidade: 1
    };

    const produtoExistente = carrinho.find((item) => {
        return item.id === produto.id;
    });

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    salvarCarrinho();

    botao.textContent = "Produto adicionado";

    setTimeout(() => {
        botao.textContent = "Adicionar ao carrinho";
    }, 1500);
}

botaoMenu.addEventListener("click", () => {
    const menuEstaAberto = menuPrincipal.classList.toggle("menu--aberto");

    botaoMenu.setAttribute("aria-expanded", menuEstaAberto);
});

botoesCarrinho.forEach((botao) => {
    botao.addEventListener("click", adicionarProduto);
});

anoAtual.textContent = new Date().getFullYear();

atualizarContadorCarrinho();