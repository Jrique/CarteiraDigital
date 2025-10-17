import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from './firebaseConfig';
import { User } from 'firebase/auth';

// Inicializar Firebase Functions
const functions = getFunctions();

// Tipos de dados
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  fotoPerfilUrl?: string;
  nome_completo?: string;
  telefone?: string;
  data_nascimento?: string;
  profissao?: string;
  renda_mensal?: number;
}

export interface Carteira {
  id?: string;
  userId: string;
  nome: string;
  descricao?: string;
  saldo: number;
  cor: string;
  icone: string;
  ativa: boolean;
}

export interface Transacao {
  id?: string;
  userId: string;
  carteiraId: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria: string;
  descricao?: string;
  data: string; // ISO string
}

export interface Meta {
  id?: string;
  userId: string;
  titulo: string;
  descricao?: string;
  valorMeta: number;
  valorAtual: number;
  dataInicio: string;
  dataFim: string;
  categoria: string;
  status: 'ativa' | 'concluida' | 'pausada';
  progressoPercentual?: number;
}

export interface Licao {
  id?: string;
  titulo: string;
  resumo: string;
  categoria: string;
  conteudoTexto?: string;
  videoId?: string;
  dataCriacao: string;
  ativa: boolean;
  tipo?: 'texto' | 'video';
  criadoPorIA?: boolean;
  criadoPor?: string;
}

export interface ProgressoLicao {
  licaoId: string;
  visualizada: boolean;
  salva: boolean;
  dataVisualizacao?: string;
}

export interface DashboardData {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
  economiaMes: number;
  transacoesRecentes: Transacao[];
  metasAtivas: Meta[];
  carteiras: Carteira[];
}

// Interfaces para IA Gemini
export interface GerarLicaoRequest {
  prompt: string;
  categoria?: string;
}

export interface GerarLicaoResponse {
  titulo: string;
  conteudoTexto: string;
  categoria: string;
  resumo: string;
  sucesso: boolean;
  erro?: string;
}

export interface SalvarLicaoRequest {
  titulo: string;
  conteudoTexto: string;
  categoria: string;
  resumo: string;
}

class FirebaseServiceClass {

  /**
   * Gera uma lição educativa usando IA Gemini
   */
  async gerarLicaoComIA(request: GerarLicaoRequest): Promise<GerarLicaoResponse> {
    try {
      const gerarLicao = httpsCallable<GerarLicaoRequest, GerarLicaoResponse>(functions, 'gerarLicao');
      const resultado = await gerarLicao(request);
      return resultado.data;
    } catch (error: any) {
      console.error('Erro ao gerar lição com IA:', error);
      throw new Error(error.message || 'Erro ao gerar lição com IA');
    }
  }

  /**
   * Salva uma lição gerada pela IA no Firestore
   */
  async salvarLicaoGerada(licao: SalvarLicaoRequest): Promise<{ sucesso: boolean; licaoId: string }> {
    try {
      const salvarLicao = httpsCallable(functions, 'salvarLicaoGerada');
      const resultado = await salvarLicao(licao);
      return resultado.data as { sucesso: boolean; licaoId: string };
    } catch (error: any) {
      console.error('Erro ao salvar lição gerada:', error);
      throw new Error(error.message || 'Erro ao salvar lição');
    }
  }

  /**
   * Obtém estatísticas de uso da IA para o usuário atual
   */
  async obterEstatisticasIA(): Promise<{ totalLicoesGeradas: number }> {
    try {
      const estatisticas = httpsCallable(functions, 'estatisticasIA');
      const resultado = await estatisticas();
      return resultado.data as { totalLicoesGeradas: number };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas da IA:', error);
      return { totalLicoesGeradas: 0 };
    }
  }

