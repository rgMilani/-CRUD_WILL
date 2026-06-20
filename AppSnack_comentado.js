// ================================================================
// ARQUIVO: AppSnack_comentado.js
// DESCRIÇÃO: Versão comentada do app para fins de apresentação.
//            O código é idêntico ao AppSnack.js (arquivo original),
//            com explicações em cada bloco.
// TECNOLOGIAS: React Native · Expo · Firebase v8 · React Navigation
// ================================================================


// ----------------------------------------------------------------
// 1. IMPORTAÇÕES
// Aqui importamos todas as bibliotecas que o app vai usar.
// ----------------------------------------------------------------

// React e hooks: useState (estado local), useEffect (efeitos),
// createContext/useContext (contexto global de autenticação)
import React, { createContext, useContext, useState, useEffect } from 'react';

// Componentes nativos do React Native para montar as telas
import {
  View,               // bloco de layout (como uma <div>)
  StyleSheet,         // objeto de estilos CSS-like
  ScrollView,         // área com scroll
  Alert,              // caixa de diálogo nativa
  KeyboardAvoidingView, // empurra a tela para cima quando o teclado abre
  Platform            // detecta se é iOS ou Android
} from 'react-native';

// Componentes visuais prontos da biblioteca React Native Paper (Material Design)
import {
  Provider as PaperProvider, // provedor do tema visual
  Appbar,            // barra superior (header)
  Card,              // cartão com elevação
  Title,             // texto título
  Paragraph,         // texto parágrafo
  Button,            // botão estilizado
  TextInput,         // campo de texto
  Text,              // texto simples
  Avatar,            // ícone ou iniciais em círculo
  Chip,              // etiqueta/badge clicável
  Divider,           // linha separadora
  ActivityIndicator, // spinner de carregamento
  FAB,               // botão flutuante (Floating Action Button)
  HelperText         // texto de ajuda/erro abaixo de campos
} from 'react-native-paper';

// Navegação entre telas
import { NavigationContainer } from '@react-navigation/native'; // container principal
import { createStackNavigator } from '@react-navigation/stack'; // navegação em pilha (stack)

// Firebase v8 — importação compatível com Expo Snack
import firebase from 'firebase';      // pacote principal
import 'firebase/auth';               // módulo de autenticação
import 'firebase/firestore';          // módulo de banco de dados


// ================================================================
// 2. CONFIGURAÇÃO DO FIREBASE
// Conectamos o app ao projeto Firebase criado no console.
// Essas credenciais identificam o projeto "crud-will".
// ================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDT-6l6aYQ2H_wAFVAeQtJgJUdkDbPwrNI",
  authDomain: "crud-will.firebaseapp.com",
  projectId: "crud-will",
  storageBucket: "crud-will.firebasestorage.app",
  messagingSenderId: "338452438950",
  appId: "1:338452438950:web:2184c8a4ebc3159dccb967"
};

// Inicializa o Firebase apenas uma vez (evita erro ao recarregar o app)
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// Atalhos para os serviços que vamos usar
const auth = firebase.auth();       // autenticação (login/cadastro/logout)
const db = firebase.firestore();    // banco de dados Firestore


// ================================================================
// 3. CONTEXTO DE AUTENTICAÇÃO (AuthContext)
// Um contexto é uma forma de compartilhar dados entre todas as telas
// sem precisar passar como propriedade manualmente.
// Aqui guardamos: o usuário logado, o estado de carregamento,
// e as funções de registrar, login e logout.
// ================================================================
const AuthContext = createContext({});

