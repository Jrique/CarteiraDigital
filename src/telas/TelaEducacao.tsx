import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
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
  { id: 'Geral', nome: 'Geral', icone: 'help-circle-outline', cor: '#95a5a6' },
];

const filtros = [
  { id: 'todos', nome: 'Todos' },
  { id: 'nao_vistas', nome: 'Não Vistas' },
  { id: 'favoritas', nome: 'Favoritas' },
];

export default function TelaEducacao({ navigation }: any) {
  const [licoes, setLicoes] = useState<Licao[]>([]);
  const [progressos, setProgressos] = useState<ProgressoLicao[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');
  const [filtroSelecionado, setFiltroSelecionado] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalIA, setModalIA] = useState(false);
  const [promptIA, setPromptIA] = useState('');
  const [gerandoLicao, setGerandoLicao] = useState(false);
  const { mostrarAviso, mostrarErro, mostrarSucesso } = useNotificacao();

  const carregarDados = useCallback(async () => {
    try {
      const [licoesData, progressosData] = await Promise.all([
        FirebaseService.listarLicoes(),
        FirebaseService.obterProgressoLicoes(),
      ]);
      setLicoes(licoesData);
      setProgressos(progressosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarErro('Erro', 'Não foi possível carregar as lições');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregarDados();
    }, [carregarDados])
  );
  
  const obterCategoriaInfo = (categoriaId: string) => {
    return categorias.find(cat => cat.id.toLowerCase() === categoriaId.toLowerCase()) || categorias.find(c => c.id === 'Geral')!;
  };

  const obterProgressoLicao = (licaoId: string) => {
    return progressos.find(p => p.licaoId === licaoId);
  };

  const licoesFiltradas = licoes.filter((licao) => {
    if (categoriaFiltro !== 'todos' && licao.categoria.toLowerCase() !== categoriaFiltro.toLowerCase()) {
      return false;
    }

    if (termoBusca && !licao.titulo.toLowerCase().includes(termoBusca.toLowerCase())) {
      return false;
    }

    const progresso = obterProgressoLicao(licao.id!);
    if (filtroSelecionado === 'nao_vistas' && progresso?.visualizada) {
      return false;
    }
    if (filtroSelecionado === 'favoritas' && !progresso?.salva) {
      return false;
    }

    return true;
  });

  const toggleFavorito = async (licaoId: string) => {
    const isSalvaAtual = progressos.find(p => p.licaoId === licaoId)?.salva;

    try {
      setProgressos(prev => {
        const progressoExistente = prev.find(p => p.licaoId === licaoId);
        if (progressoExistente) {
          return prev.map(p => p.licaoId === licaoId ? { ...p, salva: !p.salva } : p);
        }
        return [...prev, { licaoId, visualizada: false, salva: true }];
      });
      
      await FirebaseService.toggleLicaoSalva(licaoId);
      mostrarSucesso('Sucesso', !isSalvaAtual ? 'Lição salva nos favoritos' : 'Lição removida dos favoritos');

    } catch (error) {
      console.error('Erro ao salvar lição:', error);
      mostrarErro('Erro', 'Não foi possível salvar a lição');
      setProgressos(prev => {
          const progressoExistente = prev.find(p => p.licaoId === licaoId);
          if (progressoExistente) {
            return prev.map(p => p.licaoId === licaoId ? { ...p, salva: isSalvaAtual || false } : p);
          }
          return prev;
        });
    }
  };


  const gerarLicaoComIA = async () => {
    if (!promptIA.trim()) {
      mostrarAviso('Atenção', 'Digite um tópico para gerar a lição');
      return;
    }
  
    try {
      setGerandoLicao(true);
      const resultado = await FirebaseService.gerarLicaoComIA({ prompt: promptIA });
  
      if (resultado.sucesso) {
        await FirebaseService.salvarLicaoGerada(resultado);
        await carregarDados();
        setModalIA(false);
        setPromptIA('');
        mostrarSucesso('Sucesso', 'Lição gerada com sucesso pela IA!');
      } else {
        throw new Error(resultado.erro || 'Erro desconhecido ao gerar lição');
      }
    } catch (error: any) {
      console.error('Erro ao gerar lição:', error);
      mostrarErro('Erro', error.message || 'Não foi possível gerar a lição com a IA.');
    } finally {
      setGerandoLicao(false);
    }
  };

  const renderLicao = (licao: Licao) => {
    const categoriaInfo = obterCategoriaInfo(licao.categoria);
    const progresso = obterProgressoLicao(licao.id!);

    return (
      <Pressable
        key={licao.id}
        style={({pressed}) => [styles.licaoCard, pressed && {backgroundColor: Colors.divider}]}
        onPress={() => navigation.navigate('DetalheLicao', { licaoId: licao.id })}
      >
        <View style={styles.licaoHeader}>
          <View style={[styles.categoriaIcon, { backgroundColor: categoriaInfo.cor }]}>
            <Ionicons name={categoriaInfo.icone as any} size={20} color={Colors.background} />
          </View>
          <View style={styles.licaoInfo}>
            <Text style={styles.licaoTitulo} numberOfLines={2}>
              {licao.titulo}
              {licao.criadoPorIA && (
                <Text style={styles.badgeIA}> ✨ IA</Text>
              )}
            </Text>
            <Text style={styles.licaoCategoria}>{categoriaInfo.nome}</Text>
          </View>
          <View style={styles.licaoStatus}>
            {progresso?.visualizada && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            )}
            <TouchableOpacity onPress={() => toggleFavorito(licao.id!)} style={{padding: 4}}>
              <Ionicons 
                name={progresso?.salva ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color={progresso?.salva ? Colors.warning : Colors.textSecondary} 
              />
            </TouchableOpacity>
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
            {new Date(licao.dataCriacao).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </Pressable>
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

      {/* Container unificado para os filtros */}
      <View style={styles.containerDeFiltros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroContainer}>
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

        <View style={styles.filtroStatusContainer}>
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
        </View>
      </View>

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
      ...Typography.bodyMedium,
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
      ...Typography.h2,
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
      ...Typography.bodyMedium,
      color: Colors.textPrimary,
    },
    containerDeFiltros: { // Novo container para os filtros
        marginBottom: 20,
    },
    filtroContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    filtroItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 10,
        height: 40,
    },
    filtroItemAtivo: {
      backgroundColor: Colors.primary,
    },
    filtroTexto: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginLeft: 6,
    },
    filtroTextoAtivo: {
      color: Colors.background,
      fontWeight: '600' as '600',
    },
    filtroStatusContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingHorizontal: 20,
      gap: 12,
    },
    filtroStatusItem: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 20,
      borderRadius: 20,
      justifyContent: 'center',
      height: 40,
    },
    filtroStatusItemAtivo: {
      backgroundColor: Colors.primary,
    },
    filtroStatusTexto: {
      ...Typography.bodySmall,
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
      alignItems: 'center',
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
      ...Typography.bodyLarge,
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
      ...Typography.small,
      color: Colors.textSecondary,
    },
    licaoStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    licaoResumo: {
      ...Typography.bodySmall,
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
      ...Typography.caption,
      color: Colors.textSecondary,
      marginLeft: 4,
    },
    licaoData: {
      ...Typography.caption,
      color: Colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      ...Typography.h4,
      color: Colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      ...Typography.bodyMedium,
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
      ...Typography.h3,
    },
    modalDescricao: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      lineHeight: 20,
      marginBottom: 20,
    },
    modalInput: {
      backgroundColor: Colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      ...Typography.bodyMedium,
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
      ...Typography.button,
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
      ...Typography.button,
    },
  });