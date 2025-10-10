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
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contextos/AuthContext';
import FirebaseService, { Transacao } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';

const { width } = Dimensions.get('window');

interface DadosGrafico {
  periodo: string;
  receitas: number;
  despesas: number;
}

export default function TelaRelatorios() {
  const { usuario } = useAuth();
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroTempo, setFiltroTempo] = useState<'dia' | 'mes' | 'ano'>('mes');
  const [periodoAtual, setPeriodoAtual] = useState(new Date());

  const carregarDados = useCallback(async () => {
    if (!usuario) return;

    try {
      let dados: DadosGrafico[] = [];

      if (filtroTempo === 'dia') {
        dados = await carregarDadosDiarios();
      } else if (filtroTempo === 'mes') {
        dados = await carregarDadosMensais();
      } else {
        dados = await carregarDadosAnuais();
      }

      setDadosGrafico(dados);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do gráfico');
    } finally {
      setCarregando(false);
    }
  }, [usuario, filtroTempo, periodoAtual]);

  const carregarDadosDiarios = async (): Promise<DadosGrafico[]> => {
    const dados: DadosGrafico[] = [];
    const hoje = new Date(periodoAtual);
    
    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - i);
      
      const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      const fimDia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59);

      const transacoes = await obterTransacoesPorPeriodo(inicioDia, fimDia);
      
      const receitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((total, t) => total + t.valor, 0);
      
      const despesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((total, t) => total + t.valor, 0);

      dados.push({
        periodo: data.getDate().toString().padStart(2, '0'),
        receitas,
        despesas,
      });
    }

    return dados;
  };

  const carregarDadosMensais = async (): Promise<DadosGrafico[]> => {
    const dados: DadosGrafico[] = [];
    const anoAtual = periodoAtual.getFullYear();
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, periodoAtual.getMonth() - i, 1);
      const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
      const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59);

      const transacoes = await obterTransacoesPorPeriodo(inicioMes, fimMes);
      
      const receitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((total, t) => total + t.valor, 0);
      
      const despesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((total, t) => total + t.valor, 0);

      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      dados.push({
        periodo: nomesMeses[data.getMonth()],
        receitas,
        despesas,
      });
    }

    return dados;
  };

  const carregarDadosAnuais = async (): Promise<DadosGrafico[]> => {
    const dados: DadosGrafico[] = [];
    const anoAtual = periodoAtual.getFullYear();
    
    // Últimos 5 anos
    for (let i = 4; i >= 0; i--) {
      const ano = anoAtual - i;
      const inicioAno = new Date(ano, 0, 1);
      const fimAno = new Date(ano, 11, 31, 23, 59, 59);

      const transacoes = await obterTransacoesPorPeriodo(inicioAno, fimAno);
      
      const receitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((total, t) => total + t.valor, 0);
      
      const despesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((total, t) => total + t.valor, 0);

      dados.push({
        periodo: ano.toString(),
        receitas,
        despesas,
      });
    }

    return dados;
  };

  const obterTransacoesPorPeriodo = async (inicio: Date, fim: Date): Promise<Transacao[]> => {
    // Aqui você implementaria a busca no Firebase com filtro de data
    // Por simplicidade, vou usar o método existente e filtrar localmente
    const todasTransacoes = await FirebaseService.listarTransacoes();
    
    return todasTransacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data);
      return dataTransacao >= inicio && dataTransacao <= fim;
    });
  };

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarDados();
    setAtualizando(false);
  }, [carregarDados]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const alterarPeriodo = (incremento: number) => {
    const novoPeriodo = new Date(periodoAtual);
    
    if (filtroTempo === 'dia') {
      novoPeriodo.setDate(periodoAtual.getDate() + (incremento * 7));
    } else if (filtroTempo === 'mes') {
      novoPeriodo.setMonth(periodoAtual.getMonth() + (incremento * 6));
    } else {
      novoPeriodo.setFullYear(periodoAtual.getFullYear() + (incremento * 5));
    }
    
    setPeriodoAtual(novoPeriodo);
  };

  const obterTituloPeriodo = () => {
    if (filtroTempo === 'dia') {
      return 'Últimos 7 dias';
    } else if (filtroTempo === 'mes') {
      return 'Últimos 6 meses';
    } else {
      return 'Últimos 5 anos';
    }
  };

  const renderGraficoBarras = () => {
    if (dadosGrafico.length === 0) {
      return (
        <View style={estilos.semDadosGrafico}>
          <Text style={estilos.textoSemDados}>Nenhum dado disponível</Text>
        </View>
      );
    }

    const valorMaximo = Math.max(
      ...dadosGrafico.map(item => Math.max(item.receitas, item.despesas))
    );

    const larguraBarra = (width - 80) / dadosGrafico.length - 20;

    return (
      <View style={estilos.grafico}>
        <View style={estilos.legendaGrafico}>
          <View style={estilos.itemLegenda}>
            <View style={[estilos.corLegenda, { backgroundColor: Colors.success }]} />
            <Text style={estilos.textoLegenda}>Receitas</Text>
          </View>
          <View style={estilos.itemLegenda}>
            <View style={[estilos.corLegenda, { backgroundColor: Colors.error }]} />
            <Text style={estilos.textoLegenda}>Despesas</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.scrollGrafico}>
          <View style={estilos.containerBarras}>
            {dadosGrafico.map((item, index) => (
              <View key={index} style={[estilos.grupoBarra, { width: larguraBarra + 20 }]}>
                <View style={estilos.barrasContainer}>
                  {/* Barra de Receitas */}
                  <View style={estilos.barraIndividual}>
                    <View 
                      style={[
                        estilos.barra,
                        {
                          height: valorMaximo > 0 ? (item.receitas / valorMaximo) * 120 : 0,
                          backgroundColor: Colors.success,
                          width: larguraBarra / 2 - 2,
                        }
                      ]}
                    />
                    <Text style={estilos.valorBarra}>
                      {item.receitas > 0 ? `R$ ${item.receitas.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      })}` : ''}
                    </Text>
                  </View>

                  {/* Barra de Despesas */}
                  <View style={estilos.barraIndividual}>
                    <View 
                      style={[
                        estilos.barra,
                        {
                          height: valorMaximo > 0 ? (item.despesas / valorMaximo) * 120 : 0,
                          backgroundColor: Colors.error,
                          width: larguraBarra / 2 - 2,
                        }
                      ]}
                    />
                    <Text style={estilos.valorBarra}>
                      {item.despesas > 0 ? `R$ ${item.despesas.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      })}` : ''}
                    </Text>
                  </View>
                </View>

                <Text style={estilos.labelPeriodo}>{item.periodo}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const calcularResumo = () => {
    const totalReceitas = dadosGrafico.reduce((total, item) => total + item.receitas, 0);
    const totalDespesas = dadosGrafico.reduce((total, item) => total + item.despesas, 0);
    const saldo = totalReceitas - totalDespesas;

    return { totalReceitas, totalDespesas, saldo };
  };

  const { totalReceitas, totalDespesas, saldo } = calcularResumo();

  if (carregando) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <Text style={Typography.bodyMedium}>Carregando relatório...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Estatísticas</Text>
      </View>

      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Filtros de Tempo */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Período de Análise</Text>
          
          <View style={estilos.filtrosTempo}>
            {(['dia', 'mes', 'ano'] as const).map((filtro) => (
              <Pressable
                key={filtro}
                style={({ pressed }) => [
                  estilos.botaoFiltro,
                  filtroTempo === filtro && estilos.botaoFiltroAtivo,
                  pressed && estilos.botaoFiltroPressionado,
                ]}
                onPress={() => setFiltroTempo(filtro)}
              >
                <Text style={[
                  estilos.textoFiltro,
                  filtroTempo === filtro && estilos.textoFiltroAtivo
                ]}>
                  {filtro === 'dia' ? 'Diário' : filtro === 'mes' ? 'Mensal' : 'Anual'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Resumo Financeiro */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Resumo - {obterTituloPeriodo()}</Text>
          
          <View style={estilos.cardsResumo}>
            <View style={estilos.cardResumo}>
              <View style={[estilos.iconeCard, { backgroundColor: Colors.success + '30' }]}>
                <Ionicons name="trending-up" size={24} color={Colors.success} />
              </View>
              <Text style={estilos.labelCard}>Total Receitas</Text>
              <Text style={[estilos.valorCard, { color: Colors.success }]}>
                R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={estilos.cardResumo}>
              <View style={[estilos.iconeCard, { backgroundColor: Colors.error + '30' }]}>
                <Ionicons name="trending-down" size={24} color={Colors.error} />
              </View>
              <Text style={estilos.labelCard}>Total Despesas</Text>
              <Text style={[estilos.valorCard, { color: Colors.error }]}>
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          <View style={estilos.cardSaldo}>
            <View style={[estilos.iconeCard, { backgroundColor: saldo >= 0 ? Colors.info + '30' : Colors.error + '30' }]}>
              <Ionicons 
                name="wallet" 
                size={24} 
                color={saldo >= 0 ? Colors.info : Colors.error} 
              />
            </View>
            <Text style={estilos.labelCard}>Saldo do Período</Text>
            <Text style={[
              estilos.valorCardGrande,
              { color: saldo >= 0 ? Colors.info : Colors.error }
            ]}>
              {saldo >= 0 ? '+' : ''}R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Gráfico de Barras */}
        <View style={estilos.secao}>
          <View style={estilos.cabecalhoGrafico}>
            <Text style={estilos.tituloSecao}>Receitas vs Despesas</Text>
            <View style={estilos.navegacaoGrafico}>
              <Pressable 
                style={({ pressed }) => [estilos.botaoNavegacao, pressed && estilos.botaoNavegacaoPressionado]}
                onPress={() => alterarPeriodo(-1)}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.primary} />
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [estilos.botaoNavegacao, pressed && estilos.botaoNavegacaoPressionado]}
                onPress={() => alterarPeriodo(1)}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </Pressable>
            </View>
          </View>
          
          {renderGraficoBarras()}
        </View>

        {/* Análise Detalhada */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Análise Detalhada</Text>
          
          <View style={estilos.cardAnalise}>
            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Média de Receitas por Período</Text>
              <Text style={estilos.valorAnalise}>
                R$ {dadosGrafico.length > 0 
                  ? (totalReceitas / dadosGrafico.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '0,00'
                }
              </Text>
            </View>
            
            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Média de Despesas por Período</Text>
              <Text style={estilos.valorAnalise}>
                R$ {dadosGrafico.length > 0 
                  ? (totalDespesas / dadosGrafico.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  : '0,00'
                }
              </Text>
            </View>

            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Taxa de Economia</Text>
              <Text style={[
                estilos.valorAnalise,
                { color: saldo >= 0 ? Colors.success : Colors.error }
              ]}>
                {totalReceitas > 0 
                  ? ((saldo / totalReceitas) * 100).toFixed(1)
                  : '0.0'
                }%
              </Text>
            </View>

            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Melhor Período (Receitas)</Text>
              <Text style={estilos.valorAnalise}>
                {dadosGrafico.length > 0 
                  ? dadosGrafico.reduce((melhor, atual) => 
                      atual.receitas > melhor.receitas ? atual : melhor
                    ).periodo
                  : 'N/A'
                }
              </Text>
            </View>

            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Pior Período (Despesas)</Text>
              <Text style={estilos.valorAnalise}>
                {dadosGrafico.length > 0 
                  ? dadosGrafico.reduce((pior, atual) => 
                      atual.despesas > pior.despesas ? atual : pior
                    ).periodo
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  titulo: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  secao: {
    marginBottom: 20,
  },
  tituloSecao: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 15,
  },
  filtrosTempo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
  },
  botaoFiltro: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoFiltroAtivo: {
    backgroundColor: Colors.primary,
  },
  botaoFiltroPressionado: {
    opacity: 0.7,
  },
  textoFiltro: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  textoFiltroAtivo: {
    color: Colors.buttonText,
    fontWeight: 'bold' as 'bold',
  },
  cardsResumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cardResumo: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  iconeCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  labelCard: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  valorCard: {
    ...Typography.h3,
    fontWeight: 'bold' as 'bold',
  },
  cardSaldo: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  valorCardGrande: {
    ...Typography.h2,
    fontWeight: 'bold' as 'bold',
    marginTop: 10,
  },
  cabecalhoGrafico: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navegacaoGrafico: {
    flexDirection: 'row',
  },
  botaoNavegacao: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    marginLeft: 10,
  },
  botaoNavegacaoPressionado: {
    opacity: 0.7,
  },
  grafico: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  legendaGrafico: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  itemLegenda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  corLegenda: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  textoLegenda: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  scrollGrafico: {
    // Estilos para o scroll do gráfico
  },
  containerBarras: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 10,
  },
  grupoBarra: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 5,
  },
  barrasContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  barraIndividual: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barra: {
    borderRadius: 5,
  },
  valorBarra: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 5,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    bottom: -20,
  },
  labelPeriodo: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  semDadosGrafico: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  cardAnalise: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  itemAnalise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  labelAnalise: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  valorAnalise: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: 'bold' as 'bold',
  },
});


