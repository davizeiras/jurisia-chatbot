/* ==================================================
   1. ELEMENTOS DO HTML
================================================== */

const formulario =
  document.querySelector("#formulario-chat");

const campoPergunta =
  document.querySelector("#pergunta");

const areaMensagens =
  document.querySelector("#mensagens");

const botaoEnviar =
  formulario?.querySelector('button[type="submit"]');

const botaoNovaConversa =
  document.querySelector("#nova-conversa");

const botoesSugestao =
  document.querySelectorAll(".sugestao");


/* Verifica se os elementos principais existem */

if (
  !formulario ||
  !campoPergunta ||
  !areaMensagens ||
  !botaoEnviar
) {
  throw new Error(
    "Não foi possível encontrar os elementos do chatbot no HTML."
  );
}


/* ==================================================
   2. VARIÁVEIS DO CHAT
================================================== */

const textoOriginalBotao =
  botaoEnviar.textContent;

const movimentoReduzido =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

let idRespostaAnterior = null;
let enviandoMensagem = false;


/* ==================================================
   3. ROLAR PARA A ÚLTIMA MENSAGEM
================================================== */

function rolarParaUltimaMensagem() {
  areaMensagens.scrollTo({
    top: areaMensagens.scrollHeight,
    behavior: movimentoReduzido
      ? "auto"
      : "smooth"
  });
}


/* ==================================================
   4. CRIAR UMA MENSAGEM
================================================== */

function criarMensagem(texto, autor) {
  const mensagem =
    document.createElement("div");

  const nomeAutor =
    document.createElement("strong");
const conteudo =
  document.createElement("div");

conteudo.className =
  "mensagem-conteudo";
  

  mensagem.classList.add(
    "mensagem",
    autor
  );

  nomeAutor.textContent =
    autor === "usuario"
      ? "Você:"
      : "Assistente:";

  conteudo.textContent = texto;

  conteudo.style.whiteSpace = "pre-wrap";

  mensagem.append(
    nomeAutor,
    conteudo
  );

  return {
    mensagem,
    conteudo
  };
}


/* ==================================================
   5. ADICIONAR MENSAGEM NORMAL
================================================== */

function adicionarMensagem(texto, autor) {
  const elementos =
    criarMensagem(texto, autor);

  areaMensagens.appendChild(
    elementos.mensagem
  );

  rolarParaUltimaMensagem();

  if (
    window.gsap &&
    !movimentoReduzido
  ) {
    gsap.fromTo(
      elementos.mensagem,
      {
        y: 18,
        scale: 0.97
      },
      {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.4)",
        clearProps: "transform"
      }
    );
  }

  return elementos.mensagem;
}


/* ==================================================
   FORMATAR RESPOSTAS DA INTELIGÊNCIA ARTIFICIAL
================================================== */

function adicionarFormatacaoInline(
  elemento,
  texto
) {
  const expressao =
    /(\*\*.*?\*\*|`.*?`)/g;

  let posicaoAnterior = 0;
  let resultado;

  while (
    (
      resultado =
        expressao.exec(texto)
    ) !== null
  ) {
    const textoNormal =
      texto.slice(
        posicaoAnterior,
        resultado.index
      );

    if (textoNormal) {
      elemento.appendChild(
        document.createTextNode(
          textoNormal
        )
      );
    }

    const marcador =
      resultado[0];

    if (
      marcador.startsWith("**")
    ) {
      const destaque =
        document.createElement(
          "strong"
        );

      destaque.textContent =
        marcador.slice(2, -2);

      elemento.appendChild(
        destaque
      );
    } else {
      const codigo =
        document.createElement(
          "code"
        );

      codigo.textContent =
        marcador.slice(1, -1);

      elemento.appendChild(codigo);
    }

    posicaoAnterior =
      expressao.lastIndex;
  }

  const parteFinal =
    texto.slice(posicaoAnterior);

  if (parteFinal) {
    elemento.appendChild(
      document.createTextNode(
        parteFinal
      )
    );
  }
}


function formatarRespostaIA(
  elemento,
  texto
) {
  elemento.textContent = "";

  elemento.classList.add(
    "resposta-formatada"
  );

  const linhas =
    String(texto || "")
      .replace(/\r\n/g, "\n")
      .split("\n");

  let listaAtual = null;
  let tipoListaAtual = null;
  let ultimoItem = null;
  let paragrafoAtual = null;


  function encerrarEstruturas() {
    listaAtual = null;
    tipoListaAtual = null;
    ultimoItem = null;
    paragrafoAtual = null;
  }


  function criarLista(tipo) {
    const lista =
      document.createElement(tipo);

    elemento.appendChild(lista);

    listaAtual = lista;
    tipoListaAtual = tipo;
    paragrafoAtual = null;

    return lista;
  }


  linhas.forEach(function (linhaOriginal) {
    const linha =
      linhaOriginal.trim();

    if (!linha) {
      encerrarEstruturas();
      return;
    }


    /* Títulos iniciados com # */

    const titulo =
      linha.match(
        /^#{1,3}\s+(.+)$/
      );

    if (titulo) {
      encerrarEstruturas();

      const subtitulo =
        document.createElement("h4");

      adicionarFormatacaoInline(
        subtitulo,
        titulo[1]
      );

      elemento.appendChild(
        subtitulo
      );

      return;
    }


    /* Lista numerada */

    const itemNumerado =
      linha.match(
        /^(\d+)[.)]\s+(.+)$/
      );

    if (itemNumerado) {
      if (
        !listaAtual ||
        tipoListaAtual !== "ol"
      ) {
        criarLista("ol");
      }

      const item =
        document.createElement("li");

      adicionarFormatacaoInline(
        item,
        itemNumerado[2]
      );

      listaAtual.appendChild(item);

      ultimoItem = item;
      paragrafoAtual = null;

      return;
    }


    /* Lista com marcadores */

    const itemMarcador =
      linha.match(
        /^[-•*]\s+(.+)$/
      );

    if (itemMarcador) {
      if (
        !listaAtual ||
        tipoListaAtual !== "ul"
      ) {
        criarLista("ul");
      }

      const item =
        document.createElement("li");

      adicionarFormatacaoInline(
        item,
        itemMarcador[1]
      );

      listaAtual.appendChild(item);

      ultimoItem = item;
      paragrafoAtual = null;

      return;
    }


    /* Continuação de um item da lista */

    if (
      listaAtual &&
      ultimoItem
    ) {
      ultimoItem.appendChild(
        document.createElement("br")
      );

      adicionarFormatacaoInline(
        ultimoItem,
        linha
      );

      return;
    }


    /* Parágrafos normais */

    if (!paragrafoAtual) {
      paragrafoAtual =
        document.createElement("p");

      elemento.appendChild(
        paragrafoAtual
      );
    } else {
      paragrafoAtual.appendChild(
        document.createTextNode(" ")
      );
    }

    adicionarFormatacaoInline(
      paragrafoAtual,
      linha
    );
  });
}

