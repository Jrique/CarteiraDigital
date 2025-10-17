import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../estilos/theme';

export interface NotificacaoProps {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  titulo: string;
  mensagem: string;
  visivel: boolean;
  onFechar: () => void;
  duracao?: number;
}

const CORES_NOTIFICACAO = {
  sucesso: {
    background: Colors.success,
    icone: 'checkmark-circle-outline',
  },
  erro: {
    background: Colors.error,
    icone: 'alert-circle-outline',
  },
  aviso: {
    background: Colors.warning,
    icone: 'warning-outline',
  },
  info: {
    background: Colors.info,
    icone: 'information-circle-outline',
  },
};

export default function NotificacaoModerna({
  tipo,
  titulo,
  mensagem,
  visivel,
  onFechar,
  duracao = 4000,
}: NotificacaoProps) {
  const animacaoY = useRef(new Animated.Value(-100)).current;
  const animacaoOpacidade = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visivel) {
      Animated.parallel([
        Animated.timing(animacaoY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animacaoOpacidade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        fecharNotificacao();
      }, duracao);
    } else {
      fecharNotificacao();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visivel, duracao]);

  const fecharNotificacao = () => {
    Animated.parallel([
      Animated.timing(animacaoY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(animacaoOpacidade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFechar();
    });
  };

  if (!visivel) return null;

  const configNotificacao = CORES_NOTIFICACAO[tipo];

  return (
    <Animated.View
      style={[
        estilos.container,
        {
          transform: [{ translateY: animacaoY }],
          opacity: animacaoOpacidade,
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          estilos.notificacao,
          { backgroundColor: configNotificacao.background },
          pressed && estilos.notificacaoPressionada,
        ]}
        onPress={fecharNotificacao}
      >
        <View style={estilos.conteudo}>
          <View style={estilos.iconeContainer}>
            <Ionicons name={configNotificacao.icone as any} size={24} color={Colors.textPrimary} />
          </View>
          <View style={estilos.textoContainer}>
            <Text style={estilos.titulo}>{titulo}</Text>
            <Text style={estilos.mensagem}>{mensagem}</Text>
          </View>
          <Pressable style={estilos.botaoFechar} onPress={fecharNotificacao}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notificacao: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificacaoPressionada: {
    opacity: 0.9,
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconeContainer: {
    marginRight: 12,
  },
  textoContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  mensagem: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  botaoFechar: {
    padding: 4,
    marginLeft: 8,
  },
});