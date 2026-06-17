import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Title, Card, Divider, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function CadastroScreen({ navigation }) {
  const { registrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);

  const senhasDivergem = confirmarSenha.length > 0 && senha !== confirmarSenha;

  const validar = () => {
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe seu nome completo.'); return false; }
    if (!email.trim()) { Alert.alert('Atenção', 'Informe o e-mail.'); return false; }
    if (senha.length < 6) { Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.'); return false; }
    if (senha !== confirmarSenha) { Alert.alert('Atenção', 'As senhas não coincidem.'); return false; }
    return true;
  };

  const handleCadastro = async () => {
    if (!validar()) return;
    setLoading(true);
    try {
      await registrar(email.trim(), senha, nome.trim());
      Alert.alert('Sucesso', 'Conta criada! Bem-vindo(a)!');
    } catch (error) {
      const msgs = {
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/weak-password': 'Senha muito fraca.',
      };
      Alert.alert('Erro ao cadastrar', msgs[error.code] || error.message);
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
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Criar Conta</Title>

            <TextInput
              label="Nome Completo *"
              value={nome}
              onChangeText={setNome}
              mode="outlined"
              autoCapitalize="words"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Senha * (mínimo 6 caracteres)"
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

            <TextInput
              label="Confirmar Senha *"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              mode="outlined"
              secureTextEntry={!senhaVisivel}
              style={styles.input}
              error={senhasDivergem}
              left={<TextInput.Icon icon="lock-check" />}
            />
            {senhasDivergem && (
              <HelperText type="error">As senhas não coincidem.</HelperText>
            )}

            <Text style={styles.obrigatorio}>* Campos obrigatórios</Text>

            <Button
              mode="contained"
              onPress={handleCadastro}
              loading={loading}
              disabled={loading}
              style={styles.btnPrimary}
              icon="account-plus"
            >
              Cadastrar
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              icon="arrow-left"
            >
              Já tenho conta
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
  card: { elevation: 4 },
  cardTitle: { textAlign: 'center', marginBottom: 16 },
  input: { marginBottom: 14 },
  obrigatorio: { textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 16 },
  btnPrimary: { marginTop: 4, marginBottom: 8 },
  divider: { marginVertical: 16 },
});
