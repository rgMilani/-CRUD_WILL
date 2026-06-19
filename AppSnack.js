import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  Provider as PaperProvider, Appbar, Card, Title, Paragraph,
  Button, TextInput, Text, Avatar, Chip,
  Divider, ActivityIndicator, FAB, HelperText
} from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import firebase from 'firebase';
import 'firebase/auth';
import 'firebase/firestore';

// ─── Firebase ───────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDT-6l6aYQ2H_wAFVAeQtJgJUdkDbPwrNI",
  authDomain: "crud-will.firebaseapp.com",
  projectId: "crud-will",
  storageBucket: "crud-will.firebasestorage.app",
  messagingSenderId: "338452438950",
  appId: "1:338452438950:web:2184c8a4ebc3159dccb967"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ─── Auth Context ────────────────────────────────────────────
const AuthContext = createContext({});
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const snap = await db.collection('usuarios').doc(u.uid).get();
        setUser({ uid: u.uid, email: u.email, displayName: u.displayName, perfil: snap.exists ? snap.data() : {} });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const registrar = async (email, senha, nome) => {
    const cred = await auth.createUserWithEmailAndPassword(email, senha);
    await cred.user.updateProfile({ displayName: nome });
    await db.collection('usuarios').doc(cred.user.uid).set({
      nome, email, telefone: '', bio: '',
      dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
    });
    return cred.user;
  };

  const login = (email, senha) => auth.signInWithEmailAndPassword(email, senha);
  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, registrar, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
const useAuth = () => useContext(AuthContext);

const Stack = createStackNavigator();

// ═══════════════════════════════════════════════════════════════
// TELA: LOGIN
// ═══════════════════════════════════════════════════════════════
function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (e) {
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/invalid-credential': 'E-mail ou senha inválidos.',
      };
      Alert.alert('Erro', msgs[e.code] || e.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scrollCenter} keyboardShouldPersistTaps="handled">
        <View style={s.logoArea}>
          <Title style={s.appName}>Gerenciamento</Title>
          <Paragraph style={s.tagline}>Acesse sua conta para continuar</Paragraph>
        </View>
        <Card style={s.card}>
          <Card.Content>
            <Title style={s.centerTitle}>Entrar</Title>
            <TextInput label="E-mail" value={email} onChangeText={setEmail} mode="outlined"
              keyboardType="email-address" autoCapitalize="none" style={s.input} />
            <TextInput label="Senha" value={senha} onChangeText={setSenha} mode="outlined"
              secureTextEntry={!senhaVisivel} style={s.input}
              right={<TextInput.Icon icon={senhaVisivel ? 'eye-off' : 'eye'} onPress={() => setSenhaVisivel(!senhaVisivel)} />} />
            <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading}
              style={s.btnPrimary}>Entrar</Button>
            <Divider style={s.divider} />
            <Text style={s.centerText}>Ainda não tem conta?</Text>
            <Button mode="outlined" onPress={() => navigation.navigate('Cadastro')} disabled={loading}>
              Criar Conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════
