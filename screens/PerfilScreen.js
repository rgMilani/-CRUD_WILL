import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text, TextInput, Button, Title, Card, Avatar, Divider, ActivityIndicator, Chip
} from 'react-native-paper';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { updateEmail, updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export default function PerfilScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '', bio: '' });
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    setCarregando(true);
    try {
      const docRef = doc(db, 'usuarios', auth.currentUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPerfil({ ...snap.data(), email: auth.currentUser.email });
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setCarregando(false);
    }
  };

  const salvarPerfil = async () => {
    if (!perfil.nome.trim()) {
      Alert.alert('Atenção', 'O nome não pode ser vazio.');
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'usuarios', auth.currentUser.uid);
      await updateDoc(docRef, {
        nome: perfil.nome.trim(),
        telefone: perfil.telefone.trim(),
        bio: perfil.bio.trim(),
        dataAtualizacao: serverTimestamp()
      });

      if (perfil.email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, perfil.email.trim());
      }

      if (novaSenha.length >= 6 && senhaAtual) {
        const cred = EmailAuthProvider.credential(auth.currentUser.email, senhaAtual);
        await reauthenticateWithCredential(auth.currentUser, cred);
        await updatePassword(auth.currentUser, novaSenha);
        setSenhaAtual('');
        setNovaSenha('');
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setModoEdicao(false);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = () => {
    Alert.alert(
      'Excluir Conta',
      'Esta ação é irreversível. Todos os seus dados serão removidos. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, 'usuarios', auth.currentUser.uid));
              await deleteUser(auth.currentUser);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir a conta. Faça login novamente e tente de novo.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const iniciais = (perfil.nome || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Cabeçalho do Perfil */}
        <View style={styles.header}>
          <Avatar.Text size={90} label={iniciais} style={styles.avatar} />
          <Title style={styles.nomeHeader}>{perfil.nome || 'Usuário'}</Title>
          <Text style={styles.emailHeader}>{auth.currentUser?.email}</Text>
          {perfil.bio ? <Chip style={styles.bioChip} icon="information">{perfil.bio}</Chip> : null}
        </View>

        {/* Card de Dados */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title>Dados Pessoais</Title>
              {!modoEdicao && (
                <Button icon="pencil" onPress={() => setModoEdicao(true)} compact mode="text">
                  Editar
                </Button>
              )}
            </View>

            <Divider style={styles.divider} />

            <TextInput
              label="Nome Completo *"
              value={perfil.nome}
              onChangeText={v => setPerfil({ ...perfil, nome: v })}
              mode="outlined"
              disabled={!modoEdicao}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />
            <TextInput
              label="E-mail *"
              value={perfil.email}
              onChangeText={v => setPerfil({ ...perfil, email: v })}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={!modoEdicao}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />
            <TextInput
              label="Telefone"
              value={perfil.telefone}
              onChangeText={v => setPerfil({ ...perfil, telefone: v })}
              mode="outlined"
              keyboardType="phone-pad"
              disabled={!modoEdicao}
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />
            <TextInput
              label="Bio"
              value={perfil.bio}
              onChangeText={v => setPerfil({ ...perfil, bio: v })}
              mode="outlined"
              multiline
              numberOfLines={3}
              disabled={!modoEdicao}
              style={styles.input}
              left={<TextInput.Icon icon="text" />}
            />

            {modoEdicao && (
              <>
                <Divider style={styles.divider} />
                <Title style={styles.subtitulo}>Alterar Senha (opcional)</Title>
                <TextInput
                  label="Senha Atual"
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" />}
                />
                <TextInput
                  label="Nova Senha (mín. 6 caracteres)"
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  left={<TextInput.Icon icon="lock-reset" />}
                />
              </>
            )}

            {modoEdicao && (
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => { setModoEdicao(false); carregarPerfil(); }}
                  disabled={loading}
                  style={styles.btnAction}
                  icon="close"
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={salvarPerfil}
                  loading={loading}
                  disabled={loading}
                  style={styles.btnAction}
                  icon="content-save"
                >
                  Salvar
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Ações da Conta */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Conta</Title>
            <Divider style={styles.divider} />
            <Button
              mode="outlined"
              icon="logout"
              onPress={logout}
              style={styles.btnLogout}
            >
              Sair da Conta
            </Button>
            <Button
              mode="contained"
              buttonColor="#FF3B30"
              icon="delete-forever"
              onPress={excluirConta}
              disabled={loading}
              style={styles.btnExcluir}
            >
              Excluir Minha Conta
            </Button>
          </Card.Content>
        </Card>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 30, backgroundColor: '#6200ee' },
  avatar: { backgroundColor: '#03dac4', marginBottom: 12 },
  nomeHeader: { color: '#fff', fontSize: 22 },
  emailHeader: { color: '#ddd', fontSize: 14, marginTop: 2 },
  bioChip: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { margin: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitulo: { fontSize: 16, marginBottom: 8 },
  divider: { marginVertical: 12 },
  input: { marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  btnAction: { flex: 1, marginHorizontal: 4 },
  btnLogout: { marginBottom: 10 },
  btnExcluir: { marginTop: 4 },
});