/* ==================================================
   6. MENSAGEM COM EFEITO DE DIGITAÇÃO
================================================== */

function adicionarMensagemDigitada(
  texto,
  autor = "assistente"
) {
  return new Promise(function (resolve) {
    const elementos =
      criarMensagem("", autor);

    areaMensagens.appendChild(
      elementos.mensagem
    );

    rolarParaUltimaMensagem();

    const textoCompleto =
      String(texto || "");

    if (
      movimentoReduzido ||
      textoCompleto.length === 0
    ) {
      if (autor === "assistente") {
  formatarRespostaIA(
    elementos.conteudo,
    textoCompleto
  );
} else {
  elementos.conteudo.textContent =
    textoCompleto;
}

      resolve(elementos.mensagem);
      return;
    }

    if (window.gsap) {
      gsap.fromTo(
        elementos.mensagem,
        {
          y: 18,
          scale: 0.97
        },
        {
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.4)",
          clearProps: "transform"
        }
      );
    }

    let posicao = 0;

    let quantidadePorVez = 1;

    if (textoCompleto.length > 700) {
      quantidadePorVez = 4;
    } else if (textoCompleto.length > 350) {
      quantidadePorVez = 2;
    }

    const intervalo = setInterval(
      function () {
        posicao += quantidadePorVez;

       const textoParcial =
  textoCompleto
    .slice(0, posicao)
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#{1,3}\s+/gm, "");

elementos.conteudo.textContent =
  textoParcial;

        rolarParaUltimaMensagem();

        if (
          posicao >= textoCompleto.length
        ) {
          clearInterval(intervalo);

          if (autor === "assistente") {
  formatarRespostaIA(
    elementos.conteudo,
    textoCompleto
  );
} else {
  elementos.conteudo.textContent =
    textoCompleto;
}

          resolve(elementos.mensagem);
        }
      },
      13
    );
  });
}


/* ==================================================
   7. INDICADOR DE DIGITAÇÃO
================================================== */

function adicionarIndicadorDigitando() {
  const mensagem =
    document.createElement("div");

  const nomeAutor =
    document.createElement("strong");

  const pontos =
    document.createElement("div");

  mensagem.className =
    "mensagem assistente indicador-digitando";

  nomeAutor.textContent =
    "Assistente:";

  pontos.className =
    "pontos-digitando";

  pontos.setAttribute(
    "aria-label",
    "Assistente digitando"
  );

  pontos.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;

  mensagem.append(
    nomeAutor,
    pontos
  );

  areaMensagens.appendChild(mensagem);

  rolarParaUltimaMensagem();

  if (
    window.gsap &&
    !movimentoReduzido
  ) {
    gsap.fromTo(
      mensagem,
      {
        y: 15,
        scale: 0.96
      },
      {
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: "back.out(1.5)"
      }
    );
  }

  return mensagem;
}


function removerIndicadorDigitando(
  indicador
) {
  if (!indicador) {
    return;
  }

  if (
    window.gsap &&
    !movimentoReduzido
  ) {
    gsap.to(indicador, {
      y: -8,
      opacity: 0,
      duration: 0.2,

      onComplete: function () {
        indicador.remove();
      }
    });

    return;
  }

  indicador.remove();
}


/* ==================================================
   8. ALTERAR ESTADO DO BOTÃO
================================================== */

function alterarEstadoEnvio(enviando) {
  botaoEnviar.disabled = enviando;

  botaoEnviar.textContent =
    enviando
      ? "Enviando..."
      : textoOriginalBotao;

  campoPergunta.disabled = enviando;
}


/* ==================================================
   9. ENVIAR MENSAGEM PARA O SERVIDOR
================================================== */

