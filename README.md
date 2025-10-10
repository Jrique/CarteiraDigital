# 💰 Carteira Digital - React Native + Firebase

Um aplicativo completo de gestão financeira pessoal desenvolvido em React Native com Expo e Firebase.

## 🚀 Funcionalidades

### 🔐 Autenticação
- Login e registro com email/senha
- Autenticação persistente com Firebase Auth
- Validação de formulários e tratamento de erros

### 💳 Sistema de Carteiras
- Criação de múltiplas carteiras personalizadas
- Cores e ícones personalizáveis
- Gerenciamento de saldos automático
- CRUD completo de carteiras

### 📊 Transações
- Adicionar receitas e despesas
- Categorias fixas predefinidas (Alimentação, Transporte, etc.)
- Vinculação obrigatória com carteiras
- Histórico completo com filtros
- Edição e exclusão de transações

### 🎯 Metas Financeiras
- Criação e acompanhamento de metas
- Progresso automático em tempo real
- Status de metas (Ativa, Concluída, Pausada)
- Atualização incremental de valores

### 📈 Relatórios e Estatísticas
- Gráficos de barras comparativos (Receitas vs Despesas)
- Filtros por período (Dia, Mês, Ano)
- Dashboard com resumo financeiro
- Análise detalhada e dicas financeiras

### 📚 Educação Financeira
- Sistema completo de aprendizados
- Integração com vídeos do YouTube
- Categorização de conteúdo
- Funcionalidade de marcar como lido
- Sistema de salvos para acesso rápido

### 👤 Perfil de Usuário
- Edição de informações pessoais
- Upload de foto de perfil (câmera/galeria)
- Visualização de aprendizados salvos
- Configurações da conta

### 🎨 Interface
- Tema escuro moderno
- Paleta de cores verde tecnológica
- Design responsivo e intuitivo
- Navegação fluida entre telas

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **Firebase Auth** - Autenticação
- **Firebase Firestore** - Banco de dados
- **React Navigation** - Navegação
- **Expo Image Picker** - Seleção de imagens
- **React Native YouTube iFrame** - Player de vídeos

## 📦 Instalação

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd carteiradigital
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o Firebase:**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Habilite Authentication (Email/Senha)
   - Habilite Firestore Database
   - Copie as credenciais para `src/servicos/firebaseConfig.ts`

4. **Execute o projeto:**
   ```bash
   npx expo start
   ```

## ⚙️ Configuração do Firebase

### 1. Authentication
- Acesse Authentication > Sign-in method
- Habilite "Email/password"

### 2. Firestore Database
- Crie um banco de dados Firestore
- Configure as regras de segurança:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem acessar apenas seus próprios dados
    match /carteiras/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /transacoes/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /metas/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /aprendizados/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Credenciais
Atualize o arquivo `src/servicos/firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
};
```

## 📱 Estrutura do Projeto

```
src/
├── contextos/
│   └── AuthContext.tsx          # Contexto de autenticação
├── estilos/
│   └── theme.ts                 # Tema e cores
├── servicos/
│   ├── firebaseConfig.ts        # Configuração Firebase
│   └── FirebaseService.ts       # Serviços Firebase
├── telas/
│   ├── TelaAuth.tsx            # Login/Registro
│   ├── TelaInicio.tsx          # Dashboard
│   ├── TelaTransacoes.tsx      # Gestão de transações
│   ├── TelaMetas.tsx           # Gestão de metas
│   ├── TelaRelatorios.tsx      # Estatísticas
│   ├── TelaEducacao.tsx        # Educação financeira
│   ├── TelaDetalheEducacao.tsx # Detalhes do aprendizado
│   ├── TelaCarteiras.tsx       # Gestão de carteiras
│   └── TelaPerfil.tsx          # Perfil do usuário
└── utils/
    └── categorias.ts           # Categorias fixas
```

## 🔥 Funcionalidades Firebase

### Coleções Firestore:
- **carteiras** - Dados das carteiras do usuário
- **transacoes** - Histórico de transações
- **metas** - Metas financeiras
- **aprendizados** - Conteúdo educacional

### Relacionamentos:
- Transações vinculadas a carteiras
- Dados isolados por usuário (userId)
- Aprendizados compartilhados entre usuários

## 🎯 Próximos Passos

- [ ] Implementar notificações push
- [ ] Adicionar backup/sincronização
- [ ] Criar relatórios em PDF
- [ ] Implementar categorias personalizadas
- [ ] Adicionar modo offline

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

---

**Desenvolvido com ❤️ usando React Native + Firebase**

