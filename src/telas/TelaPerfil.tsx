import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contextos/AuthContext';
import FirebaseService, { Aprendizado } from '../servicos/FirebaseService';
import { Colors, Typography } from '../estilos/theme';

export default function TelaPerfil({ navigation }: any) {
  const { usuario, logout, atualizarPerfil } = useAuth();
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalAprendizadosSalvos, setModalAprendizadosSalvos] = useState(false);
  const [aprendizadosSalvos, setAprendizadosSalvos] = useState<Aprendizado[]>([]);
  const [carregandoAprendizados, setCarregandoAprendizados] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nome_completo: usuario?.nome_completo || '',
    telefone: usuario?.telefone || '',
    data_nascimento: usuario?.data_nascimento || '',
    profissao: usuario?.profissao || '',
    renda_mensal: usuario?.renda_mensal?.toString() || '',
  });

  const carregarAprendizadosSalvos = useCallback(async () => {
    if (!usuario) return;

    setCarregandoAprendizados(true);
    try {
      const dados = await FirebaseService.listarAprendizados(usuario.uid, 'salvos');
      setAprendizadosSalvos(dados);
    } catch (error) {
      console.error('Erro ao carregar aprendizados salvos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os aprendizados salvos.');
    } finally {
      setCarregandoAprendizados(false);
    }
  }, [usuario]);

  const onRefresh = useCallback(async () => {
    setAtualizando(true);
    await carregarAprendizadosSalvos();
    setAtualizando(false);
  }, [carregarAprendizadosSalvos]);

  useEffect(() => {
    carregarAprendizadosSalvos();
  }, [carregarAprendizadosSalvos]);

  const selecionarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Necessária', 'É necessário permitir o acesso à galeria para alterar a foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Aqui você implementaria o upload da imagem para o Firebase Storage
        // Por simplicidade, vamos apenas simular a atualização
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        // await atualizarPerfil({ fotoPerfilUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.');
    }
  };

  const tirarFoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Necessária', 'É necessário permitir o acesso à câmera para tirar uma foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Aqui você implementaria o upload da imagem para o Firebase Storage
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        // await atualizarPerfil({ fotoPerfilUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const mostrarOpcoesImagem = () => {
    Alert.alert(
      'Alterar Foto de Perfil',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Galeria', onPress: selecionarFoto },
        { text: 'Câmera', onPress: tirarFoto },
      ]
    );
  };

  const salvarPerfil = async () => {
    try {
      const dadosAtualizados = {
        nome_completo: formPerfil.nome_completo,
        telefone: formPerfil.telefone,
        data_nascimento: formPerfil.data_nascimento,
        profissao: formPerfil.profissao,
        renda_mensal: formPerfil.renda_mensal ? parseFloat(formPerfil.renda_mensal) : undefined,
      };

      await atualizarPerfil(dadosAtualizados);
      setModalEdicao(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  };

  const confirmarLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const removerAprendizadoSalvo = async (aprendizadoId: string) => {
    if (!usuario) return;

    try {
      await FirebaseService.toggleAprendizadoSalvo(aprendizadoId, usuario.uid, false);
      Alert.alert('Sucesso', 'Aprendizado removido dos salvos.');
      carregarAprendizadosSalvos();
    } catch (error) {
      console.error('Erro ao remover aprendizado salvo:', error);
      Alert.alert('Erro', 'Não foi possível remover o aprendizado.');
    }
  };

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Perfil</Text>
        <Pressable style={({ pressed }) => [estilos.botaoEditar, pressed && estilos.botaoEditarPressionado]} onPress={() => setModalEdicao(true)}>
          <Ionicons name="create-outline" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={estilos.conteudo}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Informações do Usuário */}
        <View style={estilos.secaoUsuario}>
          <Pressable style={({ pressed }) => [estilos.containerFoto, pressed && estilos.containerFotoPressionado]} onPress={mostrarOpcoesImagem}>
            {usuario?.fotoPerfilUrl ? (
              <Image source={{ uri: usuario.fotoPerfilUrl }} style={estilos.fotoPerfil} />
            ) : (
              <View style={estilos.fotoPlaceholder}>
                <Ionicons name="person" size={48} color={Colors.textSecondary} />
              </View>
            )}
            <View style={estilos.iconeCamera}>
              <Ionicons name="camera" size={16} color={Colors.textPrimary} />
            </View>
          </Pressable>

          <Text style={estilos.nomeUsuario}>
            {usuario?.nome_completo || usuario?.displayName || usuario?.email}
          </Text>
          <Text style={estilos.emailUsuario}>{usuario?.email}</Text>
        </View>

        {/* Informações Pessoais */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Informações Pessoais</Text>
          
          <View style={estilos.listaInfo}>
            <View style={estilos.itemInfo}>
              <View style={estilos.iconeInfo}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoInfo}>
                <Text style={estilos.labelInfo}>Nome Completo</Text>
                <Text style={estilos.valorInfo}>
                  {usuario?.nome_completo || 'Não informado'}
                </Text>
              </View>
            </View>

            <View style={estilos.itemInfo}>
              <View style={estilos.iconeInfo}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoInfo}>
                <Text style={estilos.labelInfo}>Telefone</Text>
                <Text style={estilos.valorInfo}>
                  {usuario?.telefone || 'Não informado'}
                </Text>
              </View>
            </View>

            <View style={estilos.itemInfo}>
              <View style={estilos.iconeInfo}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoInfo}>
                <Text style={estilos.labelInfo}>Data de Nascimento</Text>
                <Text style={estilos.valorInfo}>
                  {usuario?.data_nascimento || 'Não informado'}
                </Text>
              </View>
            </View>

            <View style={estilos.itemInfo}>
              <View style={estilos.iconeInfo}>
                <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoInfo}>
                <Text style={estilos.labelInfo}>Profissão</Text>
                <Text style={estilos.valorInfo}>
                  {usuario?.profissao || 'Não informado'}
                </Text>
              </View>
            </View>

            <View style={estilos.itemInfo}>
              <View style={estilos.iconeInfo}>
                <Ionicons name="cash-outline" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoInfo}>
                <Text style={estilos.labelInfo}>Renda Mensal</Text>
                <Text style={estilos.valorInfo}>
                  {usuario?.renda_mensal 
                    ? `R$ ${usuario.renda_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : 'Não informado'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Ações</Text>
          
          <View style={estilos.listaAcoes}>
            <Pressable 
              style={({ pressed }) => [estilos.itemAcao, pressed && estilos.itemAcaoPressionado]}
              onPress={() => setModalAprendizadosSalvos(true)}
            >
              <View style={estilos.iconeAcao}>
                <Ionicons name="bookmark" size={20} color={Colors.info} />
              </View>
              <View style={estilos.textoAcao}>
                <Text style={estilos.labelAcao}>Aprendizados Salvos</Text>
                <Text style={estilos.descricaoAcao}>
                  {aprendizadosSalvos.length} aprendizados salvos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [estilos.itemAcao, pressed && estilos.itemAcaoPressionado]}
              onPress={() => navigation.navigate('Carteiras')}
            >
              <View style={estilos.iconeAcao}>
                <Ionicons name="wallet" size={20} color={Colors.primary} />
              </View>
              <View style={estilos.textoAcao}>
                <Text style={estilos.labelAcao}>Gerenciar Carteiras</Text>
                <Text style={estilos.descricaoAcao}>Criar e editar carteiras</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable style={({ pressed }) => [estilos.itemAcao, pressed && estilos.itemAcaoPressionado]}>
              <View style={estilos.iconeAcao}>
                <Ionicons name="settings" size={20} color={Colors.textSecondary} />
              </View>
              <View style={estilos.textoAcao}>
                <Text style={estilos.labelAcao}>Configurações</Text>
                <Text style={estilos.descricaoAcao}>Preferências do aplicativo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable style={({ pressed }) => [estilos.itemAcao, pressed && estilos.itemAcaoPressionado]}>
              <View style={estilos.iconeAcao}>
                <Ionicons name="help-circle" size={20} color={Colors.textSecondary} />
              </View>
              <View style={estilos.textoAcao}>
                <Text style={estilos.labelAcao}>Ajuda e Suporte</Text>
                <Text style={estilos.descricaoAcao}>Central de ajuda</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable style={({ pressed }) => [estilos.itemAcao, pressed && estilos.itemAcaoPressionado]} onPress={confirmarLogout}>
              <View style={estilos.iconeAcao}>
                <Ionicons name="log-out" size={20} color={Colors.error} />
              </View>
              <View style={estilos.textoAcao}>
                <Text style={[estilos.labelAcao, { color: Colors.error }]}>Sair da Conta</Text>
                <Text style={estilos.descricaoAcao}>Fazer logout do aplicativo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={modalEdicao}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEdicao(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setModalEdicao(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              <Text style={estilos.labelInput}>Nome Completo</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Seu nome completo..."
                  placeholderTextColor={Colors.placeholder}
                  value={formPerfil.nome_completo}
                  onChangeText={(text) => setFormPerfil(prev => ({ ...prev, nome_completo: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Telefone</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={Colors.placeholder}
                  value={formPerfil.telefone}
                  onChangeText={(text) => setFormPerfil(prev => ({ ...prev, telefone: text }))}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={estilos.labelInput}>Data de Nascimento</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={Colors.placeholder}
                  value={formPerfil.data_nascimento}
                  onChangeText={(text) => setFormPerfil(prev => ({ ...prev, data_nascimento: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Profissão</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Sua profissão..."
                  placeholderTextColor={Colors.placeholder}
                  value={formPerfil.profissao}
                  onChangeText={(text) => setFormPerfil(prev => ({ ...prev, profissao: text }))}
                />
              </View>

              <Text style={estilos.labelInput}>Renda Mensal</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="cash-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Sua renda mensal..."
                  placeholderTextColor={Colors.placeholder}
                  value={formPerfil.renda_mensal}
                  onChangeText={(text) => setFormPerfil(prev => ({ ...prev, renda_mensal: text }))}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={estilos.modalFooter}>
              <Pressable style={({ pressed }) => [estilos.botaoSalvar, pressed && estilos.botaoSalvarPressionado]} onPress={salvarPerfil}>
                <Text style={estilos.textoBotaoSalvar}>Salvar Alterações</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Aprendizados Salvos */}
      <Modal
        visible={modalAprendizadosSalvos}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalAprendizadosSalvos(false)}
      >
        <View style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitle}>Aprendizados Salvos</Text>
              <TouchableOpacity onPress={() => setModalAprendizadosSalvos(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={estilos.modalBody}>
              {carregandoAprendizados ? (
                <Text style={estilos.textoCarregando}>Carregando...</Text>
              ) : aprendizadosSalvos.length > 0 ? (
                aprendizadosSalvos.map(aprendizado => (
                  <Pressable 
                    key={aprendizado.id}
                    style={({ pressed }) => [estilos.itemAprendizado, pressed && estilos.itemAprendizadoPressionado]}
                    onPress={() => {
                      setModalAprendizadosSalvos(false);
                      navigation.navigate('DetalheEducacao', { aprendizadoId: aprendizado.id });
                    }}
                  >
                    <View style={estilos.textoAprendizado}>
                      <Text style={estilos.tituloAprendizado}>{aprendizado.titulo}</Text>
                      <Text style={estilos.resumoAprendizado}>{aprendizado.resumo}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removerAprendizadoSalvo(aprendizado.id!)}>
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </Pressable>
                ))
              ) : (
                <Text style={estilos.textoVazio}>Nenhum aprendizado salvo.</Text>
              )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 40,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  titulo: {
    ...Typography.h2,
    flex: 1,
    textAlign: 'center',
    marginLeft: 48, // Ajuste para centralizar o título
  },
  botaoEditar: {
    padding: 8,
  },
  botaoEditarPressionado: {
    opacity: 0.7,
  },
  conteudo: {
    flex: 1,
  },
  secaoUsuario: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  containerFoto: {
    position: 'relative',
    marginBottom: 12,
  },
  containerFotoPressionado: {
    opacity: 0.8,
  },
  fotoPerfil: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  fotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.divider,
  },
  iconeCamera: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  nomeUsuario: {
    ...Typography.h2,
    marginBottom: 4,
  },
  emailUsuario: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  secao: {
    marginTop: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tituloSecao: {
    ...Typography.h3,
    marginBottom: 16,
  },
  listaInfo: {
    gap: 16,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeInfo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textoInfo: {
    flex: 1,
  },
  labelInfo: {
    ...Typography.small,
    color: Colors.textSecondary,

    marginBottom: 4,
  },
  valorInfo: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
  },
});

