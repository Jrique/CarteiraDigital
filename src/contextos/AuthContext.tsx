import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../servicos/firebaseConfig';

interface UsuarioData {
  uid: string;
  email: string;
  displayName?: string;
  nome_completo?: string;
  telefone?: string;
  data_nascimento?: string;
  profissao?: string;
  renda_mensal?: number;
  saldo_atual?: number;
  receitas_mes?: number;
  despesas_mes?: number;
  criado_em?: string;
  atualizado_em?: string;
}

interface AuthContextType {
  usuario: UsuarioData | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registro: (email: string, senha: string, nomeCompleto: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dadosUsuario: Partial<UsuarioData>) => Promise<void>;
  recarregarDadosUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Usuário logado, buscar dados do Firestore
        await carregarDadosUsuario(user);
      } else {
        // Usuário não logado
        setUsuario(null);
      }
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  const carregarDadosUsuario = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUsuario({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          ...userData
        });
      } else {
        // Criar documento do usuário se não existir
        const novoUsuario: UsuarioData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          nome_completo: user.displayName || '',
          saldo_atual: 0,
          receitas_mes: 0,
          despesas_mes: 0,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        };

        await setDoc(doc(db, 'usuarios', user.uid), novoUsuario);
        setUsuario(novoUsuario);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      setCarregando(true);
      await signInWithEmailAndPassword(auth, email, senha);
      // O onAuthStateChanged vai lidar com o resto
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(getErrorMessage(error.code));
    } finally {
      setCarregando(false);
    }
  };

  const registro = async (email: string, senha: string, nomeCompleto: string) => {
    try {
      setCarregando(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      
      // Atualizar o perfil do usuário
      await updateProfile(userCredential.user, {
        displayName: nomeCompleto
      });

      // Criar documento no Firestore
      const novoUsuario: UsuarioData = {
        uid: userCredential.user.uid,
        email: email,
        displayName: nomeCompleto,
        nome_completo: nomeCompleto,
        saldo_atual: 0,
        receitas_mes: 0,
        despesas_mes: 0,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };

      await setDoc(doc(db, 'usuarios', userCredential.user.uid), novoUsuario);
      
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw new Error(getErrorMessage(error.code));
    } finally {
      setCarregando(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  };

  const atualizarUsuario = async (dadosUsuario: Partial<UsuarioData>) => {
    if (!usuario) return;

    try {
      const dadosAtualizados = {
        ...dadosUsuario,
        atualizado_em: new Date().toISOString()
      };

      await updateDoc(doc(db, 'usuarios', usuario.uid), dadosAtualizados);
      
      setUsuario(prev => prev ? { ...prev, ...dadosAtualizados } : null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const recarregarDadosUsuario = async () => {
    if (!auth.currentUser) return;
    await carregarDadosUsuario(auth.currentUser);
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      default:
        return 'Erro de autenticação';
    }
  };

  const value: AuthContextType = {
    usuario,
    carregando,
    login,
    registro,
    logout,
    atualizarUsuario,
    recarregarDadosUsuario,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

