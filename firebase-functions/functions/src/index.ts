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

const MODEL_NAME = 'models/gemini-2.5-flash'; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent`;

// Função para gerar lição usando Gemini AI
export const gerarLicao = functions.https.onCall(async (data: GerarLicaoRequest, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { prompt, categoria = 'Geral' } = data;

    if (!prompt || prompt.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt é obrigatório');
    }

    const geminiApiKey = functions.config().gemini?.api_key;
    if (!geminiApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'Chave da API Gemini não configurada');
    }

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

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${geminiApiKey}`,
      {
        contents: [{ parts: [{ text: promptEstruturado }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Aumentei o limite de tokens aqui
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    // Verificando se a resposta foi bloqueada por segurança
    if (response.data?.promptFeedback?.blockReason) {
        console.error('Prompt bloqueado por segurança:', response.data.promptFeedback);
        throw new functions.https.HttpsError('invalid-argument', `O tópico solicitado foi bloqueado por motivos de segurança: ${response.data.promptFeedback.blockReason}`);
    }

    const textoResposta = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textoResposta) {
      console.error('Resposta inesperada da API Gemini:', JSON.stringify(response.data, null, 2));
      throw new functions.https.HttpsError('internal', 'Resposta vazia ou malformada da API Gemini');
    }

    let licaoGerada;
    try {
      const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      licaoGerada = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      licaoGerada = {
        titulo: prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt,
        resumo: `Aprenda sobre ${prompt.toLowerCase()}`,
        conteudoTexto: textoResposta,
        categoria: categoria
      };
    }

    const resultado: GerarLicaoResponse = {
      titulo: licaoGerada.titulo || 'Lição Educativa',
      conteudoTexto: licaoGerada.conteudoTexto || textoResposta,
      categoria: licaoGerada.categoria || categoria,
      resumo: licaoGerada.resumo || `Conteúdo educativo sobre ${prompt}`,
      sucesso: true
    };

    return resultado;

  } catch (error: any) {
    console.error('Erro detalhado ao gerar lição:', {
        message: error.message,
        code: error.code,
        details: error.details,
        response: error.response?.data
    });

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Erro interno ao gerar lição. Verifique os logs da função para mais detalhes.');
  }
});

export const salvarLicaoGerada = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
          throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
        }
    
        const { titulo, conteudoTexto, categoria, resumo } = data;
    
        if (!titulo || !conteudoTexto) {
          throw new functions.https.HttpsError('invalid-argument', 'Título e conteúdo são obrigatórios');
        }
    
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

export const estatisticasIA = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
          throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
        }
    
        const userId = context.auth.uid;
        
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