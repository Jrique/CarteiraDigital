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
import { FirebaseService, DashboardData, Transacao, Carteira } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';
import { Picker } from '@react-native-picker/picker';
import { obterCategoriasPorTipo } from '../utils/categorias';
import DropdownModerno from '../componentes/DropdownModerno';
import { useNotificacao } from '../contextos/NotificacaoContext';

export default function TelaInicio({ navigation }: any) {
  const { usuario, recarregarDadosUsuario } = useAuth();
  const { mostrarErro, mostrarSucesso } = useNotificacao();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modalTransacao, setModalTransacao] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState<'receita' | 'despesa'>('receita');
  const [formTransacao, setFormTransacao] = useState({
    categoria: '',
    valor: '',
    descricao: '',
    carteiraId: '',
  });

  const carregarDashboard = useCallback(async () => {
    if (!usuario) return;

    try {
      const data = await FirebaseService.obterDadosDashboard();
      setDashboardData(data);
      if (data.carteiras.length > 0) {
        setFormTransacao(prev => ({ ...prev, carteiraId: data.carteiras[0].id! }));
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      mostrarErro('Erro', 'Não foi possível carregar os dados do dashboard');
    } finally {
      setCarregando(false);
    }
  }, [usuario, mostrarErro]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await Promise.all([
      carregarDashboard(),
      recarregarDadosUsuario(),
    ]);
    setAtualizando(false);
  }, [carregarDashboard, recarregarDadosUsuario]);

  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  const abrirModalTransacao = (tipo: 'receita' | 'despesa') => {
    if (!dashboardData || dashboardData.carteiras.length === 0) {
      mostrarNotificacao(
        'Nenhuma Carteira Disponível',
        'Você precisa criar pelo menos uma carteira antes de adicionar transações.',
        'warning'
      );
      navigation.navigate('Carteiras');
      return;
    }
    setTipoTransacao(tipo);
    const categorias = obterCategoriasPorTipo(tipo);
    setFormTransacao({
      categoria: categorias[0],
      valor: '',
      descricao: '',
      carteiraId: dashboardData.carteiras[0]?.id || '',
    });
    setModalTransacao(true);
  };

  const criarTransacao = async () => {
    if (!usuario || !formTransacao.carteiraId || !formTransacao.categoria || !formTransacao.valor) {
      mostrarErro('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await FirebaseService.criarTransacao({
        carteiraId: formTransacao.carteiraId,
        tipo: tipoTransacao,
        categoria: formTransacao.categoria,
        valor: parseFloat(formTransacao.valor),
        descricao: formTransacao.descricao,
        data: new Date().toISOString(),
      });

      setModalTransacao(false);
      mostrarSucesso('Sucesso', 'Transação criada com sucesso!');
      carregarDashboard();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      mostrarErro('Erro', 'Não foi possível criar a transação');
    }
  };

  const obterNomeCarteira = (carteiraId: string) => {
    const carteira = dashboardData?.carteiras.find((c: Carteira) => c.id === carteiraId);
    return carteira?.nome || 'Carteira não encontrada';
  };

  const obterCorCarteira = (carteiraId: string) => {
    const carteira = dashboardData?.carteiras.find((c: Carteira) => c.id === carteiraId);
    return carteira?.cor || Colors.primary;
  };

  const categoriasForm = obterCategoriasPorTipo(tipoTransacao);

  if (carregando) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <Text style={Typography.bodyMedium}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <Text style={Typography.bodyMedium}>Erro ao carregar dados</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho com Saldo */}
      <View style={estilos.cabecalho}>
        <View style={estilos.saudacao}>
          <Text style={estilos.textoSaudacao}>
            Olá, {usuario?.displayName || usuario?.email}! 👋
          </Text>
          <Text style={estilos.labelSaldo}>Saldo Atual</Text>
          <Text style={estilos.valorSaldo}>
            R$ {dashboardData.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <TouchableOpacity style={estilos.botaoAtualizar} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Resumo do Mês */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Resumo do Mês</Text>
          
          <View style={estilos.cardsResumo}>
            <View style={estilos.cardResumo}>
              <View style={estilos.iconeCard}>
                <Ionicons name="trending-up" size={24} color={Colors.success} />
              </View>
              <Text style={estilos.labelCard}>Receitas</Text>
              <Text style={[estilos.valorCard, { color: Colors.success }]}>
                R$ {dashboardData.receitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={estilos.cardResumo}>
              <View style={estilos.iconeCard}>
                <Ionicons name="trending-down" size={24} color={Colors.error} />
              </View>
              <Text style={estilos.labelCard}>Despesas</Text>
              <Text style={[estilos.valorCard, { color: Colors.error }]}>
                R$ {dashboardData.despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={estilos.cardEconomia}>
            <Text style={estilos.labelEconomia}>Economia do Mês</Text>
            <Text style={[
              estilos.valorEconomia,
              { color: dashboardData.economiaMes >= 0 ? Colors.success : Colors.error }
            ]}>
              {dashboardData.economiaMes >= 0 ? '+' : ''}R$ {dashboardData.economiaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Ações Rápidas</Text>
          
          <View style={estilos.acoesRapidas}>
            <Pressable 
              style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
              onPress={() => abrirModalTransacao('receita')}
            >
              <View style={[estilos.iconeAcao, { backgroundColor: Colors.success + '30' }]}>
                <Ionicons name="add" size={24} color={Colors.success} />
              </View>
              <Text style={estilos.textoAcao}>Nova Receita</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
              onPress={() => abrirModalTransacao('despesa')}
            >
              <View style={[estilos.iconeAcao, { backgroundColor: Colors.error + '30' }]}>
                <Ionicons name="remove" size={24} color={Colors.error} />
              </View>
              <Text style={estilos.textoAcao}>Nova Despesa</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [estilos.botaoAcao, pressed && estilos.botaoAcaoPressionado]}
              onPress={() => navigation.navigate('Carteiras')}
            >
              <View style={[estilos.iconeAcao, { backgroundColor: Colors.info + '30' }]}>
                <Ionicons name="wallet" size={24} color={Colors.info} />
              </View>
              <Text style={estilos.textoAcao}>Gerenciar Carteiras</Text>
            </Pressable>
          </View>
        </View>

        {/* Transações Recentes */}
        <View style={estilos.secao}>
          <View style={estilos.cabecalhoSecao}>
            <Text style={estilos.tituloSecao}>Transações Recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transações')}>
              <Text style={estilos.linkVer}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.transacoesRecentes.length === 0 ? (
            <View style={estilos.semDados}>
              <Ionicons name="receipt-outline" size={48} color={Colors.divider} />
              <Text style={estilos.textoSemDados}>Nenhuma transação encontrada</Text>
              <Text style={estilos.subtextoSemDados}>
                Adicione sua primeira transação usando as ações rápidas acima
              </Text>
            </View>
          ) : (
            <View style={estilos.listaTransacoes}>
              {dashboardData.transacoesRecentes.map((transacao: Transacao) => (
                <View key={transacao.id} style={estilos.itemTransacao}>
                  <View style={estilos.infoTransacao}>
                    <Text style={estilos.categoriaTransacao}>{transacao.categoria}</Text>
                    <Text style={estilos.descricaoTransacao}>{transacao.descricao}</Text>
                    <View style={estilos.detalhesTransacao}>
                      <View style={[estilos.carteiraTag, { backgroundColor: obterCorCarteira(transacao.carteiraId) }]}>
                        <Text style={estilos.carteiraTexto}>{obterNomeCarteira(transacao.carteiraId)}</Text>
                      </View>
                      <Text style={estilos.dataTransacao}>
                        {new Date(transacao.data).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    estilos.valorTransacao,
                    { color: transacao.tipo === 'receita' ? Colors.success : Colors.error }
                  ]}>
                    {transacao.tipo === 'receita' ? '+' : '-'}R$ {transacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Metas Ativas */}
        {dashboardData.metasAtivas.length > 0 && (
          <View style={estilos.secao}>
            <Text style={estilos.tituloSecao}>Metas Ativas</Text>
            
            <View style={estilos.listaMetas}>
              {dashboardData.metasAtivas.map((meta: any) => (
                <View key={meta.id} style={estilos.itemMeta}>
                  <View style={estilos.infoMeta}>
                    <Text style={estilos.tituloMeta}>{meta.titulo}</Text>
                    <Text style={estilos.categoriaMeta}>{meta.categoria}</Text>
                    <Text style={estilos.progressoTexto}>
                      R$ {meta.valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                      R$ {meta.valorObjetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={estilos.progressoContainer}>
                    <Text style={estilos.percentualProgresso}>
                      {meta.progressoPercentual?.toFixed(1)}%
                    </Text>
                    <View style={estilos.barraProgresso}>
                      <View 
                        style={[
                          estilos.preenchimentoProgresso,
                          { width: `${Math.min(meta.progressoPercentual || 0, 100)}%`, backgroundColor: Colors.primary }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Transação */}
      <Modal
        visible={modalTransacao}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalTransacao(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>
                Nova {tipoTransacao === 'receita' ? 'Receita' : 'Despesa'}
              </Text>
              <TouchableOpacity onPress={() => setModalTransacao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Carteira *</Text>
              <View style={estilos.pickerContainer}>
                <DropdownModerno
                  selectedValue={formTransacao.carteiraId}
                  onValueChange={(value: any) => setFormTransacao(prev => ({ ...prev, carteiraId: value }))}
                  options={dashboardData.carteiras.map((c: Carteira) => ({ label: c.nome, value: c.id! }))}
                  placeholder="Selecione uma carteira"
                />
              </View>

              <Text style={estilos.labelInput}>Categoria *</Text>
              <View style={estilos.pickerContainer}>
                <DropdownModerno
                  selectedValue={formTransacao.categoria}
                  onValueChange={(value: any) => setFormTransacao(prev => ({ ...prev, categoria: value }))}
                  options={categoriasForm.map(c => ({ label: c, value: c }))}
                  placeholder="Selecione uma categoria"
                />
              </View>

              <Text style={estilos.labelInput}>Valor *</Text>
              <TextInput
                style={estilos.input}
                placeholder="0,00"
                placeholderTextColor={Colors.placeholder}
                value={formTransacao.valor}
                onChangeText={(text) => setFormTransacao(prev => ({ ...prev, valor: text }))}
                keyboardType="numeric"
              />

              <Text style={estilos.labelInput}>Descrição</Text>
              <TextInput
                style={estilos.input}
                placeholder="Descrição opcional..."
                placeholderTextColor={Colors.placeholder}
                value={formTransacao.descricao}
                onChangeText={(text) => setFormTransacao(prev => ({ ...prev, descricao: text }))}
                multiline
              />

              <TouchableOpacity style={estilos.botaoSalvar} onPress={criarTransacao}>
                <Text style={estilos.textoBotaoSalvar}>Salvar</Text>
              </TouchableOpacity>
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
  saudacao: {
    flex: 1,
  },
  textoSaudacao: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  labelSaldo: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  valorSaldo: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  botaoAtualizar: {
    padding: 10,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  secao: {
    marginBottom: 30,
  },
  tituloSecao: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  cardsResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardResumo: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  iconeCard: {
    marginBottom: 10,
  },
  labelCard: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  valorCard: {
    ...Typography.bodyLarge,
    fontWeight: '600' as '600',
  },
  cardEconomia: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  labelEconomia: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  valorEconomia: {
    ...Typography.h3,
    fontWeight: '700' as '700',
  },
  acoesRapidas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  botaoAcao: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  iconeAcao: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textoAcao: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  botaoAcaoPressionado: {
    opacity: 0.7,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  linkVer: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600' as '600',
  },
  semDados: {
    alignItems: 'center',
    paddingVertical: 30,
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
  listaTransacoes: {
    // Estilos para a lista de transações
  },
  itemTransacao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  infoTransacao: {
    flex: 1,
  },
  categoriaTransacao: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600' as '600',
  },
  descricaoTransacao: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detalhesTransacao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  carteiraTag: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  carteiraTexto: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: 'bold' as 'bold',
  },
  dataTransacao: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  valorTransacao: {
    ...Typography.bodyLarge,
    fontWeight: '700' as '700',
  },
  listaMetas: {
    // Estilos para a lista de metas
  },
  itemMeta: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  infoMeta: {
    marginBottom: 10,
  },
  tituloMeta: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600' as '600',
  },
  categoriaMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressoTexto: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 5,
  },
  progressoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentualProgresso: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold' as 'bold',
    marginRight: 10,
  },
  barraProgresso: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.divider,
    borderRadius: 5,
    overflow: 'hidden',
  },
  preenchimentoProgresso: {
    height: '100%',
    borderRadius: 5,
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
  pickerContainer: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.inputText,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.divider,
    height: 50,
    color: Colors.inputText,
    fontSize: 16,
    fontWeight: '400' as '400',
  },
  botaoSalvar: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  textoBotaoSalvar: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.buttonText,
  },
});


