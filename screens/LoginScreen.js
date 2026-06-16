import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Title, Paragraph, Card, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (error) {
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      };
      Alert.alert('Erro ao entrar', msgs[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Title style={styles.appName}>Gerenciamento</Title>
          <Paragraph style={styles.tagline}>Acesse sua conta para continuar</Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Entrar</Title>

            <TextInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              mode="outlined"
              secureTextEntry={!senhaVisivel}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={senhaVisivel ? 'eye-off' : 'eye'}
                  onPress={() => setSenhaVisivel(!senhaVisivel)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.btnPrimary}
              icon="login"
            >
              Entrar
            </Button>

            <Divider style={styles.divider} />

            <Text style={styles.cadastroText}>Ainda não tem conta?</Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Cadastro')}
              disabled={loading}
              icon="account-plus"
            >
              Criar Conta
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#6200ee' },
  tagline: { color: '#555', marginTop: 4 },
  card: { elevation: 4 },
  cardTitle: { textAlign: 'center', marginBottom: 16 },
  input: { marginBottom: 14 },
  btnPrimary: { marginTop: 4, marginBottom: 8 },
  divider: { marginVertical: 16 },
  cadastroText: { textAlign: 'center', marginBottom: 10, color: '#555' },
});
