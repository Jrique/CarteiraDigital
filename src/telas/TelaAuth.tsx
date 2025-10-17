import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contextos/AuthContext';
import { Colors, Typography } from '../estilos/theme';

export default function TelaAuth() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { login, registro } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setCarregando(true);
      await login(email.trim(), senha);
    } catch (error: any) {
      Alert.alert('Erro no Login', error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleRegistro = async () => {
    if (!email.trim() || !senha.trim() || !nomeCompleto.trim() || !confirmarSenha.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      setCarregando(true);
      await registro(email.trim(), senha, nomeCompleto.trim());
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro no Registro', error.message);
    } finally {
      setCarregando(false);
    }
  };

  const alternarModo = () => {
    setModoRegistro(!modoRegistro);
    setEmail('');
    setSenha('');
    setNomeCompleto('');
    setConfirmarSenha('');
  };

  return (
    <SafeAreaView style={estilos.container}>
      <KeyboardAvoidingView 
        style={estilos.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={estilos.scrollContainer}>
          <View style={estilos.conteudo}>
            <View style={estilos.logoContainer}>
              <View style={estilos.logoCirculo}>
                <Ionicons name="wallet" size={48} color={Colors.textPrimary} />
              </View>
              <Text style={estilos.titulo}>Carteira Digital</Text>
              <Text style={estilos.subtitulo}>
                {modoRegistro ? 'Crie sua conta e comece a gerenciar suas finanças' : 'Gerencie suas finanças de forma inteligente'}
              </Text>
            </View>

            <View style={estilos.formulario}>
              {modoRegistro && (
                <>
                  <Text style={estilos.labelInput}>Nome Completo</Text>
                  <View style={estilos.inputIconContainer}>
                    <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                    <TextInput
                      style={estilos.input}
                      placeholder="Digite seu nome completo"
                      placeholderTextColor={Colors.placeholder}
                      value={nomeCompleto}
                      onChangeText={setNomeCompleto}
                      autoCapitalize="words"
                      editable={!carregando}
                    />
                  </View>
                </>
              )}

              <Text style={estilos.labelInput}>Email</Text>
              <View style={estilos.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.input}
                  placeholder="Digite seu email"
                  placeholderTextColor={Colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                />
              </View>

              <Text style={estilos.labelInput}>Senha</Text>
              <View style={estilos.inputSenhaContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                <TextInput
                  style={estilos.inputSenha}
                  placeholder="Digite sua senha"
                  placeholderTextColor={Colors.placeholder}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                />
                <TouchableOpacity
                  style={estilos.botaoMostrarSenha}
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                >
                  <Ionicons 
                    name={mostrarSenha ? "eye-off" : "eye"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>

              {modoRegistro && (
                <>
                  <Text style={estilos.labelInput}>Confirmar Senha</Text>
                  <View style={estilos.inputIconContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={estilos.inputIcon} />
                    <TextInput
                      style={estilos.input}
                      placeholder="Confirme sua senha"
                      placeholderTextColor={Colors.placeholder}
                      value={confirmarSenha}
                      onChangeText={setConfirmarSenha}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!carregando}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[estilos.botaoPrincipal, carregando && estilos.botaoDesabilitado]}
                onPress={modoRegistro ? handleRegistro : handleLogin}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text style={estilos.textoBotaoPrincipal}>
                    {modoRegistro ? 'Criar Conta' : 'Entrar'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={estilos.botaoSecundario}
                onPress={alternarModo}
                disabled={carregando}
              >
                <Text style={estilos.textoBotaoSecundario}>
                  {modoRegistro 
                    ? 'Já tem uma conta? Faça login' 
                    : 'Não tem uma conta? Registre-se'
                  }
                </Text>
              </TouchableOpacity>

              {!modoRegistro && (
                <Text style={estilos.textoInfo}>
                  Use seu email e senha para acessar sua carteira digital
                </Text>
              )}
            </View>

            <View style={estilos.recursos}>
              <View style={estilos.recurso}>
                <Ionicons name="stats-chart" size={24} color={Colors.primary} />
                <Text style={estilos.textoRecurso}>Relatórios detalhados</Text>
              </View>
              <View style={estilos.recurso}>
                <Ionicons name="flag" size={24} color={Colors.primary} />
                <Text style={estilos.textoRecurso}>Metas financeiras</Text>
              </View>
              <View style={estilos.recurso}>
                <Ionicons name="card" size={24} color={Colors.primary} />
                <Text style={estilos.textoRecurso}>Controle de gastos</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  conteudo: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: {
    ...Typography.h1,
    marginBottom: 8,
  },
  subtitulo: {
    ...Typography.bodyLarge, 
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formulario: {
    marginBottom: 32,
  },
  labelInput: {
    ...Typography.bodySmall, 
    fontWeight: '500' as '500', 
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.inputText,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputSenha: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.inputText,
  },
  botaoMostrarSenha: {
    padding: 16,
  },
  botaoPrincipal: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoDesabilitado: {
    backgroundColor: Colors.divider,
  },
  textoBotaoPrincipal: {
    ...Typography.bodyMedium, 
    color: Colors.buttonText,
    fontWeight: '600' as '600', 
  },
  botaoSecundario: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  textoBotaoSecundario: {
    ...Typography.bodySmall, 
    color: Colors.primary,
    fontWeight: '500' as '500', 
  },
  textoInfo: {
    ...Typography.bodySmall, 
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  recursos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  recurso: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  textoRecurso: {
    ...Typography.caption, 
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});