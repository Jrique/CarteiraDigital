# Carteira Digital - Gestão Financeira com IA

## 📖 Sobre o Projeto

A **Carteira Digital** é um aplicativo mobile full-stack, desenvolvido em React Native, que oferece uma solução completa para gestão financeira pessoal. O grande diferencial do projeto é a integração com a **IA Generativa do Google (Gemini)**, que cria lições de educação financeira personalizadas para o usuário, tornando o aprendizado sobre finanças mais acessível e dinâmico.

Além da funcionalidade de IA, o aplicativo permite aos usuários gerenciar múltiplas carteiras, registrar transações, definir e acompanhar metas financeiras e visualizar relatórios de gastos.

## ✨ Funcionalidades Principais

-   **Autenticação de Usuários:** Sistema seguro de cadastro e login com Firebase Authentication.
-   **Gestão de Carteiras:** Crie e gerencie diferentes carteiras (ex: Pessoal, Investimentos).
-   **Registro de Transações:** Adicione despesas e receitas de forma simples e categorizada.
-   **Metas Financeiras:** Defina objetivos financeiros e acompanhe seu progresso.
-   **Educação Financeira com IA:** Uma seção dedicada onde o usuário pode solicitar lições sobre diversos tópicos financeiros, geradas em tempo real pela API do Gemini.
-   **Relatórios Visuais:** Gráficos e relatórios para entender melhor seus padrões de gastos.

## 🚀 Tecnologias Utilizadas

O projeto foi construído com uma stack moderna, focada em performance e escalabilidade.

-   **Frontend (Mobile):**
    -   [React Native](https://reactnative.dev/)
    -   [Expo](https://expo.dev/)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [React Navigation](https://reactnavigation.org/) para o gerenciamento de rotas.
    -   Styled Components para estilização.

-   **Backend (Serverless):**
    -   [Firebase](https://firebase.google.com/)
        -   **Firebase Authentication** para autenticação.
        -   **Firestore** como banco de dados NoSQL.
        -   **Firebase Functions** para a lógica de servidor e comunicação com a API do Gemini.

-   **Inteligência Artificial:**
    -   [Google AI (Gemini API)](https://ai.google.dev/) para a geração de conteúdo educacional.

## 🔧 Instalação e Execução

Para rodar o projeto localmente, siga os passos abaixo.

**Pré-requisitos:**
-   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
-   [Yarn](https://classic.yarnpkg.com/en/docs/install) ou npm
-   Conta no [Firebase](https://firebase.google.com/) para configurar o backend.
-   Chave de API para o [Google Gemini](https://ai.google.dev/).
