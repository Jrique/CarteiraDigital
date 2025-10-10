const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.erro || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw error;
    }
  }

  // Métodos para usuários
  async criarUsuario(dadosUsuario: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(dadosUsuario),
    });
  }

  async obterUsuario(userId: number) {
    return this.request(`/users/${userId}`);
  }

  async atualizarUsuario(userId: number, dadosUsuario: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(dadosUsuario),
    });
  }

  async login(username: string) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async obterResumoFinanceiro(userId: number) {
    return this.request(`/users/${userId}/resumo-financeiro`);
  }

  // Métodos para transações
  async listarTransacoes(userId: number, params: any = {}) {
    const queryParams = new URLSearchParams({
      user_id: userId.toString(),
      ...params,
    });
    return this.request(`/transacoes?${queryParams}`);
  }

  async criarTransacao(dadosTransacao: any) {
    return this.request('/transacoes', {
      method: 'POST',
      body: JSON.stringify(dadosTransacao),
    });
  }

  async obterTransacao(transacaoId: number) {
    return this.request(`/transacoes/${transacaoId}`);
  }

  async atualizarTransacao(transacaoId: number, dadosTransacao: any) {
    return this.request(`/transacoes/${transacaoId}`, {
      method: 'PUT',
      body: JSON.stringify(dadosTransacao),
    });
  }

  async deletarTransacao(transacaoId: number) {
    return this.request(`/transacoes/${transacaoId}`, {
      method: 'DELETE',
    });
  }

  async obterTransacoesRecentes(userId: number, limit: number = 5) {
    return this.request(`/transacoes/recentes?user_id=${userId}&limit=${limit}`);
  }

  async obterCategoriasTransacoes(userId: number) {
    return this.request(`/transacoes/categorias?user_id=${userId}`);
  }

  // Métodos para metas
  async listarMetas(userId: number, params: any = {}) {
    const queryParams = new URLSearchParams({
      user_id: userId.toString(),
      ...params,
    });
    return this.request(`/metas?${queryParams}`);
  }

  async criarMeta(dadosMeta: any) {
    return this.request('/metas', {
      method: 'POST',
      body: JSON.stringify(dadosMeta),
    });
  }

  async obterMeta(metaId: number) {
    return this.request(`/metas/${metaId}`);
  }

  async atualizarMeta(metaId: number, dadosMeta: any) {
    return this.request(`/metas/${metaId}`, {
      method: 'PUT',
      body: JSON.stringify(dadosMeta),
    });
  }

  async deletarMeta(metaId: number) {
    return this.request(`/metas/${metaId}`, {
      method: 'DELETE',
    });
  }

  async atualizarProgressoMeta(metaId: number, valor: number) {
    return this.request(`/metas/${metaId}/progresso`, {
      method: 'POST',
      body: JSON.stringify({ valor }),
    });
  }

  async obterCategoriasMetas(userId: number) {
    return this.request(`/metas/categorias?user_id=${userId}`);
  }

  async obterResumoMetas(userId: number) {
    return this.request(`/metas/resumo?user_id=${userId}`);
  }

  // Métodos para relatórios
  async obterDashboard(userId: number) {
    return this.request(`/relatorios/dashboard?user_id=${userId}`);
  }

  async obterRelatorioMensal(userId: number, mes?: number, ano?: number) {
    const params = new URLSearchParams({ user_id: userId.toString() });
    if (mes) params.append('mes', mes.toString());
    if (ano) params.append('ano', ano.toString());
    return this.request(`/relatorios/mensal?${params}`);
  }

  async obterRelatorioAnual(userId: number, ano?: number) {
    const params = new URLSearchParams({ user_id: userId.toString() });
    if (ano) params.append('ano', ano.toString());
    return this.request(`/relatorios/anual?${params}`);
  }

  async obterRelatorioPeriodo(userId: number, dataInicio: string, dataFim: string) {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      data_inicio: dataInicio,
      data_fim: dataFim,
    });
    return this.request(`/relatorios/periodo?${params}`);
  }

  async obterProgressoMetas(userId: number) {
    return this.request(`/relatorios/metas-progresso?user_id=${userId}`);
  }

  // Método para verificar saúde da API
  async verificarSaude() {
    return this.request('/health');
  }
}

export default new ApiService();