  /**
   * Obtém o perfil do usuário atual
   */
  async obterPerfilUsuario(): Promise<UserProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        return { uid: user.uid, ...userDoc.data() } as UserProfile;
      }

      // Se não existe, criar perfil básico
      const novoPerfilData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        nome_completo: user.displayName || '',
      };

      await updateDoc(doc(db, 'usuarios', user.uid), novoPerfilData);
      return novoPerfilData as UserProfile;
    } catch (error) {
      console.error('Erro ao obter perfil do usuário:', error);
      return null;
    }
  }

  /**
   * Atualiza o perfil do usuário
   */
  async atualizarPerfilUsuario(dadosAtualizados: Partial<UserProfile>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      await updateDoc(doc(db, 'usuarios', user.uid), dadosAtualizados);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }


  /**
   * Lista todas as carteiras do usuário
   */
  async listarCarteiras(): Promise<Carteira[]> {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'carteiras'),
        where('userId', '==', user.uid),
        orderBy('nome')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Carteira[];
    } catch (error) {
      console.error('Erro ao listar carteiras:', error);
      return [];
    }
  }

  /**
   * Cria uma nova carteira
   */
  async criarCarteira(carteira: Omit<Carteira, 'id' | 'userId'>): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const novaCarteira = {
        ...carteira,
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, 'carteiras'), novaCarteira);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma carteira existente
   */
  async atualizarCarteira(carteiraId: string, dadosAtualizados: Partial<Carteira>): Promise<void> {
    try {
      await updateDoc(doc(db, 'carteiras', carteiraId), dadosAtualizados);
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      throw error;
    }
  }

  /**
   * Exclui uma carteira
   */
  async excluirCarteira(carteiraId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'carteiras', carteiraId));
    } catch (error) {
      console.error('Erro ao excluir carteira:', error);
      throw error;
    }
  }


  /**
   * Lista transações do usuário
   */
  async listarTransacoes(): Promise<Transacao[]> {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'transacoes'),
        where('userId', '==', user.uid),
        orderBy('data', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transacao[];
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      return [];
    }
  }

  /**
   * Cria uma nova transação
   */
  async criarTransacao(transacao: Omit<Transacao, 'id' | 'userId'>): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const novaTransacao = {
        ...transacao,
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, 'transacoes'), novaTransacao);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma transação existente
   */
  async atualizarTransacao(transacaoId: string, dadosAtualizados: Partial<Transacao>): Promise<void> {
    try {
      await updateDoc(doc(db, 'transacoes', transacaoId), dadosAtualizados);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      throw error;
    }
  }

  /**
   * Exclui uma transação
   */
  async excluirTransacao(transacaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'transacoes', transacaoId));
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  }


  /**
   * Lista metas do usuário
   */
  async listarMetas(): Promise<Meta[]> {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'metas'),
        where('userId', '==', user.uid),
        orderBy('dataInicio', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        const valorAtual = data.valorAtual || 0;
        const valorMeta = data.valorMeta || 0;
        const progressoPercentual = valorMeta > 0 ? (valorAtual / valorMeta) * 100 : 0;
        
        return {
          id: doc.id,
          ...data,
          progressoPercentual
        } as Meta
      });
    } catch (error) {
      console.error('Erro ao listar metas:', error);
      return [];
    }
  }

  /**
   * Cria uma nova meta
   */
  async criarMeta(meta: Omit<Meta, 'id' | 'userId'>): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const novaMeta = {
        ...meta,
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, 'metas'), novaMeta);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma meta existente
   */
  async atualizarMeta(metaId: string, dadosAtualizados: Partial<Meta>): Promise<void> {
    try {
      await updateDoc(doc(db, 'metas', metaId), dadosAtualizados);
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      throw error;
    }
  }

  /**
   * Exclui uma meta
   */
  async excluirMeta(metaId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'metas', metaId));
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      throw error;
    }
  }


  /**
   * Lista lições disponíveis
   */
  async listarLicoes(): Promise<Licao[]> {
    try {
      const q = query(
        collection(db, 'licoes'),
        where('ativa', '==', true),
        orderBy('dataCriacao', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Licao[];
    } catch (error) {
      console.error('Erro ao listar lições:', error);
      return [];
    }
  }

  /**
   * Obtém uma lição específica
   */
  async obterLicao(licaoId: string): Promise<Licao | null> {
    try {
      const licaoDoc = await getDoc(doc(db, 'licoes', licaoId));
      if (licaoDoc.exists()) {
        return { id: licaoDoc.id, ...licaoDoc.data() } as Licao;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter lição:', error);
      return null;
    }
  }

  /**
   * Cria uma nova lição
   */
  async criarLicao(licao: Omit<Licao, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'licoes'), licao);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar lição:', error);
      throw error;
    }
  }


  /**
   * Obtém o progresso de lições do usuário
   */
  async obterProgressoLicoes(): Promise<ProgressoLicao[]> {
    try {
      const user = auth.currentUser;
      if (!user) return [];

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.progressoLicoes || [];
      }
      return [];
    } catch (error) {
      console.error('Erro ao obter progresso de lições:', error);
      return [];
    }
  }

  /**
   * Obtém o progresso de uma lição específica
   */
  async obterProgressoLicao(licaoId: string): Promise<ProgressoLicao | null> {
    try {
      const progressos = await this.obterProgressoLicoes();
      return progressos.find(p => p.licaoId === licaoId) || null;
    } catch (error) {
      console.error('Erro ao obter progresso da lição:', error);
      return null;
    }
  }

  /**
   * Marca uma lição como visualizada
   */
  async marcarLicaoVisualizada(licaoId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const progressos = await this.obterProgressoLicoes();
      const progressoExistente = progressos.find(p => p.licaoId === licaoId);

      if (progressoExistente) {
        progressoExistente.visualizada = true;
        progressoExistente.dataVisualizacao = new Date().toISOString();
      } else {
        progressos.push({
          licaoId,
          visualizada: true,
          salva: false,
          dataVisualizacao: new Date().toISOString(),
        });
      }

      await updateDoc(doc(db, 'usuarios', user.uid), {
        progressoLicoes: progressos
      });
    } catch (error) {
      console.error('Erro ao marcar lição como visualizada:', error);
      throw error;
    }
  }

  /**
   * Alterna o status de salva de uma lição
   */
  async toggleLicaoSalva(licaoId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const progressos = await this.obterProgressoLicoes();
      const progressoExistente = progressos.find(p => p.licaoId === licaoId);

      if (progressoExistente) {
        progressoExistente.salva = !progressoExistente.salva;
      } else {
        progressos.push({
          licaoId,
          visualizada: false,
          salva: true,
        });
      }

      await updateDoc(doc(db, 'usuarios', user.uid), {
        progressoLicoes: progressos
      });
    } catch (error) {
      console.error('Erro ao alterar status de lição salva:', error);
      throw error;
    }
  }


  /**
   * Obtém dados do dashboard
   */
  async obterDadosDashboard(): Promise<DashboardData> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          saldoTotal: 0,
          receitasMes: 0,
          despesasMes: 0,
          economiaMes: 0,
          transacoesRecentes: [],
          metasAtivas: [],
          carteiras: [],
        };
      }

      const [carteiras, transacoes, metas] = await Promise.all([
        this.listarCarteiras(),
        this.listarTransacoes(),
        this.listarMetas(),
      ]);

      const saldoTotal = carteiras.reduce((total, carteira) => total + carteira.saldo, 0);

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const transacoesMes = transacoes.filter(t => new Date(t.data) >= inicioMes);

      const receitasMes = transacoesMes
        .filter(t => t.tipo === 'receita')
        .reduce((total, t) => total + t.valor, 0);

      const despesasMes = transacoesMes
        .filter(t => t.tipo === 'despesa')
        .reduce((total, t) => total + t.valor, 0);

      const economiaMes = receitasMes - despesasMes;
      const metasAtivas = metas.filter(m => m.status === 'ativa');
      const transacoesRecentes = transacoes.slice(0, 5);

      return {
        saldoTotal,
        receitasMes,
        despesasMes,
        economiaMes,
        transacoesRecentes,
        metasAtivas,
        carteiras,
      };
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      return {
        saldoTotal: 0,
        receitasMes: 0,
        despesasMes: 0,
        economiaMes: 0,
        transacoesRecentes: [],
        metasAtivas: [],
        carteiras: [],
      };
    }
  }
}

// Exportar instância única
export const FirebaseService = new FirebaseServiceClass();
export default FirebaseService;