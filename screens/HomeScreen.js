import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Title, Card, Button, Avatar, Paragraph, Appbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/config';

const MENUS = [
  {
    titulo: 'Meu Perfil',
    descricao: 'Visualize e edite seus dados pessoais',
    icone: 'account-circle',
    cor: '#6200ee',
    tela: 'Perfil',
  },
  {
    titulo: 'Produtos',
    descricao: 'Gerencie seu catálogo de produtos',
    icone: 'package-variant',
    cor: '#2196F3',
    tela: 'Produtos',
  },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const nome = auth.currentUser?.displayName || 'Usuário';
  const iniciais = nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Início" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Boas-vindas */}
        <View style={styles.welcome}>
          <Avatar.Text size={70} label={iniciais} style={styles.avatar} />
          <Title style={styles.welcomeTitle}>Olá, {nome.split(' ')[0]}!</Title>
          <Text style={styles.welcomeSub}>Selecione uma opção abaixo</Text>
        </View>

        {/* Menu Cards */}
        {MENUS.map((item) => (
          <Card
            key={item.tela}
            style={styles.card}
            onPress={() => navigation.navigate(item.tela)}
          >
            <Card.Content style={styles.cardContent}>
              <Avatar.Icon
                size={56}
                icon={item.icone}
                style={[styles.cardIcon, { backgroundColor: item.cor }]}
              />
              <View style={styles.cardText}>
                <Title style={styles.cardTitle}>{item.titulo}</Title>
                <Paragraph style={styles.cardDesc}>{item.descricao}</Paragraph>
              </View>
              <Avatar.Icon size={32} icon="chevron-right" style={styles.chevron} />
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scroll: { padding: 20 },
  welcome: { alignItems: 'center', marginBottom: 30, paddingTop: 10 },
  avatar: { backgroundColor: '#6200ee', marginBottom: 12 },
  welcomeTitle: { fontSize: 24 },
  welcomeSub: { color: '#666', marginTop: 4 },
  card: { marginBottom: 16, elevation: 3 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18 },
  cardDesc: { color: '#666', fontSize: 13 },
  chevron: { backgroundColor: 'transparent' },
});