formulario.addEventListener(
  "submit",
  async function (evento) {
    evento.preventDefault();

    if (enviandoMensagem) {
      return;
    }

    const pergunta =
      campoPergunta.value.trim();

    if (!pergunta) {
      campoPergunta.focus();
      return;
    }

    enviandoMensagem = true;

    adicionarMensagem(
      pergunta,
      "usuario"
    );

    campoPergunta.value = "";

    alterarEstadoEnvio(true);

    areaMensagens.setAttribute(
      "aria-busy",
      "true"
    );

    const indicador =
      adicionarIndicadorDigitando();

    try {
      const resposta = await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            mensagem: pergunta,
            idRespostaAnterior:
              idRespostaAnterior
          })
        }
      );

      let dados;

      try {
        dados = await resposta.json();
      } catch {
        throw new Error(
          "O servidor enviou uma resposta inválida."
        );
      }

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          "Não foi possível consultar a inteligência artificial."
        );
      }

      if (dados.idResposta) {
        idRespostaAnterior =
          dados.idResposta;
      }

      removerIndicadorDigitando(
        indicador
      );

      await adicionarMensagemDigitada(
        dados.resposta ||
        "Não recebi uma resposta da inteligência artificial."
      );
    } catch (erro) {
      removerIndicadorDigitando(
        indicador
      );

      console.error(
        "Erro no chatbot:",
        erro
      );

      await adicionarMensagemDigitada(
        "Não consegui responder agora. " +
        erro.message
      );
    } finally {
      enviandoMensagem = false;

      alterarEstadoEnvio(false);

      areaMensagens.removeAttribute(
        "aria-busy"
      );

      campoPergunta.focus();
    }
  }
);


/* ==================================================
   10. PERGUNTAS SUGERIDAS
================================================== */

botoesSugestao.forEach(
  function (botao) {
    botao.addEventListener(
      "click",
      function () {
        if (enviandoMensagem) {
          return;
        }

        const pergunta =
          botao.dataset.pergunta;

        if (!pergunta) {
          return;
        }

        campoPergunta.value =
          pergunta;

        formulario.requestSubmit();
      }
    );
  }
);


/* ==================================================
   11. INICIAR NOVA CONVERSA
================================================== */

function reiniciarConversa() {
  if (enviandoMensagem) {
    return;
  }

  idRespostaAnterior = null;

  areaMensagens.innerHTML = "";

  adicionarMensagem(
    "Olá! Sou o assistente educacional da JurisIA. Como posso ajudar você?",
    "assistente"
  );

  campoPergunta.value = "";
  campoPergunta.focus();

  if (
    botaoNovaConversa &&
    window.gsap &&
    !movimentoReduzido
  ) {
    gsap.fromTo(
      botaoNovaConversa,
      {
        scale: 0.92
      },
      {
        scale: 1,
        duration: 0.4,
        ease: "back.out(2)",
        clearProps: "transform"
      }
    );
  }
}


if (botaoNovaConversa) {
  botaoNovaConversa.addEventListener(
    "click",
    reiniciarConversa
  );
}

/* ==================================================
   12. VERIFICAR SE AS ANIMAÇÕES ESTÃO DISPONÍVEIS
================================================== */

function animacoesDisponiveis() {
  return Boolean(
    window.gsap &&
    window.ScrollTrigger &&
    !movimentoReduzido
  );
}


/* ==================================================
   13. PREPARAR O TÍTULO PRINCIPAL
================================================== */

function prepararTituloPrincipal() {
  const titulo =
    document.querySelector(
      "#titulo-principal"
    );

  if (
    !titulo ||
    titulo.querySelector(
      ".palavra-titulo"
    )
  ) {
    return;
  }

  const texto =
    titulo.textContent.trim();

  const palavras =
    texto.split(/\s+/);

  titulo.setAttribute(
    "aria-label",
    texto
  );

  titulo.textContent = "";

  palavras.forEach(
    function (palavra, indice) {
      const mascara =
        document.createElement("span");

      const elementoPalavra =
        document.createElement("span");

      mascara.className =
        "mascara-palavra";

      elementoPalavra.className =
        "palavra-titulo";

      mascara.setAttribute(
        "aria-hidden",
        "true"
      );

      elementoPalavra.textContent =
        palavra;

      mascara.appendChild(
        elementoPalavra
      );

      titulo.appendChild(mascara);

      if (
        indice < palavras.length - 1
      ) {
        titulo.appendChild(
          document.createTextNode(" ")
        );
      }
    }
  );
}


/* ==================================================
   14. BARRA SUPERIOR DE PROGRESSO
================================================== */

function criarBarraProgresso() {
  if (
    document.querySelector(
      ".barra-progresso"
    )
  ) {
    return;
  }

  const barra =
    document.createElement("div");

  barra.className =
    "barra-progresso";

  barra.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.appendChild(barra);

  gsap.to(barra, {
    scaleX: 1,
    ease: "none",

    scrollTrigger: {
      start: 0,
      end: "max",
      scrub: 0.2
    }
  });
}


/* ==================================================
   15. INDICADOR ROLE PARA EXPLORAR
================================================== */

function criarIndicadorScroll() {
  const apresentacao =
    document.querySelector(
      ".apresentacao"
    );

  if (
    !apresentacao ||
    document.querySelector(
      ".indicador-scroll"
    )
  ) {
    return;
  }

  const indicador =
    document.createElement("div");

  indicador.className =
    "indicador-scroll";

  indicador.setAttribute(
    "aria-hidden",
    "true"
  );

  indicador.innerHTML = `
    <span>Role para explorar</span>
    <span class="trilho-scroll"></span>
  `;

  apresentacao.appendChild(
    indicador
  );

  gsap.to(indicador, {
    y: 15,
    opacity: 0,
    ease: "none",

    scrollTrigger: {
      trigger: ".apresentacao",
      start: "top top",
      end: "+=180",
      scrub: true
    }
  });
}


