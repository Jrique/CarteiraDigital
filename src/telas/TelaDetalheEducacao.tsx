import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../estilos/theme';
import { FirebaseService, Licao, ProgressoLicao } from '../servicos/FirebaseService';
import { useNotificacao } from '../contextos/NotificacaoContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalheLicao'>;


const categorias = [
  { id: 'orcamento', nome: 'Orçamento', icone: 'wallet-outline', cor: '#4CAF50' },
  { id: 'dividas', nome: 'Dívidas', icone: 'card-outline', cor: '#FF5722' },
  { id: 'investimentos', nome: 'Investimentos', icone: 'trending-up-outline', cor: '#2196F3' },
  { id: 'economia', nome: 'Economia', icone: 'leaf-outline', cor: '#8BC34A' },
  { id: 'bancos', nome: 'Bancos', icone: 'business-outline', cor: '#607D8B' },
  { id: 'planejamento', nome: 'Planejamento', icone: 'calendar-outline', cor: '#9C27B0' },
  { id: 'Geral', nome: 'Geral', icone: 'help-circle-outline', cor: '#95a5a6' },
];

export default function TelaDetalheLicao({ route, navigation }: Props) {
  const { licaoId } = route.params;
  const [licao, setLicao] = useState<Licao | null>(null);
  const [progresso, setProgresso] = useState<ProgressoLicao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const { mostrarSucesso, mostrarErro } = useNotificacao();

  useEffect(() => {
    carregarLicao();
  }, [licaoId]);

  const carregarLicao = async () => {
    try {
      setCarregando(true);
      const [licaoData, progressoData] = await Promise.all([
        FirebaseService.obterLicao(licaoId),
        FirebaseService.obterProgressoLicao(licaoId),
      ]);
      
      setLicao(licaoData);
      setProgresso(progressoData);
      
      if (licaoData && !progressoData?.visualizada) {
        await marcarComoVisualizada();
      }
    } catch (error) {
      console.error('Erro ao carregar lição:', error);
      mostrarErro('Erro', 'Não foi possível carregar a lição');
      navigation.goBack();
    } finally {
      setCarregando(false);
    }
  };

  const marcarComoVisualizada = async () => {
    try {
      setProgresso(prev => 
        prev 
        ? { ...prev, visualizada: true, dataVisualizacao: new Date().toISOString() } 
        : { licaoId, visualizada: true, salva: false, dataVisualizacao: new Date().toISOString() }
      );
      await FirebaseService.marcarLicaoVisualizada(licaoId);
    } catch (error) {
      console.error('Erro ao marcar como visualizada:', error);
    }
  };

  const toggleSalva = async () => {
    try {
      const novoStatus = !progresso?.salva;
      setProgresso(prev => 
        prev 
        ? { ...prev, salva: novoStatus } 
        : { licaoId, visualizada: true, salva: true }
      );
      
      await FirebaseService.toggleLicaoSalva(licaoId);
      
      mostrarSucesso('Sucesso', novoStatus ? 'Lição salva nos favoritos' : 'Lição removida dos favoritos');
    } catch (error) {
      console.error('Erro ao salvar lição:', error);
      mostrarErro('Erro', 'Não foi possível salvar a lição');
      setProgresso(prev => prev ? { ...prev, salva: !prev.salva } : null);
    }
  };

  const abrirVideoExterno = async () => {
    if (licao?.videoId) {
      try {
        await Linking.openURL(licao.videoId);
      } catch (error) {
        console.error('Erro ao abrir vídeo:', error);
        mostrarErro('Erro', 'Não foi possível abrir o vídeo');
      }
    }
  };

  const obterCategoriaInfo = (categoriaId: string) => {
    return categorias.find(cat => cat.id.toLowerCase() === categoriaId.toLowerCase()) || categorias.find(c => c.id === 'Geral')!;
  };

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando lição...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!licao) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>Lição não encontrada</Text>
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
            <Text style={styles.textoBotaoVoltar}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoriaInfo = obterCategoriaInfo(licao.categoria);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.botaoSalvar}
          onPress={toggleSalva}
        >
          <Ionicons 
            name={progresso?.salva ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={progresso?.salva ? Colors.warning : Colors.textPrimary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.licaoHeader}>
          <View style={[styles.categoriaIcon, { backgroundColor: categoriaInfo.cor }]}>
            <Ionicons name={categoriaInfo.icone as any} size={24} color={Colors.background} />
          </View>
          
          <View style={styles.licaoInfo}>
            <Text style={styles.categoriaTexto}>{categoriaInfo.nome}</Text>
            <Text style={styles.titulo}>
              {licao.titulo}
              {licao.criadoPorIA && (
                <Text style={styles.badgeIA}> ✨ IA</Text>
              )}
            </Text>
            <Text style={styles.dataPublicacao}>
              Publicado em {new Date(licao.dataCriacao).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={progresso?.visualizada ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={20} 
              color={progresso?.visualizada ? Colors.success : Colors.textSecondary} 
            />
            <Text style={[
              styles.statusTexto,
              progresso?.visualizada && styles.statusTextoAtivo
            ]}>
              {progresso?.visualizada ? 'Visualizada' : 'Não visualizada'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={licao.tipo === 'video' ? 'play-circle-outline' : 'document-text-outline'} 
              size={20} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.statusTexto}>
              {licao.tipo === 'video' ? 'Vídeo' : 'Texto'}
            </Text>
          </View>
        </View>

        <View style={styles.resumoContainer}>
          <Text style={styles.resumoTitulo}>Resumo</Text>
          <Text style={styles.resumoTexto}>{licao.resumo}</Text>
        </View>

        {licao.tipo === 'video' && licao.videoId && (
          <View style={styles.videoContainer}>
            <TouchableOpacity style={styles.botaoVideo} onPress={abrirVideoExterno}>
              <Ionicons name="play-circle" size={48} color={Colors.primary} />
              <Text style={styles.textoVideo}>Assistir Vídeo</Text>
              <Text style={styles.subtextoVideo}>Abre no navegador ou app do YouTube</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.conteudoContainer}>
          <Text style={styles.conteudoTitulo}>Conteúdo</Text>
          <Text style={styles.conteudoTexto}>{licao.conteudoTexto}</Text>
        </View>

        <View style={styles.acaoContainer}>
          <TouchableOpacity
            style={[styles.botaoAcao, progresso?.salva && styles.botaoAcaoAtivo]}
            onPress={toggleSalva}
          >
            <Ionicons 
              name={progresso?.salva ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={progresso?.salva ? Colors.background : Colors.primary} 
            />
            <Text style={[
              styles.textoAcao,
              progresso?.salva && styles.textoAcaoAtivo
            ]}>
              {progresso?.salva ? 'Salva nos Favoritos' : 'Salvar nos Favoritos'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoSalvar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  licaoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  categoriaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  licaoInfo: {
    flex: 1,
  },
  categoriaTexto: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 8,
  },
  badgeIA: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.primary,
  },
  dataPublicacao: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTexto: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
  },
  statusTextoAtivo: {
    color: Colors.success,
    fontWeight: '600' as '600',
  },
  resumoContainer: {
    marginBottom: 24,
  },
  resumoTitulo: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  resumoTexto: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  videoContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  botaoVideo: {
    alignItems: 'center',
  },
  textoVideo: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  subtextoVideo: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  conteudoContainer: {
    marginBottom: 32,
  },
  conteudoTitulo: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  conteudoTexto: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  acaoContainer: {
    marginBottom: 32,
  },
  botaoAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 12,
  },
  botaoAcaoAtivo: {
    backgroundColor: Colors.primary,
  },
  textoAcao: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.primary,
  },
  textoAcaoAtivo: {
    color: Colors.background,
  },
  textoBotaoVoltar: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.primary,
  },
});