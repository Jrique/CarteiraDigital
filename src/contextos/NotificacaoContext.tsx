import React, { createContext, useContext, useState, ReactNode } from 'react';
import NotificacaoModerna, { NotificacaoProps } from '../componentes/NotificacaoModerna';

interface NotificacaoContextType {
  mostrarNotificacao: (titulo: string, mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso' | 'info') => void;
  mostrarSucesso: (titulo: string, mensagem: string) => void;
  mostrarErro: (titulo: string, mensagem: string) => void;
  mostrarAviso: (titulo: string, mensagem: string) => void;
  mostrarInfo: (titulo: string, mensagem: string) => void;
}

const NotificacaoContext = createContext<NotificacaoContextType | undefined>(undefined);

export const useNotificacao = () => {
  const context = useContext(NotificacaoContext);
  if (!context) {
    throw new Error('useNotificacao deve ser usado dentro de NotificacaoProvider');
  }
  return context;
};

interface NotificacaoProviderProps {
  children: ReactNode;
}

export const NotificacaoProvider: React.FC<NotificacaoProviderProps> = ({ children }) => {
  const [notificacao, setNotificacao] = useState<Omit<NotificacaoProps, 'onFechar'> | null>(null);

  const mostrarNotificacao = (titulo: string, mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso' | 'info') => {
    setNotificacao({
      tipo,
      titulo,
      mensagem,
      visivel: true,
    });
  };

  const mostrarSucesso = (titulo: string, mensagem: string) => {
    mostrarNotificacao(titulo, mensagem, 'sucesso');
  };

  const mostrarErro = (titulo: string, mensagem: string) => {
    mostrarNotificacao(titulo, mensagem, 'erro');
  };

  const mostrarAviso = (titulo: string, mensagem: string) => {
    mostrarNotificacao(titulo, mensagem, 'aviso');
  };

  const mostrarInfo = (titulo: string, mensagem: string) => {
    mostrarNotificacao(titulo, mensagem, 'info');
  };

  return (
    <NotificacaoContext.Provider
      value={{
        mostrarNotificacao,
        mostrarSucesso,
        mostrarErro,
        mostrarAviso,
        mostrarInfo,
      }}
    >
      {children}
      {notificacao && (
        <NotificacaoModerna
          {...notificacao}
          onFechar={() => setNotificacao(null)}
        />
      )}
    </NotificacaoContext.Provider>
  );
};