/* ==================================================
   16. MENU SUPERIOR ATIVO
================================================== */

function configurarMenuSuperior() {
  const links =
    document.querySelectorAll(
      ".navegacao a"
    );

  const secoes = [
    document.querySelector("#inicio"),
    document.querySelector("#temas"),
    document.querySelector("#chatbot")
  ].filter(Boolean);

  if (
    links.length === 0 ||
    secoes.length === 0
  ) {
    return;
  }

  let atualizacaoPendente = false;

  function atualizarMenu() {
    const pontoAtual =
      window.scrollY +
      window.innerHeight * 0.38;

    let secaoAtual = "inicio";

    secoes.forEach(function (secao) {
      if (
        pontoAtual >= secao.offsetTop
      ) {
        secaoAtual = secao.id;
      }
    });

    links.forEach(function (link) {
      link.classList.toggle(
        "ativo",
        link.getAttribute("href") ===
          `#${secaoAtual}`
      );
    });

    atualizacaoPendente = false;
  }

  function solicitarAtualizacao() {
    if (atualizacaoPendente) {
      return;
    }

    atualizacaoPendente = true;

    requestAnimationFrame(
      atualizarMenu
    );
  }

  window.addEventListener(
    "scroll",
    solicitarAtualizacao,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    solicitarAtualizacao
  );

  atualizarMenu();
}


/* ==================================================
   17. EFEITO MAGNÉTICO DISCRETO
================================================== */

function ativarBotaoMagnetico() {
  const botao =
    document.querySelector(
      ".botao-conhecer"
    );

  const dispositivoDeToque =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  if (
    !botao ||
    dispositivoDeToque
  ) {
    return;
  }

  botao.addEventListener(
    "pointermove",
    function (evento) {
      const posicao =
        botao.getBoundingClientRect();

      const centroX =
        posicao.left +
        posicao.width / 2;

      const centroY =
        posicao.top +
        posicao.height / 2;

      gsap.to(botao, {
        x:
          (evento.clientX - centroX) *
          0.14,

        y:
          (evento.clientY - centroY) *
          0.14,

        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto"
      });
    }
  );

  botao.addEventListener(
    "pointerleave",
    function () {
      gsap.to(botao, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto"
      });
    }
  );
}


/* ==================================================
   18. LINHAS DESENHADAS DURANTE O SCROLL
================================================== */

function criarLinhasDeSecao() {
  const secoes =
    document.querySelectorAll(
      ".secao-chat"
    );

  secoes.forEach(function (secao) {
    if (
      secao.querySelector(
        ".linha-secao-scroll"
      )
    ) {
      return;
    }

    const linha =
      document.createElement("div");

    linha.className =
      "linha-secao-scroll";

    linha.setAttribute(
      "aria-hidden",
      "true"
    );

    secao.appendChild(linha);

    gsap.to(linha, {
      scaleX: 1,
      ease: "none",

      scrollTrigger: {
        trigger: secao,
        start: "top 95%",
        end: "top 45%",
        scrub: 0.8
      }
    });
  });
}


/* ==================================================
   19. PARALLAX DO TÍTULO
================================================== */

function criarParallaxDoTitulo() {
  const telaGrande =
    window.matchMedia(
      "(min-width: 851px)"
    );

  if (!telaGrande.matches) {
    return;
  }

  const linhas =
    document.querySelectorAll(
      ".linha-titulo"
    );

  if (linhas.length === 0) {
    return;
  }

  const timeline =
    gsap.timeline({
      scrollTrigger: {
        trigger: ".apresentacao",
        start: "top top",
        end: "bottom top",
        scrub: 1.1
      }
    });

  if (linhas[0]) {
    timeline.to(
      linhas[0],
      {
        x: -45,
        ease: "none"
      },
      0
    );
  }

  if (linhas[1]) {
    timeline.to(
      linhas[1],
      {
        x: 60,
        ease: "none"
      },
      0
    );
  }

  if (linhas[2]) {
    timeline.to(
      linhas[2],
      {
        x: -30,
        ease: "none"
      },
      0
    );
  }

  timeline.to(
    ".descricao",
    {
      y: -22,
      ease: "none"
    },
    0
  );
}


/* ==================================================
   20. REVELAÇÃO DOS TEMAS
================================================== */

function animarPainelDeTemas() {
  const painel =
    document.querySelector(
      ".painel-assuntos"
    );

  if (!painel) {
    return;
  }

  ScrollTrigger.create({
    trigger: painel,
    start: "top 89%",
    once: true,

    onEnter: function () {
      const timeline =
        gsap.timeline();

      timeline
        .fromTo(
          ".painel-assuntos h2",
          {
            clipPath:
              "inset(0 100% 0 0)"
          },
          {
            clipPath:
              "inset(0 0% 0 0)",

            duration: 0.9,
            ease: "power4.out",
            clearProps: "clipPath"
          }
        )

        .fromTo(
          ".painel-assuntos li > *",
          {
            y: 22,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.08,
            ease: "power3.out",
            clearProps:
              "transform,opacity"
          },
          "-=0.45"
        );
    }
  });
}


/* ==================================================
   21. REVELAÇÃO DO TÍTULO DA CONSULTA
================================================== */

