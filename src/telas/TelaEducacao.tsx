import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../estilos/theme';
import { FirebaseService, Licao, ProgressoLicao } from '../servicos/FirebaseService';
import { useNotificacao } from '../contextos/NotificacaoContext';

interface Props {
  navigation: any;
}

const categorias = [
  { id: 'orcamento', nome: 'Orçamento', icone: 'wallet-outline', cor: '#4CAF50' },
  { id: 'dividas', nome: 'Dívidas', icone: 'card-outline', cor: '#FF5722' },
  { id: 'investimentos', nome: 'Investimentos', icone: 'trending-up-outline', cor: '#2196F3' },
  { id: 'economia', nome: 'Economia', icone: 'leaf-outline', cor: '#8BC34A' },
  { id: 'bancos', nome: 'Bancos', icone: 'business-outline', cor: '#607D8B' },
  { id: 'planejamento', nome: 'Planejamento', icone: 'calendar-outline', cor: '#9C27B0' },
];

const filtros = [
  { id: 'todos', nome: 'Todos' },
  { id: 'nao_vistas', nome: 'Não Vistas' },
  { id: 'favoritas', nome: 'Favoritas' },
];

export default function TelaEducacao() {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [progressos, setProgressos] = useState<ProgressoLicao[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [filtroSelecionado, setFiltroSelecionado] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalIA, setModalIA] = useState(false);
  const [promptIA, setPromptIA] = useState('');
  const [gerandoLicao, setGerandoLicao] = useState(false);
  const { mostrarNotificacao } = useNotificacao();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [licoesData, progressosData] = await Promise.all([
        FirebaseService.listarLicoes(),
        FirebaseService.obterProgressoLicoes(),
      ]);
      setLicoes(licoesData);
      setProgressos(progressosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarNotificacao('Erro ao carregar lições', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const licoesFiltradas = licoes.filter((licao) => {
    // Filtro por categoria
    if (categoriaFiltro !== 'todos' && licao.categoria !== categoriaFiltro) {
      return false;
    }

    // Filtro por termo de busca
    if (termoBusca && !licao.titulo.toLowerCase().includes(termoBusca.toLowerCase())) {
      return false;
    }

    // Filtro por status
    const progresso = progressos.find(p => p.licaoId === licao.id);
    if (filtroSelecionado === 'nao_vistas' && progresso?.visualizada) {
      return false;
    }
    if (filtroSelecionado === 'favoritas' && !progresso?.salva) {
      return false;
    }

    return true;
  });

  const obterCategoriaInfo = (categoriaId: string) => {
    return categorias.find(cat => cat.id === categoriaId) || categorias[0];
  };

  const obterProgressoLicao = (licaoId: string) => {
    return progressos.find(p => p.licaoId === licaoId);
  };

  const gerarLicaoComIA = async () => {
    if (!promptIA.trim()) {
      mostrarNotificacao('Digite um tópico para gerar a lição', 'warning');
      return;
    }

    try {
      setGerandoLicao(true);
      
      // Simulação de geração de lição (substitua pela integração real com IA)
      const novaLicao: Licao = {
        id: Date.now().toString(),
        titulo: `Lição sobre ${promptIA}`,
        resumo: `Uma lição completa sobre ${promptIA} para melhorar sua educação financeira.`,
        conteudo: `Esta é uma lição detalhada sobre ${promptIA}.\n\nAqui você aprenderá conceitos importantes e práticos sobre este tópico.\n\nLembre-se de aplicar esses conhecimentos em sua vida financeira.`,
        categoria: 'planejamento',
        tipo: 'texto',
        criadoEm: new Date(),
        geradaPorIA: true,
      };

      await FirebaseService.criarLicao(novaLicao);
      await carregarDados();
      
      setModalIA(false);
      setPromptIA('');
      mostrarNotificacao('Lição gerada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao gerar lição:', error);
      mostrarNotificacao('Erro ao gerar lição', 'error');
    } finally {
      setGerandoLicao(false);
    }
  };

  const renderCategoriaFiltro = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroContainer}>
      <TouchableOpacity
        style={[
          styles.filtroItem,
          categoriaFiltro === 'todos' && styles.filtroItemAtivo
        ]}
        onPress={() => setCategoriaFiltro('todos')}
      >
        <Text style={[
          styles.filtroTexto,
          categoriaFiltro === 'todos' && styles.filtroTextoAtivo
        ]}>
          Todos
        </Text>
      </TouchableOpacity>
      
      {categorias.map((categoria) => (
        <TouchableOpacity
          key={categoria.id}
          style={[
            styles.filtroItem,
            categoriaFiltro === categoria.id && styles.filtroItemAtivo
          ]}
          onPress={() => setCategoriaFiltro(categoria.id)}
        >
          <Ionicons 
            name={categoria.icone as any} 
            size={16} 
            color={categoriaFiltro === categoria.id ? Colors.background : Colors.textSecondary} 
          />
          <Text style={[
            styles.filtroTexto,
            categoriaFiltro === categoria.id && styles.filtroTextoAtivo
          ]}>
            {categoria.nome}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFiltroStatus = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroStatusContainer}>
      {filtros.map((filtro) => (
        <TouchableOpacity
          key={filtro.id}
          style={[
            styles.filtroStatusItem,
            filtroSelecionado === filtro.id && styles.filtroStatusItemAtivo
          ]}
          onPress={() => setFiltroSelecionado(filtro.id)}
        >
          <Text style={[
            styles.filtroStatusTexto,
            filtroSelecionado === filtro.id && styles.filtroStatusTextoAtivo
          ]}>
            {filtro.nome}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderLicao = (licao: Licao) => {
    const categoriaInfo = obterCategoriaInfo(licao.categoria);
    const progresso = obterProgressoLicao(licao.id);

    return (
      <TouchableOpacity
        key={licao.id}
        style={styles.licaoCard}
        onPress={() => {
          // Navegar para detalhes da lição
          console.log('Navegar para lição:', licao.id);
        }}
      >
        <View style={styles.licaoHeader}>
          <View style={[styles.categoriaIcon, { backgroundColor: categoriaInfo.cor }]}>
            <Ionicons name={categoriaInfo.icone as any} size={20} color={Colors.background} />
          </View>
          <View style={styles.licaoInfo}>
            <Text style={styles.licaoTitulo} numberOfLines={2}>
              {licao.titulo}
              {licao.geradaPorIA && (
                <Text style={styles.badgeIA}> ✨ IA</Text>
              )}
            </Text>
            <Text style={styles.licaoCategoria}>{categoriaInfo.nome}</Text>
          </View>
          <View style={styles.licaoStatus}>
            {progresso?.visualizada && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            )}
            {progresso?.salva && (
              <Ionicons name="bookmark" size={20} color={Colors.warning} />
            )}
          </View>
        </View>
        
        <Text style={styles.licaoResumo} numberOfLines={3}>
          {licao.resumo}
        </Text>
        
        <View style={styles.licaoFooter}>
          <View style={styles.licaoTipo}>
            <Ionicons 
              name={licao.tipo === 'video' ? 'play-circle-outline' : 'document-text-outline'} 
              size={16} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.licaoTipoTexto}>
              {licao.tipo === 'video' ? 'Vídeo' : 'Texto'}
            </Text>
          </View>
          <Text style={styles.licaoData}>
            {licao.criadoEm.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando lições...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Educação Financeira</Text>
        <TouchableOpacity
          style={styles.botaoIA}
          onPress={() => setModalIA(true)}
        >
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.buscaContainer}>
        <View style={styles.inputBusca}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.inputBuscaTexto}
            placeholder="Buscar lições..."
            placeholderTextColor={Colors.placeholder}
            value={termoBusca}
            onChangeText={setTermoBusca}
          />
        </View>
      </View>

      {renderCategoriaFiltro()}
      {renderFiltroStatus()}

      <ScrollView style={styles.conteudo} showsVerticalScrollIndicator={false}>
        {licoesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma lição encontrada</Text>
            <Text style={styles.emptySubtext}>
              Tente ajustar os filtros ou gere uma nova lição com IA
            </Text>
          </View>
        ) : (
          licoesFiltradas.map(renderLicao)
        )}
      </ScrollView>

      {/* Modal de Geração de Lição com IA */}
      <Modal
        visible={modalIA}
        transparent
        animationType="slide"
        onRequestClose={() => setModalIA(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Gerar Lição com IA</Text>
              <TouchableOpacity onPress={() => setModalIA(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescricao}>
              Digite um tópico sobre educação financeira e a IA criará uma lição personalizada para você.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Como criar um fundo de emergência"
              placeholderTextColor={Colors.placeholder}
              value={promptIA}
              onChangeText={setPromptIA}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.botaoCancelar}
                onPress={() => setModalIA(false)}
              >
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoGerar, gerandoLicao && styles.botaoDesabilitado]}
                onPress={gerarLicaoComIA}
                disabled={gerandoLicao}
              >
                {gerandoLicao ? (
                  <ActivityIndicator size="small" color={Colors.buttonText} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={Colors.buttonText} />
                    <Text style={styles.textoBotaoGerar}>Gerar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
  },
  botaoIA: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buscaContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  inputBuscaTexto: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textPrimary,
  },
  filtroContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filtroItemAtivo: {
    backgroundColor: Colors.primary,
  },
  filtroTexto: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  filtroTextoAtivo: {
    color: Colors.background,
    fontWeight: '600' as '600',
  },
  filtroStatusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtroStatusItem: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
  },
  filtroStatusItemAtivo: {
    backgroundColor: Colors.primary,
  },
  filtroStatusTexto: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  filtroStatusTextoAtivo: {
    color: Colors.background,
    fontWeight: '600' as '600',
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  licaoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  licaoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoriaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  licaoInfo: {
    flex: 1,
  },
  licaoTitulo: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  badgeIA: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: Colors.primary,
  },
  licaoCategoria: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  licaoStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  licaoResumo: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  licaoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  licaoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  licaoTipoTexto: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  licaoData: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
  },
  modalDescricao: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.inputText,
    textAlignVertical: 'top',
    marginBottom: 24,
    minHeight: 80,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoCancelar: {
    flex: 1,
    backgroundColor: Colors.buttonSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  textoBotaoCancelar: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
  },
  botaoGerar: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoGerar: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.buttonText,
  },
});

