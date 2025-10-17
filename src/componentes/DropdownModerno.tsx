import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../estilos/theme';

export interface OpcaoDropdown {
  label: string;
  value: string;
  icone?: any;
  cor?: string;
}

export interface DropdownModernoProps {
  opcoes: OpcaoDropdown[];
  valorSelecionado: string;
  onSelecionar: (valor: string) => void;
  placeholder?: string;
  icone?: any;
  disabled?: boolean;
  estilo?: any;
}

export default function DropdownModerno({
  opcoes,
  valorSelecionado,
  onSelecionar,
  placeholder = 'Selecione uma opção',
  icone,
  disabled = false,
  estilo,
}: DropdownModernoProps) {
  const [modalVisivel, setModalVisivel] = useState(false);
  const animacaoRotacao = useRef(new Animated.Value(0)).current;

  const opcaoSelecionada = opcoes && opcoes.length > 0 ? opcoes.find(opcao => opcao.value === valorSelecionado) : null;

  const abrirModal = () => {
    if (disabled) return;
    setModalVisivel(true);
    Animated.timing(animacaoRotacao, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const fecharModal = () => {
    setModalVisivel(false);
    Animated.timing(animacaoRotacao, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const selecionarOpcao = (valor: string) => {
    onSelecionar(valor);
    fecharModal();
  };

  const rotacaoChevron = animacaoRotacao.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          estilos.container,
          disabled && estilos.containerDisabled,
          pressed && !disabled && estilos.containerPressionado,
          estilo,
        ]}
        onPress={abrirModal}
        disabled={disabled}
      >
        <View style={estilos.conteudo}>
          {icone && (
            <Ionicons name={icone} size={20} color={Colors.textSecondary} style={estilos.iconeEsquerda} />
          )}
          
          {opcaoSelecionada?.icone && (
            <View style={[estilos.iconeOpcao, { backgroundColor: opcaoSelecionada.cor || Colors.primary }]}>
              <Ionicons name={opcaoSelecionada.icone} size={14} color={Colors.textPrimary} />
            </View>
          )}

          <Text
            style={[
              estilos.texto,
              !opcaoSelecionada && estilos.placeholder,
              disabled && estilos.textoDisabled,
            ]}
          >
            {opcaoSelecionada?.label || placeholder}
          </Text>

          <Animated.View style={{ transform: [{ rotate: rotacaoChevron }] }}>
            <Ionicons name="chevron-down-outline" size={20} color={Colors.textSecondary} />
          </Animated.View>
        </View>
      </Pressable>

      <Modal
        visible={modalVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <Pressable style={estilos.modalOverlay} onPress={fecharModal}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeader}>
              <Text style={estilos.modalTitulo}>{placeholder}</Text>
              <Pressable onPress={fecharModal} style={estilos.botaoFecharModal}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={estilos.listaOpcoes} showsVerticalScrollIndicator={false}>
              {opcoes.map((opcao, index) => (
                <Pressable
                  key={opcao.value}
                  style={({ pressed }) => [
                    estilos.itemOpcao,
                    valorSelecionado === opcao.value && estilos.itemOpcaoSelecionado,
                    pressed && estilos.itemOpcaoPressionado,
                    index === opcoes.length - 1 && estilos.ultimoItem,
                  ]}
                  onPress={() => selecionarOpcao(opcao.value)}
                >
                  <View style={estilos.conteudoOpcao}>
                    {opcao.icone && (
                      <View style={[estilos.iconeOpcaoModal, { backgroundColor: opcao.cor || Colors.primary }]}>
                        <Ionicons name={opcao.icone} size={18} color={Colors.textPrimary} />
                      </View>
                    )}
                    <Text
                      style={[
                        estilos.textoOpcao,
                        valorSelecionado === opcao.value && estilos.textoOpcaoSelecionado,
                      ]}
                    >
                      {opcao.label}
                    </Text>
                    {valorSelecionado === opcao.value && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.divider,
      minHeight: 48,
      justifyContent: 'center',
    },
    containerDisabled: {
      backgroundColor: Colors.background,
      opacity: 0.6,
    },
    containerPressionado: {
      borderColor: Colors.primary,
      backgroundColor: Colors.background,
    },
    conteudo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    iconeEsquerda: {
      marginRight: 8,
    },
    iconeOpcao: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    texto: {
      fontSize: 16,
      fontWeight: '400' as '400',
      color: Colors.textPrimary,
      flex: 1,
    },
    placeholder: {
      color: Colors.placeholder,
    },
    textoDisabled: {
      color: Colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      width: '100%',
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    modalTitulo: {
      ...Typography.h3,
    },
    botaoFecharModal: {
      padding: 4,
    },
    listaOpcoes: {
      maxHeight: 300,
    },
    itemOpcao: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
    },
    itemOpcaoSelecionado: {
      backgroundColor: Colors.background,
    },
    itemOpcaoPressionado: {
      backgroundColor: Colors.background,
      opacity: 0.7,
    },
    ultimoItem: {
      borderBottomWidth: 0,
    },
    conteudoOpcao: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconeOpcaoModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textoOpcao: {
      fontSize: 16,
      fontWeight: '400' as '400',
      color: Colors.textPrimary,
      flex: 1,
    },
    textoOpcaoSelecionado: {
      fontWeight: '600' as '600',
      color: Colors.primary,
    },
  });