function animarTituloDaConsulta() {
  const titulo =
    document.querySelector(
      ".titulo-secao"
    );

  if (!titulo) {
    return;
  }

  ScrollTrigger.create({
    trigger: ".secao-chat",
    start: "top 88%",
    once: true,

    onEnter: function () {
      const timeline =
        gsap.timeline();

      timeline
        .fromTo(
          ".titulo-secao h2",
          {
            clipPath:
              "inset(0 0 100% 0)"
          },
          {
            clipPath:
              "inset(0 0 0% 0)",

            duration: 0.9,
            ease: "power4.out",
            clearProps: "clipPath"
          }
        )

        .fromTo(
          ".informacoes-consulta > div",
          {
            x: -25,
            opacity: 0
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "power3.out",
            clearProps:
              "transform,opacity"
          },
          "-=0.35"
        );
    }
  });
}


/* ==================================================
   22. REVELAÇÃO DO CHAT
================================================== */

function animarChat() {
  const chat =
    document.querySelector(".chat");

  if (!chat) {
    return;
  }

  ScrollTrigger.create({
    trigger: chat,
    start: "top 88%",
    once: true,

    onEnter: function () {
      const timeline =
        gsap.timeline({
          defaults: {
            ease: "power3.out"
          }
        });

      timeline
        .fromTo(
          ".chat-identificacao",
          {
            clipPath:
              "inset(0 100% 0 0)"
          },
          {
            clipPath:
              "inset(0 0% 0 0)",

            duration: 0.7,
            clearProps: "clipPath"
          }
        )

        .fromTo(
          ".chat-cabecalho > *",
          {
            y: 20,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.09,
            clearProps:
              "transform,opacity"
          },
          "-=0.3"
        )

        .fromTo(
          ".chat-mensagens",
          {
            clipPath:
              "inset(0 0 100% 0)"
          },
          {
            clipPath:
              "inset(0 0 0% 0)",

            duration: 0.75,
            clearProps: "clipPath"
          },
          "-=0.25"
        )

        .fromTo(
          ".sugestao",
          {
            y: 15,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.42,
            stagger: 0.07,
            clearProps:
              "transform,opacity"
          },
          "-=0.25"
        )

        .fromTo(
          ".formulario-chat",
          {
            clipPath:
              "inset(0 100% 0 0)"
          },
          {
            clipPath:
              "inset(0 0% 0 0)",

            duration: 0.65,
            clearProps: "clipPath"
          },
          "-=0.15"
        );
    }
  });
}


/* ==================================================
   23. REVELAÇÃO DO RODAPÉ
================================================== */

function animarRodape() {
  const rodape =
    document.querySelector(".rodape");

  if (!rodape) {
    return;
  }

  ScrollTrigger.create({
    trigger: rodape,
    start: "top 96%",
    once: true,

    onEnter: function () {
      gsap.fromTo(
        ".rodape > *",
        {
          y: 18,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.1,
          ease: "power3.out",
          clearProps:
            "transform,opacity"
        }
      );
    }
  });
}


/* ==================================================
   24. CONFIGURAR TODAS AS ANIMAÇÕES DE SCROLL
================================================== */

function configurarAnimacoesDeScroll() {
  criarLinhasDeSecao();
  criarParallaxDoTitulo();
  animarPainelDeTemas();
  animarTituloDaConsulta();
  animarChat();
  animarRodape();

  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 150);
}


/* ==================================================
   25. ABERTURA COM CORTINAS
================================================== */

function iniciarAbertura(
  quandoTerminar
) {
  const entrada =
    document.createElement("div");

  entrada.className =
    "entrada-site";

  entrada.innerHTML = `
    <div
      class="entrada-cortinas"
      aria-hidden="true"
    >
      <span class="faixa-abertura"></span>
      <span class="faixa-abertura"></span>
      <span class="faixa-abertura"></span>
    </div>

    <div class="entrada-conteudo">
      <div class="entrada-marca">
        Juris<span>IA</span>
      </div>

      <p class="entrada-legenda">
        Inteligência artificial e Direito
      </p>

      <div class="entrada-linha"></div>
    </div>
  `;

  document.body.appendChild(entrada);

  const faixas =
    entrada.querySelectorAll(
      ".faixa-abertura"
    );

  gsap.set(faixas, {
    transformOrigin: function (indice) {
      return indice % 2 === 0
        ? "top center"
        : "bottom center";
    }
  });

  let terminou = false;

  function finalizar() {
    if (terminou) {
      return;
    }

    terminou = true;

    entrada.remove();

    if (
      typeof quandoTerminar ===
      "function"
    ) {
      quandoTerminar();
    }

    ScrollTrigger.refresh();
  }

  const seguranca =
    setTimeout(
      finalizar,
      5000
    );

  const timeline =
    gsap.timeline({
      defaults: {
        ease: "power4.out"
      },

      onComplete: function () {
        clearTimeout(seguranca);
        finalizar();
      }
    });

  timeline
    .from(".entrada-marca", {
      y: 65,
      opacity: 0,
      duration: 0.75
    })

    .from(
      ".entrada-legenda",
      {
        y: 15,
        opacity: 0,
        duration: 0.45
      },
      "-=0.3"
    )

    .to(
      ".entrada-conteudo",
      {
        y: -20,
        opacity: 0,
        duration: 0.4,
        delay: 0.3
      }
    )

    .to(
      faixas,
      {
        scaleY: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power4.inOut"
      },
      "-=0.1"
    )

    .from(
      ".cabecalho",
      {
        y: -55,
        opacity: 0,
        duration: 0.65
      },
      "-=0.45"
    )

    .from(
      ".palavra-titulo",
      {
        yPercent: 120,
        rotate: 2,
        opacity: 0,
        duration: 0.85,
        stagger: 0.09
      },
      "-=0.35"
    )

    .from(
      ".descricao",
      {
        y: 25,
        opacity: 0,
        duration: 0.55
      },
      "-=0.4"
    )

    .from(
      ".botao-conhecer",
      {
        y: 18,
        opacity: 0,
        duration: 0.5
      },
      "-=0.35"
    )

    .fromTo(
      ".painel-assuntos",
      {
        clipPath:
          "inset(0 100% 0 0)"
      },
      {
        clipPath:
          "inset(0 0% 0 0)",

        duration: 0.8,
        clearProps: "clipPath"
      },
      "-=0.6"
    );
}


