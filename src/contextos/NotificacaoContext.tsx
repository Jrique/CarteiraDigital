import React, { createContext, useContext, useState, ReactNode } from 'react';
import NotificacaoModerna, { NotificacaoProps } from '../componentes/NotificacaoModerna';

interface NotificacaoContextType {
  mostrarNotificacao: (notificacao: Omit<NotificacaoProps, 'visivel' | 'onFechar'>) => void;
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
  const [notificacao, setNotificacao] = useState<NotificacaoProps | null>(null);

  const mostrarNotificacao = (novaNotificacao: Omit<NotificacaoProps, 'visivel' | 'onFechar'>) => {
    setNotificacao({
      ...novaNotificacao,
      visivel: true,
      onFechar: () => setNotificacao(null),
    });
  };

  const mostrarSucesso = (titulo: string, mensagem: string) => {
    mostrarNotificacao({
      tipo: 'sucesso',
      titulo,
      mensagem,
    });
  };

  const mostrarErro = (titulo: string, mensagem: string) => {
    mostrarNotificacao({
      tipo: 'erro',
      titulo,
      mensagem,
    });
  };

  const mostrarAviso = (titulo: string, mensagem: string) => {
    mostrarNotificacao({
      tipo: 'aviso',
      titulo,
      mensagem,
    });
  };

  const mostrarInfo = (titulo: string, mensagem: string) => {
    mostrarNotificacao({
      tipo: 'info',
      titulo,
      mensagem,
    });
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
      {notificacao && <NotificacaoModerna {...notificacao} />}
    </NotificacaoContext.Provider>
  );
};

