import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contextos/AuthContext';
import { useNotificacao } from '../contextos/NotificacaoContext';
import FirebaseService, { Meta } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';
import DropdownModerno from '../componentes/DropdownModerno';

export default function TelaMetas() {
  const { usuario } = useAuth();
  const { mostrarSucesso, mostrarErro } = useNotificacao();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'ativa' | 'concluida' | 'pausada'>('todas');
  const [modalMeta, setModalMeta] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalProgresso, setModalProgresso] = useState(false);
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null);
  const [metaProgresso, setMetaProgresso] = useState<Meta | null>(null);
  const [formMeta, setFormMeta] = useState({
    titulo: '',
    descricao: '',
    valorMeta: '',
    valorAtual: '',
    categoria: '',
    dataFim: '',
  });
  const [valorProgresso, setValorProgresso] = useState('');

  const carregarMetas = useCallback(async () => {
    if (!usuario) return;
  
    try {
      let metasData = await FirebaseService.listarMetas();
      if (filtroStatus !== 'todas') {
        metasData = metasData.filter(meta => meta.status === filtroStatus);
      }
      setMetas(metasData);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      mostrarErro('Erro', 'Não foi possível carregar as metas');
    } finally {
      setCarregando(false);
    }
  }, [usuario, filtroStatus, mostrarErro]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarMetas();
    setAtualizando(false);
  }, [carregarMetas]);

  useEffect(() => {
    carregarMetas();
  }, [carregarMetas]);

  const abrirModalMeta = () => {
    setFormMeta({
      titulo: '',
      descricao: '',
      valorMeta: '',
      valorAtual: '0',
      categoria: '',
      dataFim: '',
    });
    setModalMeta(true);
  };

  const abrirModalEdicao = (meta: Meta) => {
    setMetaEditando(meta);
    setFormMeta({
      titulo: meta.titulo,
      descricao: meta.descricao || '',
      valorMeta: meta.valorMeta.toString(),
      valorAtual: meta.valorAtual.toString(),
      categoria: meta.categoria,
      dataFim: meta.dataFim,
    });
    setModalEdicao(true);
  };

  const abrirModalProgresso = (meta: Meta) => {
    setMetaProgresso(meta);
    setValorProgresso('');
    setModalProgresso(true);
  };

  const criarMeta = async () => {
    if (!usuario || !formMeta.titulo || !formMeta.valorMeta || !formMeta.categoria || !formMeta.dataFim) {
      mostrarErro('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await FirebaseService.criarMeta({
        titulo: formMeta.titulo,
        descricao: formMeta.descricao,
        valorMeta: parseFloat(formMeta.valorMeta),
        valorAtual: parseFloat(formMeta.valorAtual) || 0,
        categoria: formMeta.categoria,
        status: 'ativa',
        dataInicio: new Date().toISOString(),
        dataFim: formMeta.dataFim,
      });

      setModalMeta(false);
      mostrarSucesso('Sucesso', 'Meta criada com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      mostrarErro('Erro', 'Não foi possível criar a meta');
    }
  };

  const atualizarMeta = async () => {
    if (!metaEditando || !formMeta.titulo || !formMeta.valorMeta || !formMeta.categoria || !formMeta.dataFim) {
      mostrarErro('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await FirebaseService.atualizarMeta(metaEditando.id!, {
        titulo: formMeta.titulo,
        descricao: formMeta.descricao,
        valorMeta: parseFloat(formMeta.valorMeta),
        categoria: formMeta.categoria,
        dataFim: formMeta.dataFim,
      });

      setModalEdicao(false);
      setMetaEditando(null);
      mostrarSucesso('Sucesso', 'Meta atualizada com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      mostrarErro('Erro', 'Não foi possível atualizar a meta');
    }
  };

  const atualizarProgresso = async () => {
    if (!metaProgresso || !valorProgresso) {
      mostrarErro('Erro', 'Por favor, digite um valor');
      return;
    }

    try {
      const novoValor = metaProgresso.valorAtual + parseFloat(valorProgresso);
      await FirebaseService.atualizarMeta(metaProgresso.id!, { valorAtual: novoValor });
      setModalProgresso(false);
      setMetaProgresso(null);
      mostrarSucesso('Sucesso', 'Progresso atualizado com sucesso!');
      onRefresh();
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      mostrarErro('Erro', 'Não foi possível atualizar o progresso');
    }
  };

  const alterarStatusMeta = async (meta: Meta, novoStatus: 'ativa' | 'pausada' | 'concluida') => {
    try {
      await FirebaseService.atualizarMeta(meta.id!, { status: novoStatus });
      mostrarSucesso('Sucesso', `Meta ${novoStatus === 'ativa' ? 'ativada' : novoStatus === 'pausada' ? 'pausada' : 'concluída'} com sucesso!`);
      onRefresh();
    } catch (error) {
      console.error('Erro ao alterar status da meta:', error);
      mostrarErro('Erro', 'Não foi possível alterar o status da meta');
    }
  };

  const excluirMeta = async (meta: Meta) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a meta "${meta.titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await FirebaseService.excluirMeta(meta.id!); 
              mostrarSucesso('Sucesso', 'Meta excluída com sucesso!');
              onRefresh();
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              mostrarErro('Erro', 'Não foi possível excluir a meta');
            }
          },
        },
      ]
    );
  };

  const filtros = [
    { key: 'todas', label: 'Todas' },
    { key: 'ativa', label: 'Ativas' },
    { key: 'concluida', label: 'Concluídas' },
    { key: 'pausada', label: 'Pausadas' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return Colors.success;
      case 'concluida': return Colors.info;
      case 'pausada': return Colors.warning;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa';
      case 'concluida': return 'Concluída';
      case 'pausada': return 'Pausada';
      default: return status;
    }
  };

  const categoriasMeta = [
    { label: 'Viagem', value: 'viagem' },
    { label: 'Carro', value: 'carro' },
    { label: 'Casa', value: 'casa' },
    { label: 'Estudos', value: 'estudos' },
    { label: 'Emergência', value: 'emergencia' },
    { label: 'Outros', value: 'outros' },
  ];

  if (carregando) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <Text style={Typography.bodyMedium}>Carregando metas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Metas</Text>
        <Pressable 
          style={({ pressed }) => [estilos.botaoAdicionar, pressed && estilos.botaoAdicionarPressionado]}
          onPress={abrirModalMeta}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <View style={estilos.filtros}>
        {filtros.map(({ key, label }) => (
          <Pressable
            key={key}
            style={({ pressed }) => [
              estilos.botaoFiltro,
              filtroStatus === key && estilos.botaoFiltroAtivo,
              pressed && estilos.botaoFiltroPressionado,
            ]}
            onPress={() => setFiltroStatus(key as any)}
          >
            <Text style={[
              estilos.textoFiltro,
              filtroStatus === key && estilos.textoFiltroAtivo
            ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {metas.length === 0 ? (
          <View style={estilos.semDados}>
            <Ionicons name="flag-outline" size={64} color={Colors.divider} />
            <Text style={estilos.textoSemDados}>Nenhuma meta encontrada</Text>
            <Text style={estilos.subtextoSemDados}>
              Toque no botão + para criar sua primeira meta
            </Text>
          </View>
        ) : (
          <View style={estilos.listaMetas}>
            {metas.map((meta) => (
              <Pressable key={meta.id} style={({ pressed }) => [estilos.itemMeta, pressed && estilos.itemMetaPressionado]}>
                <View style={estilos.cabecalhoMeta}>
                  <View style={estilos.infoMeta}>
                    <Text style={estilos.tituloMeta}>{meta.titulo}</Text>
                    <Text style={estilos.categoriaMeta}>{meta.categoria}</Text>
                    <View style={[estilos.statusBadge, { backgroundColor: getStatusColor(meta.status) }]}>
                      <Text style={estilos.statusTexto}>{getStatusLabel(meta.status)}</Text>
                    </View>
                  </View>
                  <View style={estilos.acoesMeta}>
                    <Pressable
                      style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                      onPress={() => abrirModalProgresso(meta)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                      onPress={() => abrirModalEdicao(meta)}
                    >
                      <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                      onPress={() => excluirMeta(meta)}
                    >
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </Pressable>
                  </View>
                </View>

                {meta.descricao && (
                  <Text style={estilos.descricaoMeta}>{meta.descricao}</Text>
                )}

                <View style={estilos.progressoContainer}>
                  <View style={estilos.progressoInfo}>
                    <Text style={estilos.progressoTexto}>
                      R$ {meta.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                      R$ {meta.valorMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={estilos.percentualProgresso}>
                      {meta.progressoPercentual?.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={estilos.barraProgresso}>
                    <View 
                      style={[
                        estilos.preenchimentoProgresso,
                        { 
                          width: `${Math.min(meta.progressoPercentual || 0, 100)}%`,
                          backgroundColor: getStatusColor(meta.status)
                        }
                      ]}
                    />
                  </View>
                </View>

                <View style={estilos.dataContainer}>
                  <Text style={estilos.dataTexto}>
                    Prazo: {new Date(meta.dataFim).toLocaleDateString('pt-BR')}
                  </Text>
                  {meta.status === 'ativa' && (
                    <View style={estilos.acoesStatus}>
                      <Pressable
                        style={({ pressed }) => [estilos.botaoStatus, { backgroundColor: Colors.warning }, pressed && estilos.botaoStatusPressionado]}
                        onPress={() => alterarStatusMeta(meta, 'pausada')}
                      >
                        <Text style={estilos.textoBotaoStatus}>Pausar</Text>
                      </Pressable>
                      {meta.progressoPercentual && meta.progressoPercentual >= 100 && (
                        <Pressable
                          style={({ pressed }) => [estilos.botaoStatus, { backgroundColor: Colors.info }, pressed && estilos.botaoStatusPressionado]}
                          onPress={() => alterarStatusMeta(meta, 'concluida')}
                        >
                          <Text style={estilos.textoBotaoStatus}>Concluir</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                  {meta.status === 'pausada' && (
                    <Pressable
                      style={({ pressed }) => [estilos.botaoStatus, { backgroundColor: Colors.success }, pressed && estilos.botaoStatusPressionado]}
                      onPress={() => alterarStatusMeta(meta, 'ativa')}
                    >
                      <Text style={estilos.textoBotaoStatus}>Reativar</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Nova Meta */}
      <Modal
        visible={modalMeta}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalMeta(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Nova Meta</Text>
              <TouchableOpacity onPress={() => setModalMeta(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Título *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Ex: Comprar um carro, Viagem para Europa..."
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.titulo}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, titulo: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Categoria *</Text>
              <DropdownModerno
                opcoes={categoriasMeta}
                valorSelecionado={formMeta.categoria}
                onSelecionar={(value) => setFormMeta(prev => ({ ...prev, categoria: value }))}
                placeholder="Selecione a categoria"
              />

              <Text style={estilos.labelInput}>Valor Objetivo *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.valorMeta}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, valorMeta: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Valor Atual (Opcional)</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="wallet-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.valorAtual}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, valorAtual: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Data Fim *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.dataFim}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, dataFim: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Descrição (Opcional)</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={[estilos.input, estilos.inputMultiline]}
                  placeholder="Descrição da meta..."
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.descricao}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, descricao: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable
                style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]}
                onPress={criarMeta}
              >
                <Text style={estilos.textoBotaoSalvar}>Criar Meta</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição de Meta */}
      <Modal
        visible={modalEdicao}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEdicao(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Editar Meta</Text>
              <TouchableOpacity onPress={() => setModalEdicao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Título *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Ex: Comprar um carro, Viagem para Europa..."
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.titulo}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, titulo: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Categoria *</Text>
              <DropdownModerno
                opcoes={categoriasMeta}
                valorSelecionado={formMeta.categoria}
                onSelecionar={(value) => setFormMeta(prev => ({ ...prev, categoria: value }))}
                placeholder="Selecione a categoria"
              />

              <Text style={estilos.labelInput}>Valor Objetivo *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.valorMeta}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, valorMeta: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Data Fim *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.dataFim}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, dataFim: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Descrição (Opcional)</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={[estilos.input, estilos.inputMultiline]}
                  placeholder="Descrição da meta..."
                  placeholderTextColor={Colors.placeholder}
                  value={formMeta.descricao}
                  onChangeText={(text) => setFormMeta(prev => ({ ...prev, descricao: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable
                style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]}
                onPress={atualizarMeta}
              >
                <Text style={estilos.textoBotaoSalvar}>Atualizar Meta</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Atualização de Progresso */}
      <Modal
        visible={modalProgresso}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalProgresso(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Atualizar Progresso</Text>
              <TouchableOpacity onPress={() => setModalProgresso(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Valor a Adicionar</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={valorProgresso}
                  onChangeText={setValorProgresso}
                  keyboardType="numeric"
                />
              </View>

              <Pressable
                style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]}
                onPress={atualizarProgresso}
              >
                <Text style={estilos.textoBotaoSalvar}>Adicionar Progresso</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    carregando: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    titulo: {
      ...Typography.h2,
      color: Colors.textPrimary,
    },
    botaoAdicionar: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      padding: 8,
    },
    botaoAdicionarPressionado: {
      opacity: 0.8,
    },
    filtros: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    botaoFiltro: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: Colors.card,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    botaoFiltroAtivo: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    botaoFiltroPressionado: {
      opacity: 0.7,
    },
    textoFiltro: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    textoFiltroAtivo: {
      color: Colors.buttonText,
      fontWeight: 'bold' as 'bold',
    },
    conteudo: {
      flex: 1,
      paddingHorizontal: 20,
    },
    semDados: {
      alignItems: 'center',
      paddingVertical: 50,
    },
    textoSemDados: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      marginTop: 10,
    },
    subtextoSemDados: {
      ...Typography.caption,
      color: Colors.textTertiary,
      textAlign: 'center',
      marginTop: 5,
    },
    listaMetas: {},
    itemMeta: {
      backgroundColor: Colors.card,
      borderRadius: 15,
      padding: 15,
      marginBottom: 15,
      elevation: 3,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    itemMetaPressionado: {
      opacity: 0.9,
    },
    cabecalhoMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    infoMeta: {
      flex: 1,
    },
    tituloMeta: {
      ...Typography.bodyLarge,
      color: Colors.textPrimary,
      fontWeight: '600' as '600',
    },
    categoriaMeta: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      borderRadius: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 5,
      alignSelf: 'flex-start',
    },
    statusTexto: {
      ...Typography.caption,
      color: Colors.buttonText,
      fontWeight: 'bold' as 'bold',
    },
    acoesMeta: {
      flexDirection: 'row',
      marginLeft: 10,
    },
    botaoAcao: {
      padding: 5,
      marginLeft: 5,
    },
    botaoAcaoPressionado: {
      opacity: 0.7,
    },
    descricaoMeta: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      marginBottom: 10,
    },
    progressoContainer: {
      marginBottom: 10,
    },
    progressoInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    progressoTexto: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
    },
    percentualProgresso: {
      ...Typography.bodySmall,
      color: Colors.primary,
      fontWeight: 'bold' as 'bold',
    },
    barraProgresso: {
      height: 10,
      backgroundColor: Colors.divider,
      borderRadius: 5,
      overflow: 'hidden',
    },
    preenchimentoProgresso: {
      height: '100%',
      borderRadius: 5,
    },
    dataContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.divider,
      paddingTop: 10,
    },
    dataTexto: {
      ...Typography.caption,
      color: Colors.textTertiary,
    },
    acoesStatus: {
      flexDirection: 'row',
    },
    botaoStatus: {
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginLeft: 8,
    },
    botaoStatusPressionado: {
      opacity: 0.7,
    },
    textoBotaoStatus: {
      fontSize: 12,
      color: Colors.buttonText,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: Colors.background,
      borderRadius: 20,
      width: '90%',
      maxHeight: '90%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    modalTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
    },
    modalBody: {
      padding: 20,
    },
    labelInput: {
      ...Typography.bodyMedium,
      color: Colors.textPrimary,
      marginBottom: 8,
    },
    inputIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.inputBackground,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    inputIcon: {
      paddingLeft: 15,
    },
    input: {
      flex: 1,
      paddingHorizontal: 15,
      height: 50,
      color: Colors.inputText,
      fontSize: 16,
    },
    inputMultiline: {
      height: 100,
      textAlignVertical: 'top',
      paddingVertical: 15,
    },
    botaoSalvar: {
      backgroundColor: Colors.primary,
      borderRadius: 10,
      padding: 15,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    botaoSalvarPressionado: {
      opacity: 0.8,
    },
    textoBotaoSalvar: {
      ...Typography.button,
      color: Colors.buttonText,
    },
  });