/* ==================================================
   26. INICIAR A EXPERIÊNCIA VISUAL
================================================== */

function iniciarExperienciaVisual() {
  prepararTituloPrincipal();
  configurarMenuSuperior();

  if (!animacoesDisponiveis()) {
    return;
  }

  gsap.registerPlugin(
    ScrollTrigger
  );

  criarBarraProgresso();
  criarIndicadorScroll();
  ativarBotaoMagnetico();

  iniciarAbertura(
    configurarAnimacoesDeScroll
  );

  window.addEventListener(
    "load",
    function () {
      setTimeout(function () {
        ScrollTrigger.refresh();
      }, 150);
    }
  );
}


iniciarExperienciaVisual();


/* ==================================================
   13. BARRA DE PROGRESSO DA ROLAGEM
================================================== */

function criarBarraProgresso() {
  if (
    document.querySelector(
      ".barra-progresso"
    )
  ) {
    return;
  }

  const barra =
    document.createElement("div");

  barra.className =
    "barra-progresso";

  barra.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.appendChild(barra);

  gsap.to(barra, {
    scaleX: 1,
    ease: "none",

    scrollTrigger: {
      start: 0,
      end: "max",
      scrub: 0.15
    }
  });
}


/* ==================================================
   14. LUZ QUE ACOMPANHA O MOUSE
================================================== */

function criarLuzDoMouse() {
  const dispositivoDeToque =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  if (
    dispositivoDeToque ||
    document.querySelector(
      ".cursor-luz"
    )
  ) {
    return;
  }

  const luz =
    document.createElement("div");

  luz.className = "cursor-luz";

  document.body.appendChild(luz);

  gsap.set(luz, {
    x: -500,
    y: -500
  });

  window.addEventListener(
    "pointermove",
    function (evento) {
      gsap.to(luz, {
        x: evento.clientX,
        y: evento.clientY,
        duration: 1.3,
        ease: "power3.out",
        overwrite: "auto"
      });
    }
  );
}


/* ==================================================
   15. EFEITO 3D NO PAINEL DE TEMAS
================================================== */

function ativarEfeito3D() {
  const painel =
    document.querySelector(
      ".painel-assuntos"
    );

  const dispositivoDeToque =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  if (
    !painel ||
    dispositivoDeToque
  ) {
    return;
  }

  painel.addEventListener(
    "pointermove",
    function (evento) {
      const posicao =
        painel.getBoundingClientRect();

      const porcentagemX =
        (evento.clientX - posicao.left) /
        posicao.width;

      const porcentagemY =
        (evento.clientY - posicao.top) /
        posicao.height;

      const rotacaoY =
        (porcentagemX - 0.5) * 7;

      const rotacaoX =
        (0.5 - porcentagemY) * 7;

      gsap.to(painel, {
        rotateX: rotacaoX,
        rotateY: rotacaoY,
        transformPerspective: 900,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto"
      });
    }
  );

  painel.addEventListener(
    "pointerleave",
    function () {
      gsap.to(painel, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto"
      });
    }
  );
}


/* ==================================================
   16. EFEITO MAGNÉTICO NO BOTÃO
================================================== */

function ativarBotaoMagnetico() {
  const botao =
    document.querySelector(
      ".botao-conhecer"
    );

  const dispositivoDeToque =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  if (
    !botao ||
    dispositivoDeToque
  ) {
    return;
  }

  botao.addEventListener(
    "pointermove",
    function (evento) {
      const posicao =
        botao.getBoundingClientRect();

      const centroX =
        posicao.left +
        posicao.width / 2;

      const centroY =
        posicao.top +
        posicao.height / 2;

      gsap.to(botao, {
        x:
          (evento.clientX - centroX) *
          0.18,

        y:
          (evento.clientY - centroY) *
          0.18,

        duration: 0.3,
        ease: "power2.out"
      });
    }
  );

  botao.addEventListener(
    "pointerleave",
    function () {
      gsap.to(botao, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)"
      });
    }
  );
}


/* ==================================================
   17. ANIMAÇÃO SEGURA DO CHAT NA ROLAGEM
================================================== */

function ativarAnimacaoDoChat() {
  const chat =
    document.querySelector(".chat");

  if (!chat) {
    return;
  }

  ScrollTrigger.create({
    trigger: chat,
    start: "top 92%",
    once: true,

    onEnter: function () {
      const elementosCabecalho =
        chat.querySelectorAll(
          ".chat-cabecalho > *"
        );

      gsap.fromTo(
        elementosCabecalho,
        {
          y: 15,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power3.out",
          clearProps:
            "transform,opacity"
        }
      );

      gsap.fromTo(
        ".sugestao",
        {
          y: 10,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          delay: 0.15,
          ease: "power2.out",
          clearProps:
            "transform,opacity"
        }
      );
    }
  });
}


/* ==================================================
   18. TELA CINEMATOGRÁFICA INICIAL
================================================== */