function AuthProvider({ children }) {
  // "user" guarda os dados do usuário logado (ou null se deslogado)
  const [user, setUser] = useState(null);
  // "loading" indica se ainda estamos verificando o login inicial
  const [loading, setLoading] = useState(true);

  // useEffect com [] roda uma única vez quando o componente monta.
  // onAuthStateChanged é um "listener" do Firebase: ele é chamado
  // automaticamente sempre que o estado de login muda.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        // Usuário está logado — buscamos os dados extras no Firestore
        const snap = await db.collection('usuarios').doc(u.uid).get();
        setUser({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          perfil: snap.exists ? snap.data() : {}
        });
      } else {
        // Nenhum usuário logado
        setUser(null);
      }
      setLoading(false);
    });
    return unsub; // cancela o listener quando o componente é destruído
  }, []);

  // CADASTRO: cria conta no Firebase Auth e salva dados no Firestore
  const registrar = async (email, senha, nome) => {
    // Cria o usuário no Firebase Authentication
    const cred = await auth.createUserWithEmailAndPassword(email, senha);
    // Atualiza o nome de exibição no perfil de autenticação
    await cred.user.updateProfile({ displayName: nome });
    // Salva os dados extras na coleção "usuarios" do Firestore
    await db.collection('usuarios').doc(cred.user.uid).set({
      nome,
      email,
      telefone: '',
      bio: '',
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp() // data/hora do servidor
    });
    return cred.user;
  };

  // LOGIN: autentica com e-mail e senha
  const login = (email, senha) => auth.signInWithEmailAndPassword(email, senha);

  // LOGOUT: encerra a sessão do usuário
  const logout = () => auth.signOut();

  // Disponibiliza user, loading, registrar, login e logout
  // para todas as telas que usarem useAuth()
  return (
    <AuthContext.Provider value={{ user, loading, registrar, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado — simplifica o acesso ao contexto nas telas
const useAuth = () => useContext(AuthContext);


// ================================================================
// 4. STACK NAVIGATOR
// O Stack Navigator empilha as telas como uma pilha de cartas.
// Navegar para uma tela empilha ela em cima; voltar a remove.
// ================================================================
const Stack = createStackNavigator();


// ================================================================
// 5. TELA DE LOGIN
// Permite que o usuário acesse sua conta com e-mail e senha.
// ================================================================
function LoginScreen({ navigation }) {
  // "navigation" é passado automaticamente pelo Stack Navigator
  // e permite navegar entre telas (navigation.navigate, goBack, etc.)

  const { login } = useAuth(); // pega a função de login do contexto

  // Estados locais da tela
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false); // mostra/oculta senha
  const [loading, setLoading] = useState(false);           // spinner no botão

  // Função chamada ao pressionar "Entrar"
  const handleLogin = async () => {
    // Validação básica antes de chamar o Firebase
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha);
      // Se login OK, o onAuthStateChanged do contexto detecta e redireciona
    } catch (e) {
      // Tradução dos códigos de erro do Firebase para português
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/invalid-credential': 'E-mail ou senha inválidos.',
      };
      Alert.alert('Erro', msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // KeyboardAvoidingView empurra o conteúdo para cima no iOS
    // quando o teclado virtual aparece
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scrollCenter} keyboardShouldPersistTaps="handled">

        {/* Cabeçalho com nome do app */}
        <View style={s.logoArea}>
          <Title style={s.appName}>Gerenciamento</Title>
          <Paragraph style={s.tagline}>Acesse sua conta para continuar</Paragraph>
        </View>

        {/* Card com o formulário de login */}
        <Card style={s.card}>
          <Card.Content>
            <Title style={s.centerTitle}>Entrar</Title>

            {/* Campo e-mail */}
            <TextInput label="E-mail" value={email} onChangeText={setEmail} mode="outlined"
              keyboardType="email-address" autoCapitalize="none" style={s.input} />

            {/* Campo senha com botão de mostrar/ocultar */}
            <TextInput label="Senha" value={senha} onChangeText={setSenha} mode="outlined"
              secureTextEntry={!senhaVisivel} style={s.input}
              right={<TextInput.Icon icon={senhaVisivel ? 'eye-off' : 'eye'}
                onPress={() => setSenhaVisivel(!senhaVisivel)} />} />

            {/* Botão principal de login — mostra spinner enquanto carrega */}
            <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading}
              style={s.btnPrimary}>Entrar</Button>

            <Divider style={s.divider} />
            <Text style={s.centerText}>Ainda não tem conta?</Text>

            {/* Navega para a tela de Cadastro */}
            <Button mode="outlined" onPress={() => navigation.navigate('Cadastro')} disabled={loading}>
              Criar Conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ================================================================
// 6. TELA DE CADASTRO
// Cria uma nova conta no Firebase Authentication e salva os dados
// extras (nome, telefone, bio) no Firestore.
// ================================================================
function CadastroScreen({ navigation }) {
  const { registrar } = useAuth();

  // Estados dos campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  // "diverge" é true quando o campo confirmar está preenchido
  // mas não bate com a senha — usado para mostrar o erro em tempo real
  const diverge = confirmar.length > 0 && senha !== confirmar;

  // Função de cadastro com validações antes de chamar o Firebase
  const handleCadastro = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome.'); return; }
    if (!email.trim()) { Alert.alert('Atenção', 'Informe o e-mail.'); return; }
    if (senha.length < 6) { Alert.alert('Atenção', 'Senha mínimo 6 caracteres.'); return; }
    if (senha !== confirmar) { Alert.alert('Atenção', 'Senhas não coincidem.'); return; }

    setLoading(true);
    try {
      await registrar(email.trim(), senha, nome.trim());
      Alert.alert('Sucesso', 'Conta criada! Bem-vindo(a)!');
      // O onAuthStateChanged detecta o novo login e redireciona para Home
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/invalid-email': 'E-mail inválido.'
      };
      Alert.alert('Erro', msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scrollCenter} keyboardShouldPersistTaps="handled">
        <Card style={s.card}>
          <Card.Content>
            <Title style={s.centerTitle}>Criar Conta</Title>

            <TextInput label="Nome Completo *" value={nome} onChangeText={setNome}
              mode="outlined" autoCapitalize="words" style={s.input} />
            <TextInput label="E-mail *" value={email} onChangeText={setEmail}
              mode="outlined" keyboardType="email-address" autoCapitalize="none" style={s.input} />
            <TextInput label="Senha * (mín. 6 caracteres)" value={senha} onChangeText={setSenha}
              mode="outlined" secureTextEntry={!visivel} style={s.input}
              right={<TextInput.Icon icon={visivel ? 'eye-off' : 'eye'} onPress={() => setVisivel(!visivel)} />} />
            <TextInput label="Confirmar Senha *" value={confirmar} onChangeText={setConfirmar}
              mode="outlined" secureTextEntry={!visivel} style={s.input} error={diverge} />

            {/* Mensagem de erro exibida em tempo real se as senhas diferem */}
            {diverge && <HelperText type="error">As senhas não coincidem.</HelperText>}

            <Text style={s.obs}>* Campos obrigatórios</Text>
            <Button mode="contained" onPress={handleCadastro} loading={loading} disabled={loading}
              style={s.btnPrimary}>Cadastrar</Button>
            <Divider style={s.divider} />

            {/* Volta para Login usando navigate (não goBack) para garantir funcionamento */}
            <Button mode="outlined" onPress={() => navigation.navigate('Login')} disabled={loading}>
              Já tenho conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ================================================================
// 7. TELA HOME (PÁGINA INICIAL)
// Exibida após o login. Mostra as iniciais do usuário e os cards
// de navegação para Perfil e Produtos.
// ================================================================
function HomeScreen({ navigation }) {
  const { logout } = useAuth();

  // Pega o nome do usuário logado para exibir o avatar e a saudação
  const nome = auth.currentUser?.displayName || 'Usuário';
  // Extrai até 2 iniciais do nome para o Avatar (ex: "João Silva" → "JS")
  const iniciais = nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={s.flex}>
      {/* Barra superior com botão de logout */}
      <Appbar.Header>
        <Appbar.Content title="Início" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Avatar e saudação */}
        <View style={{ alignItems: 'center', marginBottom: 30, paddingTop: 10 }}>
          <Avatar.Text size={70} label={iniciais} style={{ backgroundColor: '#6200ee', marginBottom: 12 }} />
          <Title style={{ fontSize: 24 }}>Olá, {nome.split(' ')[0]}!</Title>
          <Text style={{ color: '#666', marginTop: 4 }}>Selecione uma opção abaixo</Text>
        </View>

        {/* Cards de navegação gerados dinamicamente a partir de um array */}
        {[
          { titulo: 'Meu Perfil', desc: 'Visualize e edite seus dados pessoais', icone: 'account-circle', cor: '#6200ee', tela: 'Perfil' },
          { titulo: 'Produtos', desc: 'Gerencie seu catálogo de produtos', icone: 'package-variant', cor: '#2196F3', tela: 'Produtos' },
        ].map(item => (
          // Cada card navega para a tela correspondente ao ser pressionado
          <Card key={item.tela} style={{ marginBottom: 16, elevation: 3 }}
            onPress={() => navigation.navigate(item.tela)}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar.Icon size={56} icon={item.icone} style={{ backgroundColor: item.cor, marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Title style={{ fontSize: 18 }}>{item.titulo}</Title>
                <Paragraph style={{ color: '#666', fontSize: 13 }}>{item.desc}</Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}


// ================================================================
// 8. TELA DE PERFIL — CRUD DO USUÁRIO
// Permite visualizar, editar e excluir os dados pessoais.
// Os dados são lidos e gravados no Firestore.
// ================================================================
function PerfilScreen({ navigation }) {
  const { logout } = useAuth();

  // Estado do perfil com os campos do Firestore
  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', bio: '' });
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [loading, setLoading] = useState(false);   // spinner ao salvar
  const [carregando, setCarregando] = useState(true); // spinner inicial (READ)
  const [modoEdicao, setModoEdicao] = useState(false); // alterna entre visualizar/editar

  // Executa carregarPerfil() assim que a tela abre (READ)
  useEffect(() => { carregarPerfil(); }, []);

  // ── READ: busca os dados do usuário no Firestore ──────────────
  const carregarPerfil = async () => {
    setCarregando(true);
    try {
      // Caminho: coleção "usuarios" → documento com o UID do usuário logado
      const snap = await db.collection('usuarios').doc(auth.currentUser.uid).get();
      if (snap.exists) {
        // Mescla os dados do Firestore com o e-mail do Firebase Auth
        setPerfil({ ...snap.data(), email: auth.currentUser.email });
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setCarregando(false);
    }
  };

  // ── UPDATE: salva as alterações no Firestore ──────────────────
  const salvarPerfil = async () => {
    if (!perfil.nome.trim()) { Alert.alert('Atenção', 'Nome não pode ser vazio.'); return; }
    setLoading(true);
    try {
      // Atualiza apenas os campos permitidos (e-mail não é editável aqui)
      await db.collection('usuarios').doc(auth.currentUser.uid).update({
        nome: perfil.nome.trim(),
        telefone: perfil.telefone.trim(),
        bio: perfil.bio.trim(),
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Troca de senha (opcional) — requer reautenticação por segurança
      if (novaSenha.length >= 6 && senhaAtual) {
        const cred = firebase.auth.EmailAuthProvider.credential(
          auth.currentUser.email, senhaAtual
        );
        await auth.currentUser.reauthenticateWithCredential(cred); // confirma identidade
        await auth.currentUser.updatePassword(novaSenha);          // aplica nova senha
        setSenhaAtual('');
        setNovaSenha('');
      }

      Alert.alert('Sucesso', 'Perfil atualizado!');
      setModoEdicao(false);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE: remove a conta do usuário ────────────────────────
  const excluirConta = () => {
    // Confirmação antes de deletar (ação irreversível)
    Alert.alert('Excluir Conta', 'Esta ação é irreversível. Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          setLoading(true);
          try {
            // 1) Remove o documento do Firestore
            await db.collection('usuarios').doc(auth.currentUser.uid).delete();
            // 2) Remove a conta do Firebase Authentication
            await auth.currentUser.delete();
            // O onAuthStateChanged detecta e redireciona para Login
          } catch (e) {
            Alert.alert('Erro', 'Faça login novamente e tente de novo.');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  // Gera as iniciais para o Avatar da tela de perfil
  const iniciais = (perfil.nome || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  // Exibe spinner enquanto os dados estão sendo carregados do Firestore
  if (carregando) return (
    <View style={s.center}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>Carregando...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Barra superior com botão voltar */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('Home')} />
        <Appbar.Content title="Meu Perfil" />
      </Appbar.Header>

      <ScrollView style={{ backgroundColor: '#f3f4f6' }} keyboardShouldPersistTaps="handled">

        {/* Cabeçalho visual com avatar e nome */}
        <View style={{ alignItems: 'center', padding: 30, backgroundColor: '#6200ee' }}>
          <Avatar.Text size={90} label={iniciais} style={{ backgroundColor: '#03dac4', marginBottom: 12 }} />
          <Title style={{ color: '#fff', fontSize: 22 }}>{perfil.nome || 'Usuário'}</Title>
          <Text style={{ color: '#ddd', fontSize: 14 }}>{auth.currentUser?.email}</Text>
        </View>

        {/* Card com os campos do perfil */}
        <Card style={{ margin: 12, elevation: 3 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title>Dados Pessoais</Title>
              {/* Botão "Editar" só aparece quando NÃO está em modo de edição */}
              {!modoEdicao && (
                <Button onPress={() => setModoEdicao(true)} compact mode="text">Editar</Button>
              )}
            </View>
            <Divider style={s.divider} />

            {/* Os campos ficam desabilitados (disabled) quando não está editando */}
            <TextInput label="Nome Completo *" value={perfil.nome}
              onChangeText={v => setPerfil({ ...perfil, nome: v })}
              mode="outlined" disabled={!modoEdicao} style={s.input} />
            <TextInput label="E-mail" value={perfil.email}
              mode="outlined" disabled style={s.input} />
            <TextInput label="Telefone" value={perfil.telefone}
              onChangeText={v => setPerfil({ ...perfil, telefone: v })}
              mode="outlined" keyboardType="phone-pad" disabled={!modoEdicao} style={s.input} />
            <TextInput label="Bio" value={perfil.bio}
              onChangeText={v => setPerfil({ ...perfil, bio: v })}
              mode="outlined" multiline numberOfLines={3} disabled={!modoEdicao} style={s.input} />

            {/* Seção de troca de senha — só aparece em modo de edição */}
            {modoEdicao && (
              <>
                <Divider style={s.divider} />
                <Title style={{ fontSize: 16, marginBottom: 8 }}>Alterar Senha (opcional)</Title>
                <TextInput label="Senha Atual" value={senhaAtual} onChangeText={setSenhaAtual}
                  mode="outlined" secureTextEntry style={s.input} />
                <TextInput label="Nova Senha (mín. 6 caracteres)" value={novaSenha} onChangeText={setNovaSenha}
                  mode="outlined" secureTextEntry style={s.input} />
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button mode="outlined"
                    onPress={() => { setModoEdicao(false); carregarPerfil(); }}
                    disabled={loading} style={{ flex: 1, marginRight: 4 }}>Cancelar</Button>
                  <Button mode="contained" onPress={salvarPerfil} loading={loading} disabled={loading}
                    style={{ flex: 1, marginLeft: 4 }}>Salvar</Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Card de ações da conta: logout e exclusão */}
        <Card style={{ margin: 12, elevation: 3 }}>
          <Card.Content>
            <Title>Conta</Title>
            <Divider style={s.divider} />
            <Button mode="outlined" onPress={logout} style={{ marginBottom: 10 }}>Sair da Conta</Button>
            <Button mode="contained" color="#FF3B30" onPress={excluirConta} disabled={loading}>
              Excluir Minha Conta
            </Button>
          </Card.Content>
        </Card>
        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


// ================================================================
// 9. TELA DE PRODUTOS — CRUD DA SEGUNDA ENTIDADE
// Lista, cria, edita e exclui produtos vinculados ao usuário logado.
// Os produtos ficam em uma subcoleção: usuarios/{uid}/produtos
//
// IMPORTANTE: sem Modal/Portal — o formulário substitui a lista
// dentro do mesmo componente usando o estado "mostraForm".
// ================================================================

// Categorias disponíveis para seleção
const CATEGORIAS = ['Eletrônico', 'Alimento', 'Vestuário', 'Serviço', 'Outro'];

// Cores associadas a cada categoria (usadas nos chips)
const COR_CAT = {
  'Eletrônico': '#2196F3',
  'Alimento': '#4CAF50',
  'Vestuário': '#9C27B0',
  'Serviço': '#FF9800',
  'Outro': '#607D8B'
};

function ProdutosScreen({ navigation }) {
  const [produtos, setProdutos] = useState([]);      // lista de produtos carregada do Firestore
  const [mostraForm, setMostraForm] = useState(false); // alterna entre lista e formulário
  const [loading, setLoading] = useState(false);     // spinner na lista (READ)
  const [salvando, setSalvando] = useState(false);   // spinner no botão salvar
  const [editando, setEditando] = useState(false);   // true = edição, false = novo

  // Função que retorna um objeto vazio para resetar o formulário
  const novoEstado = () => ({ id: null, nome: '', descricao: '', preco: '', categoria: 'Outro', estoque: '' });
  const [atual, setAtual] = useState(novoEstado()); // produto sendo criado ou editado

  // Carrega a lista assim que a tela abre (READ)
  useEffect(() => { carregar(); }, []);

  // ── READ: busca todos os produtos do usuário no Firestore ─────
  const carregar = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      // Acessa a subcoleção "produtos" dentro do documento do usuário
      const snap = await db.collection('usuarios').doc(uid).collection('produtos').get();
      // Mapeia os documentos para objetos com id + dados
      setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── CREATE / UPDATE: salva produto novo ou atualiza existente ─
  const salvar = async () => {
    // Validações antes de gravar
    if (!atual.nome.trim()) { Alert.alert('Atenção', 'Informe o nome.'); return; }
    const precoNum = parseFloat(atual.preco.replace(',', '.'));
    if (!atual.preco.trim() || isNaN(precoNum)) { Alert.alert('Atenção', 'Preço inválido.'); return; }

    setSalvando(true);
    const uid = auth.currentUser.uid;

    // Objeto com os dados que serão gravados no Firestore
    const dados = {
      nome: atual.nome.trim(),
      descricao: atual.descricao.trim(),
      preco: precoNum,                                        // número (não string)
      categoria: atual.categoria,
      estoque: atual.estoque ? parseInt(atual.estoque) : 0,  // número inteiro
    };

    try {
      if (editando) {
        // UPDATE: atualiza o documento existente pelo ID
        await db.collection('usuarios').doc(uid).collection('produtos').doc(atual.id).update({
          ...dados,
          dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        Alert.alert('Sucesso', 'Produto atualizado!');
      } else {
        // CREATE: adiciona novo documento (ID gerado automaticamente pelo Firestore)
        await db.collection('usuarios').doc(uid).collection('produtos').add({
          ...dados,
          dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        Alert.alert('Sucesso', 'Produto cadastrado!');
      }

      // Volta para a lista e recarrega os dados
      setMostraForm(false);
      setAtual(novoEstado());
      setEditando(false);
      carregar();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  };

  // ── DELETE: exclui produto com confirmação ────────────────────
  const excluir = (p) => {
    Alert.alert('Confirmar', 'Excluir "' + p.nome + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await db.collection('usuarios').doc(auth.currentUser.uid)
              .collection('produtos').doc(p.id).delete();
            carregar(); // recarrega a lista após deletar
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        }
      }
    ]);
  };

  // Prepara o formulário com os dados do produto para edição
  const abrirEdicao = (p) => {
    setAtual({
      ...p,
      preco: p.preco?.toString().replace('.', ',') || '',   // converte ponto para vírgula
      estoque: p.estoque?.toString() || ''
    });
    setEditando(true);
    setMostraForm(true); // mostra o formulário no lugar da lista
  };


  // ── FORMULÁRIO (sem Modal — substituição direta da tela) ──────
  // Quando mostraForm === true, renderiza o formulário no lugar da lista.
  // Isso evita problemas com Portal/Modal no ambiente do Expo Snack.
  if (mostraForm) {
    return (
      <View style={s.flex}>
        {/* Botão voltar fecha o formulário e volta à lista */}
        <Appbar.Header>
          <Appbar.BackAction onPress={() => {
            setMostraForm(false);
            setAtual(novoEstado());
            setEditando(false);
          }} />
          <Appbar.Content title={editando ? 'Editar Produto' : 'Novo Produto'} />
        </Appbar.Header>

        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <TextInput label="Nome *" value={atual.nome}
            onChangeText={v => setAtual({ ...atual, nome: v })}
            mode="outlined" style={s.input} />
          <TextInput label="Descrição" value={atual.descricao}
            onChangeText={v => setAtual({ ...atual, descricao: v })}
            mode="outlined" multiline numberOfLines={3} style={s.input} />
          <TextInput label="Preço (R$) *" value={atual.preco}
            onChangeText={v => setAtual({ ...atual, preco: v })}
            mode="outlined" keyboardType="decimal-pad" style={s.input} />
          <TextInput label="Estoque (un.)" value={atual.estoque}
            onChangeText={v => setAtual({ ...atual, estoque: v })}
            mode="outlined" keyboardType="number-pad" style={s.input} />

          {/* Seleção de categoria com chips (botões de seleção visual) */}
          <Text style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Categoria *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIAS.map(cat => (
              // Chip fica "selecionado" quando é a categoria atual
              <Chip key={cat} selected={atual.categoria === cat}
                onPress={() => setAtual({ ...atual, categoria: cat })}
                style={{ marginRight: 6, marginBottom: 6 }}>{cat}</Chip>
            ))}
          </View>

          <Text style={s.obs}>* Campos obrigatórios</Text>

          {/* Botão muda o texto dependendo se é criação ou edição */}
          <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}
            style={{ marginBottom: 12 }}>
            {editando ? 'Atualizar' : 'Salvar'}
          </Button>
          <Button mode="outlined"
            onPress={() => { setMostraForm(false); setAtual(novoEstado()); setEditando(false); }}
            disabled={salvando}>
            Cancelar
          </Button>
        </ScrollView>
      </View>
    );
  }


  // ── LISTA DE PRODUTOS ─────────────────────────────────────────
  return (
    <View style={s.flex}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('Home')} />
        {/* subtitle mostra a quantidade de produtos cadastrados */}
        <Appbar.Content title="Produtos" subtitle={produtos.length + ' cadastrado(s)'} />
        <Appbar.Action icon="refresh" onPress={carregar} />
      </Appbar.Header>

      <ScrollView style={{ padding: 10 }}>
        {/* Estado 1: carregando */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Carregando...</Text>
          </View>
        ) : produtos.length === 0 ? (
          /* Estado 2: lista vazia */
          <Card style={{ margin: 16 }}>
            <Card.Content style={{ alignItems: 'center', padding: 30 }}>
              <Avatar.Icon size={64} icon="package-variant" style={{ backgroundColor: '#e0e0e0', marginBottom: 16 }} />
              <Title style={{ textAlign: 'center' }}>Nenhum produto</Title>
              <Paragraph style={{ textAlign: 'center', color: '#888' }}>Toque no + para adicionar.</Paragraph>
            </Card.Content>
          </Card>
        ) : (
          /* Estado 3: lista com produtos */
          produtos.map(p => (
            <Card key={p.id} style={{ margin: 8, elevation: 3 }}>
              <Card.Content>
                {/* Linha principal: nome, categoria, preço e estoque */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Title style={{ fontSize: 16 }}>{p.nome}</Title>
                    <Chip style={{ alignSelf: 'flex-start', marginTop: 4 }}>{p.categoria}</Chip>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2e7d32' }}>
                      {'R$ ' + parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>Estoque: {p.estoque ?? 0}</Text>
                  </View>
                </View>

                {/* Descrição só aparece se o produto tiver descrição */}
                {p.descricao ? (
                  <>
                    <Divider style={{ marginVertical: 8 }} />
                    <Paragraph style={{ color: '#555' }}>{p.descricao}</Paragraph>
                  </>
                ) : null}

                <Divider style={{ marginVertical: 8 }} />

                {/* Botões de ação: Editar e Excluir */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <Button mode="outlined" onPress={() => abrirEdicao(p)}
                    compact style={{ marginRight: 8 }}>Editar</Button>
                  <Button mode="contained" color="#FF3B30" onPress={() => excluir(p)} compact>
                    Excluir
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FAB (botão flutuante +) — abre o formulário para novo produto */}
      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => { setAtual(novoEstado()); setEditando(false); setMostraForm(true); }} />
    </View>
  );
}


// ================================================================
// 10. NAVEGAÇÃO PRINCIPAL
// Decide quais telas mostrar com base no estado de login:
// - Usuário logado → Home, Perfil, Produtos
// - Usuário deslogado → Login, Cadastro
// ================================================================
function Navigation() {
  const { user, loading } = useAuth();

  // Enquanto verifica o estado de login, exibe um spinner
  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );

  return (
    <NavigationContainer>
      {/* headerShown: false oculta o header padrão (usamos Appbar personalizado) */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Telas disponíveis quando o usuário está autenticado
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Produtos" component={ProdutosScreen} />
          </>
        ) : (
          // Telas disponíveis quando NÃO está autenticado
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// ================================================================
// 11. COMPONENTE RAIZ (App)
// Ponto de entrada do aplicativo. Envolve tudo com:
// - PaperProvider: aplica o tema visual do Material Design
// - AuthProvider: disponibiliza o contexto de autenticação globalmente
// ================================================================
export default function App() {
  return (
    <PaperProvider>       {/* tema visual (Material Design) */}
      <AuthProvider>      {/* contexto de autenticação global */}
        <Navigation />    {/* lógica de navegação e rotas */}
      </AuthProvider>
    </PaperProvider>
  );
}


// ================================================================
// 12. ESTILOS COMPARTILHADOS
// Objeto de estilos reutilizados em várias telas.
// StyleSheet.create otimiza os estilos para a plataforma nativa.
// ================================================================
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },           // ocupa toda a tela
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 }, // centraliza conteúdo
  scrollCenter: { flexGrow: 1, justifyContent: 'center', padding: 20 }, // scroll centralizado
  logoArea: { alignItems: 'center', marginBottom: 24 },     // área do logo/título
  appName: { fontSize: 32, fontWeight: 'bold', color: '#6200ee' }, // nome do app
  tagline: { color: '#555', marginTop: 4 },                 // subtítulo
  card: { elevation: 4 },                                   // sombra do card
  centerTitle: { textAlign: 'center', marginBottom: 16 },   // título centralizado
  centerText: { textAlign: 'center', marginBottom: 10, color: '#555' }, // texto centralizado
  input: { marginBottom: 14 },                              // espaçamento dos campos
  btnPrimary: { marginTop: 4, marginBottom: 8 },            // botão principal
  divider: { marginVertical: 12 },                          // linha separadora
  obs: { textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 16 }, // nota de campos obrigatórios
});
