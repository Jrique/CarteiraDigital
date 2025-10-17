import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { BarChart } from 'react-native-gifted-charts';

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

  const obterTransacoesPorPeriodo = async (inicio: Date, fim: Date): Promise<Transacao[]> => {
    const todasTransacoes = await FirebaseService.listarTransacoes();
    
    return todasTransacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data);
      return dataTransacao >= inicio && dataTransacao <= fim;
    });
  };

  const carregarDadosDiarios = async (): Promise<DadosGrafico[]> => {
    const dados: DadosGrafico[] = [];
    const hoje = new Date(periodoAtual);
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - i);
      
      const inicioDia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0);
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
    const mesAtual = periodoAtual.getMonth();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1);
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
        periodo: ano.toString().slice(-2),
        receitas,
        despesas,
      });
    }

    return dados;
  };
  
  const carregarDados = useCallback(async () => {
    if (!usuario) return;

    try {
      setCarregando(true);
      let dados: DadosGrafico[] = [];

      if (filtroTempo === 'dia') {
        dados = await carregarDadosDiarios();
      } else if (filtroTempo === 'mes') {
        dados = await carregarDadosMensais();
      } else {
        dados = await carregarDadosAnuais();
      }
      
      setDadosGrafico(dados.reverse());
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do gráfico');
    } finally {
      setCarregando(false);
    }
  }, [usuario, filtroTempo, periodoAtual]);


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
    if (!dadosGrafico || dadosGrafico.length === 0) {
      return (
        <View style={estilos.semDadosGrafico}>
          <Text style={estilos.textoSemDados}>Nenhum dado disponível</Text>
        </View>
      );
    }
  
    const barWidth = 10;
    const spacingBetweenGroups = 30;
  
    const chartData = dadosGrafico.flatMap(item => ([
      {
        value: item.receitas || 0,
        label: item.periodo,
        spacing: spacingBetweenGroups,
        labelTextStyle: { color: Colors.textSecondary },
        frontColor: Colors.success,
      },
      {
        value: item.despesas || 0,
        frontColor: Colors.error,
      },
    ]));
  
    const valorMaximo = Math.max(...dadosGrafico.map(item => Math.max(item.receitas, item.despesas)));
  
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
  
        <BarChart
          data={chartData}
          barWidth={barWidth}
          initialSpacing={10}
          spacing={2}
          barBorderRadius={4}
          
          yAxisThickness={1}
          yAxisColor={Colors.divider}
          yAxisTextStyle={{ color: Colors.textSecondary }}
          yAxisLabelPrefix="R$ "
          yAxisLabelWidth={55}
          noOfSections={4}
          maxValue={valorMaximo > 0 ? valorMaximo * 1.2 : 100}
          rulesType="dashed"
          rulesColor={'rgba(255, 255, 255, 0.1)'}

          xAxisThickness={1}
          xAxisColor={Colors.divider}

          isAnimated
        />
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
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Estatísticas</Text>
      </View>

      <ScrollView
        style={estilos.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
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
                  ? [...dadosGrafico].sort((a, b) => b.receitas - a.receitas)[0].periodo
                  : 'N/A'
                }
              </Text>
            </View>

            <View style={estilos.itemAnalise}>
              <Text style={estilos.labelAnalise}>Pior Período (Despesas)</Text>
              <Text style={estilos.valorAnalise}>
                {dadosGrafico.length > 0 
                  ? [...dadosGrafico].sort((a, b) => b.despesas - a.despesas)[0].periodo
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
      paddingTop: 40,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    titulo: {
      ...Typography.h2,
      color: Colors.textPrimary,
      textAlign: 'center',
    },
    conteudo: {
      flex: 1,
    },
    secao: {
      marginTop: 20,
      paddingHorizontal: 20,
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
      gap: 15,
    },
    cardResumo: {
      backgroundColor: Colors.card,
      borderRadius: 15,
      padding: 15,
      flex: 1,
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
      gap: 10,
    },
    botaoNavegacao: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: Colors.card,
    },
    botaoNavegacaoPressionado: {
      opacity: 0.7,
    },
    grafico: {
      backgroundColor: Colors.card,
      borderRadius: 15,
      paddingVertical: 20,
      paddingHorizontal: 10,
      elevation: 3,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    legendaGrafico: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
      paddingLeft: 20,
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
    semDadosGrafico: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      height: 250,
    },
    textoSemDados: {
      color: Colors.textSecondary,
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
      marginBottom: 30,
    },
    itemAnalise: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
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