function iniciarTelaDeEntrada() {
  const entrada =
    document.createElement("div");

  entrada.className =
    "entrada-site";

  entrada.innerHTML = `
    <div class="entrada-conteudo">
      <div class="entrada-marca">
        Juris<span>IA</span>
      </div>

      <p class="entrada-legenda">
        Inteligência artificial e Direito
      </p>

      <div class="entrada-linha"></div>
    </div>
  `;

  document.body.appendChild(entrada);

  const apresentacao =
    document.querySelector(
      ".apresentacao"
    );

  if (
    apresentacao &&
    !apresentacao.querySelector(
      ".linha-cinematografica"
    )
  ) {
    const linha =
      document.createElement("div");

    linha.className =
      "linha-cinematografica";

    apresentacao.appendChild(linha);
  }

  const seguranca = setTimeout(
    function () {
      entrada.remove();
    },
    4500
  );

  const animacao =
    gsap.timeline({
      defaults: {
        ease: "power4.out"
      }
    });

  animacao
    .from(".entrada-marca", {
      y: 70,
      opacity: 0,
      duration: 0.75
    })

    .from(
      ".entrada-legenda",
      {
        y: 15,
        opacity: 0,
        duration: 0.45
      },
      "-=0.3"
    )

    .to(entrada, {
      yPercent: -100,
      duration: 0.9,
      delay: 0.35,
      ease: "power4.inOut",

      onComplete: function () {
        clearTimeout(seguranca);

        entrada.remove();

        ScrollTrigger.refresh();
      }
    })

    .from(
      ".cabecalho",
      {
        y: -60,
        opacity: 0,
        duration: 0.65
      },
      "-=0.4"
    )

    .from(
      ".palavra-titulo",
      {
        yPercent: 110,
        rotate: 2,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07
      },
      "-=0.35"
    )

    .from(
      ".descricao",
      {
        y: 25,
        opacity: 0,
        duration: 0.55
      },
      "-=0.4"
    )

    .from(
      ".botao-conhecer",
      {
        y: 18,
        opacity: 0,
        scale: 0.96,
        duration: 0.5
      },
      "-=0.35"
    )

    .from(
      ".painel-assuntos",
      {
        x: 45,
        duration: 0.65,
        clearProps: "transform"
      },
      "-=0.55"
    );
}


/* ==================================================
   19. INICIAR TODAS AS ANIMAÇÕES
================================================== */

function iniciarAnimacoes() {
  if (
    !window.gsap ||
    !window.ScrollTrigger ||
    movimentoReduzido
  ) {
    return;
  }

  gsap.registerPlugin(
    ScrollTrigger
  );

  prepararTituloPrincipal();
  criarBarraProgresso();
  criarLuzDoMouse();
  ativarEfeito3D();
  ativarBotaoMagnetico();
  ativarAnimacaoDoChat();
  iniciarTelaDeEntrada();

  window.addEventListener(
    "load",
    function () {
      setTimeout(
        function () {
          ScrollTrigger.refresh();
        },
        150
      );
    }
  );
}


iniciarAnimacoes();
/* ==================================================
   NAVEGAÇÃO VISUAL ENTRE AS SEÇÕES
================================================== */

function criarMapaDaPagina() {
  if (
    document.querySelector(".mapa-pagina")
  ) {
    return;
  }

  const mapa =
    document.createElement("nav");

  mapa.className = "mapa-pagina";

  mapa.setAttribute(
    "aria-label",
    "Atalhos das seções"
  );

  mapa.innerHTML = `
    <a href="#inicio" data-destino="inicio">
      <strong>Início</strong>
      <span>01</span>
    </a>

    <a href="#temas" data-destino="temas">
      <strong>Temas</strong>
      <span>02</span>
    </a>

    <a href="#chatbot" data-destino="chatbot">
      <strong>Consulta</strong>
      <span>03</span>
    </a>
  `;

  document.body.appendChild(mapa);

  const todosOsLinks = [
    ...document.querySelectorAll(
      '.mapa-pagina a'
    ),

    ...document.querySelectorAll(
      '.navegacao a'
    )
  ];

  const secoes = [
    document.querySelector("#inicio"),
    document.querySelector("#temas"),
    document.querySelector("#chatbot")
  ].filter(Boolean);


  function atualizarSecaoAtual() {
    const pontoDeLeitura =
      window.scrollY +
      window.innerHeight * 0.38;

    let secaoAtual = "inicio";

    secoes.forEach(function (secao) {
      const inicioDaSecao =
        secao.offsetTop;

      if (
        pontoDeLeitura >= inicioDaSecao
      ) {
        secaoAtual = secao.id;
      }
    });

    todosOsLinks.forEach(
      function (link) {
        const destino =
          link.getAttribute("href");

        link.classList.toggle(
          "ativo",
          destino === `#${secaoAtual}`
        );
      }
    );
  }


  window.addEventListener(
    "scroll",
    atualizarSecaoAtual,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    atualizarSecaoAtual
  );

  atualizarSecaoAtual();
}


/* ==================================================
   ANIMAÇÕES AO ENTRAR NA TELA
================================================== */

