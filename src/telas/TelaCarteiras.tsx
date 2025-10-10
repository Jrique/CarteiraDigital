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
import FirebaseService, { Carteira } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';

const CORES_CARTEIRA = [
  Colors.primary,
  Colors.success,
  Colors.error,
  Colors.warning,
  Colors.info,
  '#8E44AD', // Roxo
  '#2C3E50', // Azul Escuro
  '#E67E22', // Laranja
  '#1ABC9C', // Turquesa
  '#D35400', // Laranja Escuro
];

const ICONES_CARTEIRA = [
  'wallet', 'card', 'cash', 'bank', 'business',
  'home', 'car', 'airplane', 'gift', 'heart',
  'briefcase', 'school', 'fast-food', 'fitness', 'medkit'
];

export default function TelaCarteiras() {
  const { usuario } = useAuth();
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modalCarteira, setModalCarteira] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [carteiraEditando, setCarteiraEditando] = useState<Carteira | null>(null);
  const [formCarteira, setFormCarteira] = useState({
    nome: '',
    descricao: '',
    saldo: '',
    cor: CORES_CARTEIRA[0],
    icone: ICONES_CARTEIRA[0],
  });

  const carregarCarteiras = useCallback(async () => {
    if (!usuario) return;

    try {
      const carteirasData = await FirebaseService.listarCarteiras();
      setCarteiras(carteirasData);
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
      Alert.alert('Erro', 'Não foi possível carregar as carteiras');
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarCarteiras();
    setAtualizando(false);
  }, [carregarCarteiras]);

  useEffect(() => {
    carregarCarteiras();
  }, [carregarCarteiras]);

  const abrirModalCarteira = () => {
    setFormCarteira({
      nome: '',
      descricao: '',
      saldo: '0',
      cor: CORES_CARTEIRA[0],
      icone: ICONES_CARTEIRA[0],
    });
    setModalCarteira(true);
  };

  const abrirModalEdicao = (carteira: Carteira) => {
    setCarteiraEditando(carteira);
    setFormCarteira({
      nome: carteira.nome,
      descricao: carteira.descricao || '',
      saldo: carteira.saldo.toString(),
      cor: carteira.cor,
      icone: carteira.icone,
    });
    setModalEdicao(true);
  };

  const criarCarteira = async () => {
    if (!usuario || !formCarteira.nome) {
      Alert.alert('Erro', 'Por favor, preencha o nome da carteira');
      return;
    }

    try {
      await FirebaseService.criarCarteira({
        nome: formCarteira.nome,
        descricao: formCarteira.descricao,
        saldo: parseFloat(formCarteira.saldo) || 0,
        cor: formCarteira.cor,
        icone: formCarteira.icone,
        ativa: true,
      });

      setModalCarteira(false);
      Alert.alert('Sucesso', 'Carteira criada com sucesso!');
      carregarCarteiras();
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      Alert.alert('Erro', 'Não foi possível criar a carteira');
    }
  };

  const atualizarCarteira = async () => {
    if (!carteiraEditando || !formCarteira.nome) {
      Alert.alert('Erro', 'Por favor, preencha o nome da carteira');
      return;
    }

    try {
      await FirebaseService.atualizarCarteira(carteiraEditando.id!, {
        nome: formCarteira.nome,
        descricao: formCarteira.descricao,
        cor: formCarteira.cor,
        icone: formCarteira.icone,
      });

      setModalEdicao(false);
      setCarteiraEditando(null);
      Alert.alert('Sucesso', 'Carteira atualizada com sucesso!');
      carregarCarteiras();
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a carteira');
    }
  };

  const alternarStatusCarteira = async (carteira: Carteira) => {
    try {
      await FirebaseService.atualizarCarteira(carteira.id!, {
        ativa: !carteira.ativa,
      });

      Alert.alert('Sucesso', `Carteira ${!carteira.ativa ? 'ativada' : 'desativada'} com sucesso!`);
      carregarCarteiras();
    } catch (error) {
      console.error('Erro ao alterar status da carteira:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status da carteira');
    }
  };

  const excluirCarteira = async (carteira: Carteira) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a carteira "${carteira.nome}"?\n\nAtenção: Só é possível excluir carteiras sem transações.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // A função excluirCarteira no FirebaseService não precisa do userId
              await FirebaseService.excluirCarteira(carteira.id!);
              Alert.alert('Sucesso', 'Carteira excluída com sucesso!');
              carregarCarteiras();
            } catch (error: any) {
              console.error('Erro ao excluir carteira:', error);
              Alert.alert('Erro', error.message || 'Não foi possível excluir a carteira');
            }
          },
        },
      ]
    );
  };

  const saldoTotal = carteiras
    .filter(c => c.ativa)
    .reduce((total, carteira) => total + carteira.saldo, 0);

  if (carregando) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <Text style={Typography.bodyMedium}>Carregando carteiras...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Carteiras</Text>
        <Pressable 
          style={({ pressed }) => [estilos.botaoAdicionar, pressed && estilos.botaoAdicionarPressionado]}
          onPress={abrirModalCarteira}
        >
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Resumo */}
      <View style={estilos.resumo}>
        <View style={estilos.cardResumo}>
          <Text style={estilos.labelResumo}>Saldo Total</Text>
          <Text style={estilos.valorResumo}>
            R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={estilos.cardResumo}>
          <Text style={estilos.labelResumo}>Carteiras Ativas</Text>
          <Text style={estilos.valorResumo}>
            {carteiras.filter(c => c.ativa).length}
          </Text>
        </View>
      </View>

      {/* Lista de Carteiras */}
      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {carteiras.length === 0 ? (
          <View style={estilos.semDados}>
            <Ionicons name="wallet-outline" size={64} color={Colors.divider} />
            <Text style={estilos.textoSemDados}>Nenhuma carteira encontrada</Text>
            <Text style={estilos.subtextoSemDados}>
              Toque no botão + para criar sua primeira carteira
            </Text>
          </View>
        ) : (
          <View style={estilos.listaCarteiras}>
            {carteiras.map((carteira) => (
              <Pressable key={carteira.id} style={({ pressed }) => [
                estilos.itemCarteira,
                !carteira.ativa && estilos.carteiraInativa,
                pressed && estilos.itemCarteiraPressionado,
              ]}>
                <View style={estilos.cabecalhoCarteira}>
                  <View style={estilos.infoCarteira}>
                    <View style={[estilos.iconeCarteira, { backgroundColor: carteira.cor }]}>
                      <Ionicons name={carteira.icone as any} size={24} color={Colors.textPrimary} />
                    </View>
                    <View style={estilos.dadosCarteira}>
                      <Text style={estilos.nomeCarteira}>{carteira.nome}</Text>
                      {carteira.descricao && (
                        <Text style={estilos.descricaoCarteira}>{carteira.descricao}</Text>
                      )}
                      <View style={estilos.statusContainer}>
                        <View style={[
                          estilos.statusBadge,
                          { backgroundColor: carteira.ativa ? Colors.success : Colors.warning }
                        ]}>
                          <Text style={estilos.statusTexto}>
                            {carteira.ativa ? 'Ativa' : 'Inativa'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={estilos.saldoContainer}>
                    <Text style={[
                      estilos.saldoCarteira,
                      { color: carteira.saldo >= 0 ? Colors.success : Colors.error }
                    ]}>
                      R$ {carteira.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                <View style={estilos.acoesCarteira}>
                  <Pressable
                    style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                    onPress={() => alternarStatusCarteira(carteira)}
                  >
                    <Ionicons 
                      name={carteira.ativa ? "pause-circle-outline" : "play-circle-outline"} 
                      size={20} 
                      color={carteira.ativa ? Colors.warning : Colors.success} 
                    />
                    <Text style={[estilos.textoAcao, { 
                      color: carteira.ativa ? Colors.warning : Colors.success 
                    }]}>
                      {carteira.ativa ? 'Desativar' : 'Ativar'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                    onPress={() => abrirModalEdicao(carteira)}
                  >
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    <Text style={[estilos.textoAcao, { color: Colors.primary }]}>
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
                    onPress={() => excluirCarteira(carteira)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    <Text style={[estilos.textoAcao, { color: Colors.error }]}>
                      Excluir
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Nova Carteira */}
      <Modal
        visible={modalCarteira}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalCarteira(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Nova Carteira</Text>
              <TouchableOpacity onPress={() => setModalCarteira(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Nome *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Ex: Conta Corrente, Poupança, Dinheiro..."
                  placeholderTextColor={Colors.placeholder}
                  value={formCarteira.nome}
                  onChangeText={(text) => setFormCarteira(prev => ({ ...prev, nome: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Descrição</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Descrição opcional..."
                  placeholderTextColor={Colors.placeholder}
                  value={formCarteira.descricao}
                  onChangeText={(text) => setFormCarteira(prev => ({ ...prev, descricao: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Saldo Inicial</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="0,00"
                  placeholderTextColor={Colors.placeholder}
                  value={formCarteira.saldo}
                  onChangeText={(text) => setFormCarteira(prev => ({ ...prev, saldo: text }))}
                  keyboardType="numeric"
                />
              </View>

              <Text style={estilos.labelInput}>Cor</Text>
              <View style={estilos.seletorCores}>
                {CORES_CARTEIRA.map((cor) => (
                  <Pressable
                    key={cor}
                    style={({ pressed }) => [
                      estilos.corItem,
                      { backgroundColor: cor },
                      formCarteira.cor === cor && estilos.corSelecionada,
                      pressed && estilos.corItemPressionado,
                    ]}
                    onPress={() => setFormCarteira(prev => ({ ...prev, cor }))}
                  >
                    {formCarteira.cor === cor && (
                      <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                    )}
                  </Pressable>
                ))}
              </View>

              <Text style={estilos.labelInput}>Ícone</Text>
              <View style={estilos.seletorIcones}>
                {ICONES_CARTEIRA.map((icone) => (
                  <Pressable
                    key={icone}
                    style={({ pressed }) => [
                      estilos.iconeItem,
                      formCarteira.icone === icone && estilos.iconeSelecionado,
                      pressed && estilos.iconeItemPressionado,
                    ]}
                    onPress={() => setFormCarteira(prev => ({ ...prev, icone }))}
                  >
                    <Ionicons name={icone as any} size={24} color={Colors.textPrimary} />
                  </Pressable>
                ))}
              </View>

              <Pressable style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]} onPress={criarCarteira}>
                <Text style={estilos.textoBotaoSalvar}>Criar Carteira</Text>
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
              <Text style={estilos.modalTitle}>Editar Carteira</Text>
              <TouchableOpacity onPress={() => setModalEdicao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Nome *</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Ex: Conta Corrente, Poupança, Dinheiro..."
                  placeholderTextColor={Colors.placeholder}
                  value={formCarteira.nome}
                  onChangeText={(text) => setFormCarteira(prev => ({ ...prev, nome: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Descrição</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Descrição opcional..."
                  placeholderTextColor={Colors.placeholder}
                  value={formCarteira.descricao}
                  onChangeText={(text) => setFormCarteira(prev => ({ ...prev, descricao: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Cor</Text>
              <View style={estilos.seletorCores}>
                {CORES_CARTEIRA.map((cor) => (
                  <Pressable
                    key={cor}
                    style={({ pressed }) => [
                      estilos.corItem,
                      { backgroundColor: cor },
                      formCarteira.cor === cor && estilos.corSelecionada,
                      pressed && estilos.corItemPressionado,
                    ]}
                    onPress={() => setFormCarteira(prev => ({ ...prev, cor }))}
                  >
                    {formCarteira.cor === cor && (
                      <Ionicons name="checkmark" size={16} color={Colors.textPrimary} />
                    )}
                  </Pressable>
                ))}
              </View>

              <Text style={estilos.labelInput}>Ícone</Text>
              <View style={estilos.seletorIcones}>
                {ICONES_CARTEIRA.map((icone) => (
                  <Pressable
                    key={icone}
                    style={({ pressed }) => [
                      estilos.iconeItem,
                      formCarteira.icone === icone && estilos.iconeSelecionado,
                      pressed && estilos.iconeItemPressionado,
                    ]}
                    onPress={() => setFormCarteira(prev => ({ ...prev, icone }))}
                  >
                    <Ionicons name={icone as any} size={24} color={Colors.textPrimary} />
                  </Pressable>
                ))}
              </View>

              <Pressable style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]} onPress={atualizarCarteira}>
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
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: Colors.surface,
    margin: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardResumo: {
    alignItems: 'center',
  },
  labelResumo: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  valorResumo: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  semDados: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  textoSemDados: {
    ...Typography.h4,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  subtextoSemDados: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    marginTop: 10,
    textAlign: 'center',
  },
  listaCarteiras: {
    marginTop: 20,
  },
  itemCarteira: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  carteiraInativa: {
    opacity: 0.6,
  },
  itemCarteiraPressionado: {
    opacity: 0.9,
  },
  cabecalhoCarteira: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoCarteira: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconeCarteira: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dadosCarteira: {
    flex: 1,
  },
  nomeCarteira: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  descricaoCarteira: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusContainer: {
    marginTop: 5,
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusTexto: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: 'bold' as 'bold',
  },
  saldoContainer: {
    alignItems: 'flex-end',
  },
  saldoCarteira: {
    ...Typography.h4,
  },
  acoesCarteira: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 10,
    marginTop: 10,
  },
  botaoAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
  },
  botaoAcaoPressionado: {
    backgroundColor: Colors.surface,
  },
  textoAcao: {
    ...Typography.bodySmall,
    marginLeft: 5,
    fontWeight: '600' as '600',
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
    maxHeight: '80%',
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
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.inputText,
    fontSize: 16,
    fontWeight: '400' as '400',
  },
  seletorCores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  corItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corSelecionada: {
    borderColor: Colors.primary,
  },
  corItemPressionado: {
    opacity: 0.7,
  },
  seletorIcones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  iconeItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconeSelecionado: {
    borderColor: Colors.primary,
  },
  iconeItemPressionado: {
    opacity: 0.7,
  },
  botaoSalvar: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoSalvarPressionado: {
    opacity: 0.8,
  },
  textoBotaoSalvar: {
    ...Typography.button,
    color: Colors.buttonText,
  },
});


