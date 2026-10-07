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

const anoAtual = document.querySelector(
    "#ano-atual"
);


/*
    ========================================
    2. RECUPERAR O CARRINHO SALVO
    ========================================
*/

/*
    let permite alterar o conteúdo do carrinho
    durante a utilização da página.
*/

let carrinho = JSON.parse(
    localStorage.getItem("carrinhoVya")
) || [];


/*
    ========================================
    3. MENU DO CELULAR
    ========================================
*/

/*
    Só configura o menu se o botão e o menu
    existirem na página atual.
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


    /*
        Fecha o menu quando o usuário
        seleciona alguma opção.
    */

    const linksMenu = menuPrincipal.querySelectorAll("a");

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
    4. ATUALIZAR CONTADOR DO CARRINHO
    ========================================
*/

function atualizarContadorCarrinho() {
    /*
        Soma a quantidade de todos os produtos.
    */

    const quantidadeTotal = carrinho.reduce(
        (total, produto) => {
            return total + produto.quantidade;
        },
        0
    );

    /*
        Só altera o elemento se ele existir.
    */

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
    /*
        Transforma o array em texto e salva
        no navegador.
    */

    localStorage.setItem(
        "carrinhoVya",
        JSON.stringify(carrinho)
    );

    atualizarContadorCarrinho();
}


/*
    ========================================
    6. ADICIONAR UM PRODUTO
    ========================================
*/

function adicionarProduto(evento) {
    /*
        currentTarget identifica exatamente
        o botão que foi clicado.
    */

    const botao = evento.currentTarget;

    /*
        Cria um objeto com os dados guardados
        nos atributos data-* do botão.
    */

    const produto = {
        id: Number(botao.dataset.id),
        nome: botao.dataset.nome,
        preco: Number(botao.dataset.preco),
        quantidade: 1
    };

    /*
        Verifica se o produto já está
        dentro do carrinho.
    */

    const produtoExistente = carrinho.find(
        (item) => {
            return item.id === produto.id;
        }
    );

    /*
        Se já existe, aumenta a quantidade.
        Se não existe, adiciona o produto.
    */

    if (produtoExistente) {
        produtoExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    /*
        Salva o novo estado do carrinho.
    */

    salvarCarrinho();

    /*
        Mostra uma confirmação temporária
        dentro do botão.
    */

    const textoOriginal = botao.textContent;

    botao.textContent = "Produto adicionado";
    botao.disabled = true;

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }, 1500);
}


/*
    ========================================
    7. CONECTAR OS BOTÕES DOS PRODUTOS
    ========================================
*/

/*
    Adiciona um evento em cada botão que possui
    a classe adicionar-carrinho.
*/

botoesCarrinho.forEach((botao) => {
    botao.addEventListener(
        "click",
        adicionarProduto
    );
});


/*
    ========================================
    8. ANO AUTOMÁTICO DO RODAPÉ
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