function iniciarAnimacoesDeRolagem() {
  if (
    !window.gsap ||
    !window.ScrollTrigger ||
    movimentoReduzido
  ) {
    return;
  }

  gsap.registerPlugin(
    ScrollTrigger
  );


  /* Temas: anima somente o conteúdo interno */

  ScrollTrigger.create({
    trigger: ".painel-assuntos",
    start: "top 92%",
    once: true,

    onEnter: function () {
      gsap.fromTo(
        ".painel-assuntos h2",
        {
          clipPath:
            "inset(0 100% 0 0)"
        },
        {
          clipPath:
            "inset(0 0% 0 0)",

          duration: 0.8,
          ease: "power4.out",
          clearProps: "clipPath"
        }
      );

      gsap.fromTo(
        ".painel-assuntos li > *",
        {
          x: 24,
          opacity: 0
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          clearProps:
            "transform,opacity"
        }
      );
    }
  });


  /* Título da seção do chat */

  ScrollTrigger.create({
    trigger: ".secao-chat",
    start: "top 90%",
    once: true,

    onEnter: function () {
      gsap.fromTo(
        ".titulo-secao h2",
        {
          clipPath:
            "inset(0 0 100% 0)"
        },
        {
          clipPath:
            "inset(0 0 0% 0)",

          duration: 0.85,
          ease: "power4.out",
          clearProps: "clipPath"
        }
      );

      gsap.fromTo(
        ".informacoes-consulta > div",
        {
          x: -20,
          opacity: 0
        },
        {
          x: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: "power3.out",
          clearProps:
            "transform,opacity"
        }
      );
    }
  });


  /* Partes internas do chatbot */

  ScrollTrigger.create({
    trigger: ".chat",
    start: "top 92%",
    once: true,

    onEnter: function () {
      const partesDoChat = [
        ".chat-identificacao",
        ".chat-cabecalho",
        ".chat-mensagens",
        ".sugestoes",
        ".formulario-chat",
        ".aviso-juridico"
      ];

      gsap.fromTo(
        partesDoChat,
        {
          clipPath:
            "inset(0 100% 0 0)"
        },
        {
          clipPath:
            "inset(0 0% 0 0)",

          duration: 0.65,
          stagger: 0.08,
          ease: "power3.inOut",
          clearProps: "clipPath"
        }
      );
    }
  });


  /* Movimento editorial no título principal */

  gsap.to(
    ".linha-titulo:nth-child(2)",
    {
      x: 35,
      ease: "none",

      scrollTrigger: {
        trigger: ".apresentacao",
        start: "top top",
        end: "bottom top",
        scrub: 0.8
      }
    }
  );


  /* Rodapé */

  ScrollTrigger.create({
    trigger: ".rodape",
    start: "top 96%",
    once: true,

    onEnter: function () {
      gsap.fromTo(
        ".rodape > *",
        {
          y: 18,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          clearProps:
            "transform,opacity"
        }
      );
    }
  });


  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 200);
}


/* ==================================================
   INICIAR AS NOVAS MELHORIAS
================================================== */

criarMapaDaPagina();
iniciarAnimacoesDeRolagem();

/* ==================================================
   INDICADOR E MOVIMENTOS DE SCROLL
================================================== */

function criarIndicadorDeScroll() {
  const apresentacao =
    document.querySelector(".apresentacao");

  if (
    !apresentacao ||
    document.querySelector(
      ".indicador-scroll"
    )
  ) {
    return;
  }

  const indicador =
    document.createElement("div");

  indicador.className =
    "indicador-scroll";

  indicador.setAttribute(
    "aria-hidden",
    "true"
  );

  indicador.innerHTML = `
    <span>Role para explorar</span>
    <span class="trilho-scroll"></span>
  `;

  apresentacao.appendChild(indicador);

  function atualizarIndicador() {
    indicador.classList.toggle(
      "oculto",
      window.scrollY > 100
    );
  }

  window.addEventListener(
    "scroll",
    atualizarIndicador,
    {
      passive: true
    }
  );

  atualizarIndicador();
}


function iniciarScrollCinematografico() {
  if (
    !window.gsap ||
    !window.ScrollTrigger ||
    movimentoReduzido
  ) {
    return;
  }

  gsap.registerPlugin(
    ScrollTrigger
  );


  /* A apresentação sobe lentamente */

  gsap.to(
    ".apresentacao-conteudo",
    {
      y: -55,
      ease: "none",

      scrollTrigger: {
        trigger: ".apresentacao",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    }
  );


  /* Temas acompanham a rolagem */

  const temas =
    gsap.utils.toArray(
      ".painel-assuntos li"
    );

  temas.forEach(
    function (tema, indice) {
      const distancia =
        indice % 2 === 0
          ? 26
          : -26;

      gsap.fromTo(
        tema,
        {
          x: distancia
        },
        {
          x: 0,
          ease: "none",
          immediateRender: false,

          scrollTrigger: {
            trigger: tema,
            start: "top 96%",
            end: "top 73%",
            scrub: 0.8
          }
        }
      );
    }
  );


  /* Identificação do chat entra com o scroll */

  gsap.fromTo(
    ".chat-identificacao",
    {
      xPercent: -10
    },
    {
      xPercent: 0,
      ease: "none",
      immediateRender: false,

      scrollTrigger: {
        trigger: ".chat",
        start: "top 96%",
        end: "top 74%",
        scrub: 0.8
      }
    }
  );


  /* Linhas das informações avançam suavemente */

  gsap.utils
    .toArray(
      ".informacoes-consulta > div"
    )
    .forEach(
      function (informacao, indice) {
        gsap.fromTo(
          informacao,
          {
            backgroundPositionX:
              "-100%"
          },
          {
            backgroundPositionX:
              "0%",
            ease: "none",

            scrollTrigger: {
              trigger: informacao,
              start: "top 96%",
              end: "top 78%",
              scrub: 0.7
            }
          }
        );
      }
    );


  setTimeout(function () {
    ScrollTrigger.refresh();
  }, 200);
}


criarIndicadorDeScroll();
iniciarScrollCinematografico();