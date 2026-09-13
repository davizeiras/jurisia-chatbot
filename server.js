// Carrega as variáveis guardadas no arquivo .env
import "dotenv/config";

// Importa as ferramentas utilizadas pelo servidor
import express from "express";
import OpenAI from "openai";
import { rateLimit } from "express-rate-limit";

// Cria o servidor Express
const app = express();

// Na hospedagem será usada a porta fornecida pela plataforma.
// No computador continuará utilizando a porta 3000.
const PORT = process.env.PORT || 3000;

// Interrompe o servidor caso a chave não seja encontrada
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "A chave OPENAI_API_KEY não foi encontrada no arquivo .env"
  );
}

// Configura a conexão com a OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Permite receber dados JSON.
// O limite de 10kb evita requisições exageradamente grandes.
app.use(
  express.json({
    limit: "10kb"
  })
);

// Disponibiliza o HTML, CSS e JavaScript da pasta public
app.use(express.static("public"));

// Limite de utilização do chatbot
const limiteChat = rateLimit({
  // Período de 15 minutos
  windowMs: 15 * 60 * 1000,

  // Cada endereço IP poderá enviar 15 mensagens nesse período
  limit: 15,

  // Envia informações modernas sobre o limite nos cabeçalhos
  standardHeaders: "draft-8",

  // Desativa os cabeçalhos antigos
  legacyHeaders: false,

  // Resposta apresentada quando o limite for atingido
  message: {
    erro:
      "Você atingiu o limite de 15 mensagens. Aguarde 15 minutos para conversar novamente."
  }
});

// Rota usada para verificar se o servidor está funcionando
app.get("/api/status", function (req, res) {
  res.json({
    funcionando: true,
    mensagem: "Servidor do chatbot funcionando!"
  });
});

// Rota principal do chatbot
app.post(
  "/api/chat",

  // Executa a proteção antes de consultar a OpenAI
  limiteChat,

  async function (req, res) {
    const { mensagem, idRespostaAnterior } = req.body;

    // Verifica se a mensagem realmente é um texto
    if (
      typeof mensagem !== "string" ||
      mensagem.trim() === ""
    ) {
      return res.status(400).json({
        erro: "Digite uma pergunta válida."
      });
    }

    // Remove espaços desnecessários
    const mensagemLimpa = mensagem.trim();

    // Impede perguntas com mais de 1.000 caracteres
    if (mensagemLimpa.length > 1000) {
      return res.status(400).json({
        erro:
          "Sua pergunta ultrapassou o limite de 1.000 caracteres."
      });
    }

    try {
      // Configura o comportamento da inteligência artificial
      const configuracao = {
        model: "gpt-5.6-luna",

        instructions: `
          Você é o JurisIA, um assistente educacional
          sobre inteligência artificial aplicada ao
          meio jurídico.

          Responda em português do Brasil, com clareza
          e linguagem simples.

          Considere as mensagens anteriores para manter
          uma conversa coerente.

          Não se apresente como advogado e não forneça
          aconselhamento jurídico individualizado.

          Não invente leis, decisões judiciais ou
          informações.

          Quando a pergunta exigir análise jurídica
          profissional, informe que o usuário deve
          procurar um advogado qualificado.
        `,

        input: mensagemLimpa,

        // Limita o tamanho máximo da resposta
        max_output_tokens: 500,

        // Permite continuar a conversa usando o ID
        store: true
      };

      // Adiciona a memória somente quando já existe
      // uma resposta anterior
      if (
        typeof idRespostaAnterior === "string" &&
        idRespostaAnterior.trim() !== ""
      ) {
        configuracao.previous_response_id =
          idRespostaAnterior.trim();
      }

      // Envia a pergunta para a OpenAI
      const resposta =
        await openai.responses.create(configuracao);

      // Devolve a resposta para o navegador
      res.json({
        resposta: resposta.output_text,
        idResposta: resposta.id
      });
    } catch (erro) {
      // Mostra o erro completo somente no terminal
      console.error(
        "Erro ao consultar a OpenAI:",
        erro.message
      );

      // O visitante recebe apenas uma mensagem segura
      res.status(500).json({
        erro:
          "Não foi possível obter uma resposta da inteligência artificial."
      });
    }
  }
);

// Inicia o servidor
app.listen(PORT, function () {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});