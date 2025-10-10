import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Inicializar Firebase Admin
admin.initializeApp();

interface GerarLicaoRequest {
  prompt: string;
  categoria?: string;
  userId?: string;
}

interface GerarLicaoResponse {
  titulo: string;
  conteudoTexto: string;
  categoria: string;
  resumo: string;
  sucesso: boolean;
  erro?: string;
}

// Configuração da API Gemini
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Função para gerar lição usando Gemini AI
export const gerarLicao = functions.https.onCall(async (data: GerarLicaoRequest, context) => {
  try {
    // Verificar se o usuário está autenticado (opcional)
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { prompt, categoria = 'Geral' } = data;

    if (!prompt || prompt.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt é obrigatório');
    }

    // Obter a chave da API do Gemini das variáveis de ambiente
    const geminiApiKey = functions.config().gemini?.api_key;
    if (!geminiApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Chave da API Gemini não configurada');
    }

    // Criar prompt estruturado para educação financeira
    const promptEstruturado = `
Como especialista em educação financeira, crie uma lição educativa sobre: "${prompt}"

Estruture sua resposta no seguinte formato JSON:
{
  "titulo": "Título claro e atrativo da lição (máximo 60 caracteres)",
  "resumo": "Resumo em 1-2 frases do que será aprendido (máximo 150 caracteres)",
  "conteudoTexto": "Conteúdo educativo completo, didático e acessível (máximo 800 palavras)",
  "categoria": "Uma das categorias: Orçamento, Dívidas, Investimentos, Economia, Bancos, Planejamento"
}

Requisitos:
- Use linguagem simples e acessível
- Inclua exemplos práticos
- Seja didático e motivacional
- Foque em ações concretas que o usuário pode tomar
- Mantenha o conteúdo dentro dos limites de caracteres especificados

Responda APENAS com o JSON válido, sem texto adicional.
    `;

    // Chamar a API do Gemini
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: promptEstruturado
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 segundos
      }
    );

    // Extrair o texto da resposta
    const textoResposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textoResposta) {
      throw new functions.https.HttpsError('internal', 'Resposta vazia da API Gemini');
    }

    // Tentar fazer parse do JSON retornado pela IA
    let licaoGerada;
    try {
      // Limpar o texto para extrair apenas o JSON
      const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      licaoGerada = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Se não conseguir fazer parse, criar estrutura manualmente
      licaoGerada = {
        titulo: prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt,
        resumo: `Aprenda sobre ${prompt.toLowerCase()}`,
        conteudoTexto: textoResposta,
        categoria: categoria
      };
    }

    // Validar e sanitizar os dados
    const resultado: GerarLicaoResponse = {
      titulo: licaoGerada.titulo || 'Lição Educativa',
      conteudoTexto: licaoGerada.conteudoTexto || textoResposta,
      categoria: licaoGerada.categoria || categoria,
      resumo: licaoGerada.resumo || `Conteúdo educativo sobre ${prompt}`,
      sucesso: true
    };

    // Log para monitoramento
    console.log(`Lição gerada com sucesso para usuário ${context.auth.uid}:`, {
      titulo: resultado.titulo,
      categoria: resultado.categoria,
      tamanhoConteudo: resultado.conteudoTexto.length
    });

    return resultado;

  } catch (error: any) {
    console.error('Erro ao gerar lição:', error);

    // Tratar diferentes tipos de erro
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    if (error.response?.status === 429) {
      throw new functions.https.HttpsError('resource-exhausted', 'Limite de requisições excedido. Tente novamente em alguns minutos.');
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new functions.https.HttpsError('permission-denied', 'Erro de autenticação com a API Gemini');
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Timeout na geração da lição. Tente novamente.');
    }

    throw new functions.https.HttpsError('internal', 'Erro interno ao gerar lição');
  }
});

// Função para salvar lição gerada no Firestore
export const salvarLicaoGerada = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { titulo, conteudoTexto, categoria, resumo } = data;

    if (!titulo || !conteudoTexto) {
      throw new functions.https.HttpsError('invalid-argument', 'Título e conteúdo são obrigatórios');
    }

    // Salvar a lição no Firestore
    const licaoRef = await admin.firestore().collection('licoes').add({
      titulo,
      conteudoTexto,
      categoria: categoria || 'Geral',
      resumo: resumo || '',
      dataCriacao: admin.firestore.FieldValue.serverTimestamp(),
      criadoPorIA: true,
      criadoPor: context.auth.uid,
      ativa: true
    });

    console.log(`Lição salva com ID: ${licaoRef.id} por usuário ${context.auth.uid}`);

    return {
      sucesso: true,
      licaoId: licaoRef.id,
      mensagem: 'Lição salva com sucesso!'
    };

  } catch (error: any) {
    console.error('Erro ao salvar lição:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Erro interno ao salvar lição');
  }
});

// Função para obter estatísticas de uso da IA
export const estatisticasIA = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const userId = context.auth.uid;
    
    // Contar lições geradas por IA pelo usuário
    const licoesGeradas = await admin.firestore()
      .collection('licoes')
      .where('criadoPor', '==', userId)
      .where('criadoPorIA', '==', true)
      .count()
      .get();

    return {
      totalLicoesGeradas: licoesGeradas.data().count,
      usuario: userId
    };

  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error);
    throw new functions.https.HttpsError('internal', 'Erro interno ao obter estatísticas');
  }
});

