import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contextos/AuthContext';
import { useNotificacao } from '../contextos/NotificacaoContext';
import FirebaseService, { Transacao, Carteira } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';
import { CATEGORIAS_RECEITA, CATEGORIAS_DESPESA } from '../utils/categorias';
import DropdownModerno from '../componentes/DropdownModerno';

export default function TelaTransacoes() {
  const { usuario } = useAuth();
  const { mostrarSucesso, mostrarErro } = useNotificacao();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modalTransacao, setModalTransacao] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCarteira, setFiltroCarteira] = useState('todas');
  const [formTransacao, setFormTransacao] = useState({
    tipo: 'despesa' as 'receita' | 'despesa',
    categoria: '',
    valor: '',
    descricao: '',
    carteiraId: '',
    data: new Date(),
  });

  const carregarDados = useCallback(async () => {
    if (!usuario) return;

    try {
      const [transacoesData, carteirasData] = await Promise.all([
        FirebaseService.listarTransacoes(),
        FirebaseService.listarCarteiras(),
      ]);
      setTransacoes(transacoesData);
      setCarteiras(carteirasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      mostrarErro('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setCarregando(false);
    }
  }, [usuario, mostrarErro]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  }, [carregarDados]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchTipo = filtroTipo === 'todos' || transacao.tipo === filtroTipo;
    const matchCarteira = filtroCarteira === 'todas' || transacao.carteiraId === filtroCarteira;
    return matchTipo && matchCarteira;
  });

  const resetarForm = () => {
    setFormTransacao({
      tipo: 'despesa',
      categoria: '',
      valor: '',
      descricao: '',
      carteiraId: '',
      data: new Date(),
    });
  };

  const criarTransacao = async () => {
    if (!usuario || !formTransacao.carteiraId || !formTransacao.categoria || !formTransacao.valor) {
      mostrarErro('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await FirebaseService.criarTransacao({
        tipo: formTransacao.tipo,
        categoria: formTransacao.categoria,
        valor: parseFloat(formTransacao.valor),
        descricao: formTransacao.descricao,
        carteiraId: formTransacao.carteiraId,
        data: formTransacao.data.toISOString(),
      });

      setModalTransacao(false);
      resetarForm();
      mostrarSucesso('Sucesso', 'Transação criada com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      mostrarErro('Erro', 'Não foi possível criar a transação.');
    }
  };

  const editarTransacao = async () => {
    if (!transacaoEditando || !formTransacao.categoria || !formTransacao.valor) {
      mostrarErro('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await FirebaseService.atualizarTransacao(transacaoEditando.id!, {
        tipo: formTransacao.tipo,
        categoria: formTransacao.categoria,
        valor: parseFloat(formTransacao.valor),
        descricao: formTransacao.descricao,
      });

      setModalEdicao(false);
      setTransacaoEditando(null);
      resetarForm();
      mostrarSucesso('Sucesso', 'Transação atualizada com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      mostrarErro('Erro', 'Não foi possível editar a transação.');
    }
  };

  const excluirTransacao = async (transacao: Transacao) => {
    try {
      await FirebaseService.excluirTransacao(transacao.id!);
      mostrarSucesso('Sucesso', 'Transação excluída com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      mostrarErro('Erro', 'Não foi possível excluir a transação.');
    }
  };

  const abrirModalEdicao = (transacao: Transacao) => {
    setTransacaoEditando(transacao);
    setFormTransacao({
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      valor: transacao.valor.toString(),
      descricao: transacao.descricao || '',
      carteiraId: transacao.carteiraId,
      data: new Date(transacao.data),
    });
    setModalEdicao(true);
  };

  const obterOpcoesCarteiras = () => {
    return carteiras
      .filter(c => c.ativa)
      .map(carteira => ({
        label: carteira.nome,
        value: carteira.id!,
        icone: carteira.icone,
        cor: carteira.cor,
      }));
  };

  const obterOpcoesCategorias = () => {
    const categorias = formTransacao.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
    return categorias.map(categoria => ({
      label: categoria.nome,
      value: categoria.id,
      icone: categoria.icone,
      cor: categoria.cor,
    }));
  };

  const obterOpcoesFiltroTipo = () => [
    { label: 'Todas', value: 'todos' },
    { label: 'Receitas', value: 'receita' },
    { label: 'Despesas', value: 'despesa' },
  ];

  const obterOpcoesFiltroCarteira = () => [
    { label: 'Todas as Carteiras', value: 'todas' },
    ...carteiras.map(carteira => ({
      label: carteira.nome,
      value: carteira.id!,
      icone: carteira.icone,
      cor: carteira.cor,
    })),
  ];

  const renderTransacao = (transacao: Transacao) => {
    const carteira = carteiras.find(c => c.id === transacao.carteiraId);
    const categoria = [...CATEGORIAS_RECEITA, ...CATEGORIAS_DESPESA].find(c => c.id === transacao.categoria);

    return (
      <View key={transacao.id} style={estilos.cardTransacao}>
        <View style={estilos.cabecalhoTransacao}>
          <View style={estilos.infoTransacao}>
            <View style={[estilos.iconeCategoria, { backgroundColor: categoria?.cor || Colors.primary }]}>
              <Ionicons name={categoria?.icone as any || 'help'} size={20} color={Colors.textPrimary} />
            </View>
            <View style={estilos.detalhesTransacao}>
              <Text style={estilos.categoriaTransacao}>{categoria?.nome || transacao.categoria}</Text>
              <Text style={estilos.carteiraTransacao}>{carteira?.nome || 'Carteira'}</Text>
              <Text style={estilos.dataTransacao}>
                {new Date(transacao.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
          <View style={estilos.valorEAcoes}>
            <Text style={[
              estilos.valorTransacao,
              { color: transacao.tipo === 'receita' ? Colors.success : Colors.error }
            ]}>
              {transacao.tipo === 'receita' ? '+' : '-'} R$ {transacao.valor.toFixed(2)}
            </Text>
            <View style={estilos.acoesTransacao}>
              <Pressable
                style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                onPress={() => abrirModalEdicao(transacao)}
              >
                <Ionicons name="create-outline" size={16} color={Colors.info} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                onPress={() => excluirTransacao(transacao)}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </Pressable>
            </View>
          </View>
        </View>
        {transacao.descricao && (
          <Text style={estilos.descricaoTransacao}>{transacao.descricao}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <View style={estilos.tituloCabecalho}>
          <Text style={estilos.titulo}>Transações</Text>
          <Text style={estilos.subtitulo}>Gerencie suas receitas e despesas</Text>
        </View>
        <Pressable
          style={({ pressed }) => [estilos.botaoAdicionar, pressed && estilos.botaoAdicionarPressionado]}
          onPress={() => setModalTransacao(true)}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Filtros */}
      <View style={estilos.containerFiltros}>
        <View style={estilos.filtro}>
          <Text style={estilos.labelFiltro}>Tipo</Text>
          <DropdownModerno
            opcoes={obterOpcoesFiltroTipo()}
            valorSelecionado={filtroTipo}
            onSelecionar={setFiltroTipo}
            placeholder="Selecione o tipo"
            icone="filter"
          />
        </View>
        <View style={estilos.filtro}>
          <Text style={estilos.labelFiltro}>Carteira</Text>
          <DropdownModerno
            opcoes={obterOpcoesFiltroCarteira()}
            valorSelecionado={filtroCarteira}
            onSelecionar={setFiltroCarteira}
            placeholder="Selecione a carteira"
            icone="wallet"
          />
        </View>
      </View>

      {/* Lista de Transações */}
      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {transacoesFiltradas.length === 0 ? (
          <View style={estilos.semDados}>
            <Ionicons name="card-outline" size={64} color={Colors.divider} />
            <Text style={estilos.textoSemDados}>Nenhuma transação encontrada.</Text>
            <Text style={estilos.subtextoSemDados}>
              Adicione sua primeira transação para começar a controlar suas finanças.
            </Text>
          </View>
        ) : (
          transacoesFiltradas.map(renderTransacao)
        )}
      </ScrollView>

      {/* Modal de Nova Transação */}
      <Modal
        visible={modalTransacao}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalTransacao(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Nova Transação</Text>
              <Pressable onPress={() => setModalTransacao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Tipo</Text>
              <DropdownModerno
                opcoes={[
                  { label: 'Receita', value: 'receita', icone: 'trending-up', cor: Colors.success },
                  { label: 'Despesa', value: 'despesa', icone: 'trending-down', cor: Colors.error },
                ]}
                valorSelecionado={formTransacao.tipo}
                onSelecionar={(valor) => setFormTransacao(prev => ({ ...prev, tipo: valor as 'receita' | 'despesa', categoria: '' }))}
                placeholder="Selecione o tipo"
                estilo={estilos.inputContainer}
              />

              <Text style={estilos.labelInput}>Carteira</Text>
              <DropdownModerno
                opcoes={obterOpcoesCarteiras()}
                valorSelecionado={formTransacao.carteiraId}
                onSelecionar={(valor) => setFormTransacao(prev => ({ ...prev, carteiraId: valor }))}
                placeholder="Selecione a carteira"
                estilo={estilos.inputContainer}
              />

              <Text style={estilos.labelInput}>Categoria</Text>
              <DropdownModerno
                opcoes={obterOpcoesCategorias()}
                valorSelecionado={formTransacao.categoria}
                onSelecionar={(valor) => setFormTransacao(prev => ({ ...prev, categoria: valor }))}
                placeholder="Selecione a categoria"
                estilo={estilos.inputContainer}
              />

              <Text style={estilos.labelInput}>Valor</Text>
              <View style={estilos.inputContainer}>
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formTransacao.valor}
                  onChangeText={(text) => setFormTransacao(prev => ({ ...prev, valor: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Descrição (Opcional)</Text>
              <View style={estilos.inputContainer}>
                <TextInput
                  style={[estilos.input, estilos.inputMultiline]}
                  placeholder="Descrição da transação..."
                  placeholderTextColor={Colors.placeholder}
                  value={formTransacao.descricao}
                  onChangeText={(text) => setFormTransacao(prev => ({ ...prev, descricao: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable
                style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]}
                onPress={criarTransacao}
              >
                <Text style={estilos.textoBotaoSalvar}>Criar Transação</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        visible={modalEdicao}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEdicao(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Editar Transação</Text>
              <Pressable onPress={() => setModalEdicao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Tipo</Text>
              <DropdownModerno
                opcoes={[
                  { label: 'Receita', value: 'receita', icone: 'trending-up', cor: Colors.success },
                  { label: 'Despesa', value: 'despesa', icone: 'trending-down', cor: Colors.error },
                ]}
                valorSelecionado={formTransacao.tipo}
                onSelecionar={(valor) => setFormTransacao(prev => ({ ...prev, tipo: valor as 'receita' | 'despesa', categoria: '' }))}
                placeholder="Selecione o tipo"
                estilo={estilos.inputContainer}
              />

              <Text style={estilos.labelInput}>Categoria</Text>
              <DropdownModerno
                opcoes={obterOpcoesCategorias()}
                valorSelecionado={formTransacao.categoria}
                onSelecionar={(valor) => setFormTransacao(prev => ({ ...prev, categoria: valor }))}
                placeholder="Selecione a categoria"
                estilo={estilos.inputContainer}
              />

              <Text style={estilos.labelInput}>Valor</Text>
              <View style={estilos.inputContainer}>
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formTransacao.valor}
                  onChangeText={(text) => setFormTransacao(prev => ({ ...prev, valor: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Descrição (Opcional)</Text>
              <View style={estilos.inputContainer}>
                <TextInput
                  style={[estilos.input, estilos.inputMultiline]}
                  placeholder="Descrição da transação..."
                  placeholderTextColor={Colors.placeholder}
                  value={formTransacao.descricao}
                  onChangeText={(text) => setFormTransacao(prev => ({ ...prev, descricao: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable
                style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]}
                onPress={editarTransacao}
              >
                <Text style={estilos.textoBotaoSalvar}>Salvar Alterações</Text>
              </Pressable>
            </ScrollView>
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
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tituloCabecalho: {
    flex: 1,
  },
  titulo: {
    ...Typography.h2,
  },
  subtitulo: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  botaoAdicionar: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 8,
  },
  botaoAdicionarPressionado: {
    opacity: 0.7,
  },
  containerFiltros: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.surface,
  },
  filtro: {
    flex: 1,
  },
  labelFiltro: {
    ...Typography.small,
    fontWeight: '500',
    marginBottom: 8,
  },
  conteudo: {
    flex: 1,
    padding: 16,
  },
  cardTransacao: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cabecalhoTransacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTransacao: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconeCategoria: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detalhesTransacao: {
    flex: 1,
  },
  categoriaTransacao: {
    ...Typography.body,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  carteiraTransacao: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dataTransacao: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  valorEAcoes: {
    alignItems: 'flex-end',
  },
  valorTransacao: {
    ...Typography.body,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  acoesTransacao: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoAcao: {
    padding: 6,
  },
  botaoAcaoPressionado: {
    opacity: 0.7,
  },
  descricaoTransacao: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  semDados: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  textoSemDados: {
    ...Typography.body,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  subtextoSemDados: {
    ...Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  },
  modalBody: {
    padding: 20,
  },
  labelInput: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  input: {
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  botaoSalvar: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoSalvarPressionado: {
    opacity: 0.7,
  },
  textoBotaoSalvar: {
    ...Typography.body,
    fontWeight: '600',
  },
});