// TELA: CADASTRO
// ═══════════════════════════════════════════════════════════════
function CadastroScreen({ navigation }) {
  const { registrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const diverge = confirmar.length > 0 && senha !== confirmar;

  const handleCadastro = async () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome.'); return; }
    if (!email.trim()) { Alert.alert('Atenção', 'Informe o e-mail.'); return; }
    if (senha.length < 6) { Alert.alert('Atenção', 'Senha mínimo 6 caracteres.'); return; }
    if (senha !== confirmar) { Alert.alert('Atenção', 'Senhas não coincidem.'); return; }
    setLoading(true);
    try {
      await registrar(email.trim(), senha, nome.trim());
      Alert.alert('Sucesso', 'Conta criada! Bem-vindo(a)!');
    } catch (e) {
      const msgs = { 'auth/email-already-in-use': 'E-mail já cadastrado.', 'auth/invalid-email': 'E-mail inválido.' };
      Alert.alert('Erro', msgs[e.code] || e.message);
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scrollCenter} keyboardShouldPersistTaps="handled">
        <Card style={s.card}>
          <Card.Content>
            <Title style={s.centerTitle}>Criar Conta</Title>
            <TextInput label="Nome Completo *" value={nome} onChangeText={setNome} mode="outlined"
              autoCapitalize="words" style={s.input} />
            <TextInput label="E-mail *" value={email} onChangeText={setEmail} mode="outlined"
              keyboardType="email-address" autoCapitalize="none" style={s.input} />
            <TextInput label="Senha * (mín. 6 caracteres)" value={senha} onChangeText={setSenha}
              mode="outlined" secureTextEntry={!visivel} style={s.input}
              right={<TextInput.Icon icon={visivel ? 'eye-off' : 'eye'} onPress={() => setVisivel(!visivel)} />} />
            <TextInput label="Confirmar Senha *" value={confirmar} onChangeText={setConfirmar}
              mode="outlined" secureTextEntry={!visivel} style={s.input} error={diverge} />
            {diverge && <HelperText type="error">As senhas não coincidem.</HelperText>}
            <Text style={s.obs}>* Campos obrigatórios</Text>
            <Button mode="contained" onPress={handleCadastro} loading={loading} disabled={loading}
              style={s.btnPrimary}>Cadastrar</Button>
            <Divider style={s.divider} />
            <Button mode="outlined" onPress={() => navigation.navigate('Login')} disabled={loading}>
              Já tenho conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════════════
// TELA: HOME
// ═══════════════════════════════════════════════════════════════
function HomeScreen({ navigation }) {
  const { logout } = useAuth();
  const nome = auth.currentUser?.displayName || 'Usuário';
  const iniciais = nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={s.flex}>
      <Appbar.Header>
        <Appbar.Content title="Início" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 30, paddingTop: 10 }}>
          <Avatar.Text size={70} label={iniciais} style={{ backgroundColor: '#6200ee', marginBottom: 12 }} />
          <Title style={{ fontSize: 24 }}>Olá, {nome.split(' ')[0]}!</Title>
          <Text style={{ color: '#666', marginTop: 4 }}>Selecione uma opção abaixo</Text>
        </View>
        {[
          { titulo: 'Meu Perfil', desc: 'Visualize e edite seus dados pessoais', icone: 'account-circle', cor: '#6200ee', tela: 'Perfil' },
          { titulo: 'Produtos', desc: 'Gerencie seu catálogo de produtos', icone: 'package-variant', cor: '#2196F3', tela: 'Produtos' },
        ].map(item => (
          <Card key={item.tela} style={{ marginBottom: 16, elevation: 3 }} onPress={() => navigation.navigate(item.tela)}>
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

// ═══════════════════════════════════════════════════════════════
// TELA: PERFIL (CRUD)
// ═══════════════════════════════════════════════════════════════
function PerfilScreen({ navigation }) {
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', bio: '' });
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => { carregarPerfil(); }, []);

  const carregarPerfil = async () => {
    setCarregando(true);
    try {
      const snap = await db.collection('usuarios').doc(auth.currentUser.uid).get();
      if (snap.exists) setPerfil({ ...snap.data(), email: auth.currentUser.email });
    } catch (e) { Alert.alert('Erro', 'Não foi possível carregar o perfil.'); }
    finally { setCarregando(false); }
  };

  const salvarPerfil = async () => {
    if (!perfil.nome.trim()) { Alert.alert('Atenção', 'Nome não pode ser vazio.'); return; }
    setLoading(true);
    try {
      await db.collection('usuarios').doc(auth.currentUser.uid).update({
        nome: perfil.nome.trim(), telefone: perfil.telefone.trim(),
        bio: perfil.bio.trim(),
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (novaSenha.length >= 6 && senhaAtual) {
        const cred = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, senhaAtual);
        await auth.currentUser.reauthenticateWithCredential(cred);
        await auth.currentUser.updatePassword(novaSenha);
        setSenhaAtual(''); setNovaSenha('');
      }
      Alert.alert('Sucesso', 'Perfil atualizado!');
      setModoEdicao(false);
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const excluirConta = () => {
    Alert.alert('Excluir Conta', 'Esta ação é irreversível. Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          await db.collection('usuarios').doc(auth.currentUser.uid).delete();
          await auth.currentUser.delete();
        } catch (e) { Alert.alert('Erro', 'Faça login novamente e tente de novo.'); }
        finally { setLoading(false); }
      }}
    ]);
  };

  const iniciais = (perfil.nome || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  if (carregando) return (
    <View style={s.center}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>Carregando...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('Home')} />
        <Appbar.Content title="Meu Perfil" />
      </Appbar.Header>
      <ScrollView style={{ backgroundColor: '#f3f4f6' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', padding: 30, backgroundColor: '#6200ee' }}>
          <Avatar.Text size={90} label={iniciais} style={{ backgroundColor: '#03dac4', marginBottom: 12 }} />
          <Title style={{ color: '#fff', fontSize: 22 }}>{perfil.nome || 'Usuário'}</Title>
          <Text style={{ color: '#ddd', fontSize: 14 }}>{auth.currentUser?.email}</Text>
        </View>

        <Card style={{ margin: 12, elevation: 3 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title>Dados Pessoais</Title>
              {!modoEdicao && (
                <Button onPress={() => setModoEdicao(true)} compact mode="text">Editar</Button>
              )}
            </View>
            <Divider style={s.divider} />
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
            {modoEdicao && (
              <>
                <Divider style={s.divider} />
                <Title style={{ fontSize: 16, marginBottom: 8 }}>Alterar Senha (opcional)</Title>
                <TextInput label="Senha Atual" value={senhaAtual} onChangeText={setSenhaAtual}
                  mode="outlined" secureTextEntry style={s.input} />
                <TextInput label="Nova Senha (mín. 6 caracteres)" value={novaSenha} onChangeText={setNovaSenha}
                  mode="outlined" secureTextEntry style={s.input} />
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <Button mode="outlined" onPress={() => { setModoEdicao(false); carregarPerfil(); }}
                    disabled={loading} style={{ flex: 1, marginRight: 4 }}>Cancelar</Button>
                  <Button mode="contained" onPress={salvarPerfil} loading={loading} disabled={loading}
                    style={{ flex: 1, marginLeft: 4 }}>Salvar</Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

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

// ═══════════════════════════════════════════════════════════════
// TELA: PRODUTOS — lista
// ═══════════════════════════════════════════════════════════════
const CATEGORIAS = ['Eletrônico', 'Alimento', 'Vestuário', 'Serviço', 'Outro'];
const COR_CAT = {
  'Eletrônico': '#2196F3', 'Alimento': '#4CAF50',
  'Vestuário': '#9C27B0', 'Serviço': '#FF9800', 'Outro': '#607D8B'
};

function ProdutosScreen({ navigation }) {
  const [produtos, setProdutos] = useState([]);
  const [mostraForm, setMostraForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const novoEstado = () => ({ id: null, nome: '', descricao: '', preco: '', categoria: 'Outro', estoque: '' });
  const [atual, setAtual] = useState(novoEstado());

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const snap = await db.collection('usuarios').doc(uid).collection('produtos').get();
      setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setLoading(false); }
  };

  const salvar = async () => {
    if (!atual.nome.trim()) { Alert.alert('Atenção', 'Informe o nome.'); return; }
    const precoNum = parseFloat(atual.preco.replace(',', '.'));
    if (!atual.preco.trim() || isNaN(precoNum)) { Alert.alert('Atenção', 'Preço inválido.'); return; }
    setSalvando(true);
    const uid = auth.currentUser.uid;
    const dados = {
      nome: atual.nome.trim(),
      descricao: atual.descricao.trim(),
      preco: precoNum,
      categoria: atual.categoria,
      estoque: atual.estoque ? parseInt(atual.estoque) : 0,
    };
    try {
      if (editando) {
        await db.collection('usuarios').doc(uid).collection('produtos').doc(atual.id).update({
          ...dados, dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        Alert.alert('Sucesso', 'Produto atualizado!');
      } else {
        await db.collection('usuarios').doc(uid).collection('produtos').add({
          ...dados, dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        Alert.alert('Sucesso', 'Produto cadastrado!');
      }
      setMostraForm(false);
      setAtual(novoEstado());
      setEditando(false);
      carregar();
    } catch (e) { Alert.alert('Erro', e.message); }
    finally { setSalvando(false); }
  };

  const excluir = (p) => {
    Alert.alert('Confirmar', 'Excluir "' + p.nome + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await db.collection('usuarios').doc(auth.currentUser.uid)
            .collection('produtos').doc(p.id).delete();
          carregar();
        } catch (e) { Alert.alert('Erro', e.message); }
      }}
    ]);
  };

  const abrirEdicao = (p) => {
    setAtual({ ...p, preco: p.preco?.toString().replace('.', ',') || '', estoque: p.estoque?.toString() || '' });
    setEditando(true);
    setMostraForm(true);
  };

  // ── FORMULÁRIO (sem Modal, sem Portal) ───────────────────────
  if (mostraForm) {
    return (
      <View style={s.flex}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => { setMostraForm(false); setAtual(novoEstado()); setEditando(false); }} />
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
          <Text style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>Categoria *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {CATEGORIAS.map(cat => (
              <Chip key={cat} selected={atual.categoria === cat}
                onPress={() => setAtual({ ...atual, categoria: cat })}
                style={{ marginRight: 6, marginBottom: 6 }}>{cat}</Chip>
            ))}
          </View>
          <Text style={s.obs}>* Campos obrigatórios</Text>
          <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}
            style={{ marginBottom: 12 }}>
            {editando ? 'Atualizar' : 'Salvar'}
          </Button>
          <Button mode="outlined" onPress={() => { setMostraForm(false); setAtual(novoEstado()); setEditando(false); }}
            disabled={salvando}>
            Cancelar
          </Button>
        </ScrollView>
      </View>
    );
  }

  // ── LISTA ────────────────────────────────────────────────────
  return (
    <View style={s.flex}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate('Home')} />
        <Appbar.Content title="Produtos" subtitle={produtos.length + ' cadastrado(s)'} />
        <Appbar.Action icon="refresh" onPress={carregar} />
      </Appbar.Header>

      <ScrollView style={{ padding: 10 }}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Carregando...</Text>
          </View>
        ) : produtos.length === 0 ? (
          <Card style={{ margin: 16 }}>
            <Card.Content style={{ alignItems: 'center', padding: 30 }}>
              <Avatar.Icon size={64} icon="package-variant" style={{ backgroundColor: '#e0e0e0', marginBottom: 16 }} />
              <Title style={{ textAlign: 'center' }}>Nenhum produto</Title>
              <Paragraph style={{ textAlign: 'center', color: '#888' }}>Toque no + para adicionar.</Paragraph>
            </Card.Content>
          </Card>
        ) : produtos.map(p => (
          <Card key={p.id} style={{ margin: 8, elevation: 3 }}>
            <Card.Content>
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
              {p.descricao ? (
                <>
                  <Divider style={{ marginVertical: 8 }} />
                  <Paragraph style={{ color: '#555' }}>{p.descricao}</Paragraph>
                </>
              ) : null}
              <Divider style={{ marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button mode="outlined" onPress={() => abrirEdicao(p)}
                  compact style={{ marginRight: 8 }}>Editar</Button>
                <Button mode="contained" color="#FF3B30" onPress={() => excluir(p)} compact>
                  Excluir
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
        <View style={{ height: 90 }} />
      </ScrollView>

      <FAB icon="plus" style={{ position: 'absolute', right: 16, bottom: 16 }}
        onPress={() => { setAtual(novoEstado()); setEditando(false); setMostraForm(true); }} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVEGAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function Navigation() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Produtos" component={ProdutosScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </PaperProvider>
  );
}

// ─── Estilos Compartilhados ───────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  scrollCenter: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#6200ee' },
  tagline: { color: '#555', marginTop: 4 },
  card: { elevation: 4 },
  centerTitle: { textAlign: 'center', marginBottom: 16 },
  centerText: { textAlign: 'center', marginBottom: 10, color: '#555' },
  input: { marginBottom: 14 },
  btnPrimary: { marginTop: 4, marginBottom: 8 },
  divider: { marginVertical: 12 },
  obs: { textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 16 },
});
