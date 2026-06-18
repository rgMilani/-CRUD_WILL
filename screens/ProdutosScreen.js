import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text, TextInput, Button, Title, Paragraph, Card, Modal, Portal,
  Appbar, Chip, Divider, ActivityIndicator, FAB, Avatar
} from 'react-native-paper';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const CATEGORIAS = ['Eletrônico', 'Alimento', 'Vestuário', 'Serviço', 'Outro'];

export default function ProdutosScreen({ navigation }) {
  const [produtos, setProdutos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState(estadoInicial());

  function estadoInicial() {
    return { id: null, nome: '', descricao: '', preco: '', categoria: 'Outro', estoque: '' };
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const q = query(collection(db, 'usuarios', uid, 'produtos'), orderBy('dataCriacao', 'desc'));
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProdutos(lista);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os produtos: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const validar = () => {
    if (!produtoAtual.nome.trim()) { Alert.alert('Atenção', 'Informe o nome do produto.'); return false; }
    if (!produtoAtual.preco.trim()) { Alert.alert('Atenção', 'Informe o preço.'); return false; }
    if (isNaN(parseFloat(produtoAtual.preco.replace(',', '.')))) {
      Alert.alert('Atenção', 'Preço inválido.'); return false;
    }
    if (produtoAtual.estoque && isNaN(parseInt(produtoAtual.estoque))) {
      Alert.alert('Atenção', 'Estoque deve ser um número inteiro.'); return false;
    }
    return true;
  };

  const salvar = async () => {
    if (!validar()) return;
    setLoading(true);
    const uid = auth.currentUser.uid;
    const colRef = collection(db, 'usuarios', uid, 'produtos');
    const dados = {
      nome: produtoAtual.nome.trim(),
      descricao: produtoAtual.descricao.trim(),
      preco: parseFloat(produtoAtual.preco.replace(',', '.')),
      categoria: produtoAtual.categoria,
      estoque: produtoAtual.estoque ? parseInt(produtoAtual.estoque) : 0,
    };
    try {
      if (editando) {
        await updateDoc(doc(db, 'usuarios', uid, 'produtos', produtoAtual.id), {
          ...dados, dataAtualizacao: serverTimestamp()
        });
        Alert.alert('Sucesso', 'Produto atualizado!');
      } else {
        await addDoc(colRef, { ...dados, dataCriacao: serverTimestamp() });
        Alert.alert('Sucesso', 'Produto cadastrado!');
      }
      fecharModal();
      carregarProdutos();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const excluir = (produto) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Excluir "${produto.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const uid = auth.currentUser.uid;
              await deleteDoc(doc(db, 'usuarios', uid, 'produtos', produto.id));
              carregarProdutos();
              Alert.alert('Sucesso', 'Produto excluído!');
            } catch (e) {
              Alert.alert('Erro', e.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const abrirEditar = (produto) => {
    setProdutoAtual({
      ...produto,
      preco: produto.preco?.toString().replace('.', ',') ?? '',
      estoque: produto.estoque?.toString() ?? ''
    });
    setEditando(true);
    setModalVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
    setProdutoAtual(estadoInicial());
    setEditando(false);
  };

  const corCategoria = {
    'Eletrônico': '#2196F3',
    'Alimento': '#4CAF50',
    'Vestuário': '#9C27B0',
    'Serviço': '#FF9800',
    'Outro': '#607D8B',
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Produtos" subtitle={`${produtos.length} cadastrado(s)`} />
        <Appbar.Action icon="refresh" onPress={carregarProdutos} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {loading && produtos.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10 }}>Carregando...</Text>
          </View>
        ) : produtos.length === 0 ? (
          <Card style={styles.cardVazio}>
            <Card.Content style={styles.cardVazioContent}>
              <Avatar.Icon size={64} icon="package-variant" style={{ backgroundColor: '#e0e0e0', marginBottom: 16 }} />
              <Title style={{ textAlign: 'center' }}>Nenhum produto cadastrado</Title>
              <Paragraph style={{ textAlign: 'center', color: '#888' }}>
                Toque no botão + para adicionar o primeiro produto.
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          produtos.map((p) => (
            <Card key={p.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <Avatar.Icon
                    size={48}
                    icon="package-variant"
                    style={{ backgroundColor: corCategoria[p.categoria] || '#607D8B', marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Title style={styles.nomeProduto}>{p.nome}</Title>
                    <Chip
                      style={[styles.chipCategoria, { backgroundColor: corCategoria[p.categoria] + '22' }]}
                      textStyle={{ color: corCategoria[p.categoria] }}
                    >
                      {p.categoria}
                    </Chip>
                  </View>
                  <View style={styles.precoBox}>
                    <Text style={styles.preco}>
                      R$ {parseFloat(p.preco || 0).toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={styles.estoque}>Estoque: {p.estoque ?? 0}</Text>
                  </View>
                </View>

                {p.descricao ? (
                  <>
                    <Divider style={{ marginVertical: 8 }} />
                    <Paragraph style={styles.descricao}>{p.descricao}</Paragraph>
                  </>
                ) : null}

                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.cardActions}>
                  <Button
                    mode="outlined"
                    icon="pencil"
                    onPress={() => abrirEditar(p)}
                    style={styles.btnCard}
                    compact
                  >
                    Editar
                  </Button>
                  <Button
                    mode="contained"
                    icon="delete"
                    buttonColor="#FF3B30"
                    onPress={() => excluir(p)}
                    style={styles.btnCard}
                    compact
                  >
                    Excluir
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Modal de Formulário */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={fecharModal}
          contentContainerStyle={styles.modal}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Card>
              <Card.Content>
                <Title style={{ textAlign: 'center', marginBottom: 16 }}>
                  {editando ? 'Editar Produto' : 'Novo Produto'}
                </Title>

                <TextInput
                  label="Nome do Produto *"
                  value={produtoAtual.nome}
                  onChangeText={v => setProdutoAtual({ ...produtoAtual, nome: v })}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="package-variant" />}
                />

                <TextInput
                  label="Descrição"
                  value={produtoAtual.descricao}
                  onChangeText={v => setProdutoAtual({ ...produtoAtual, descricao: v })}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  style={styles.input}
                  left={<TextInput.Icon icon="text" />}
                />

                <TextInput
                  label="Preço (R$) *"
                  value={produtoAtual.preco}
                  onChangeText={v => setProdutoAtual({ ...produtoAtual, preco: v })}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  left={<TextInput.Icon icon="currency-brl" />}
                />

                <TextInput
                  label="Estoque (unidades)"
                  value={produtoAtual.estoque}
                  onChangeText={v => setProdutoAtual({ ...produtoAtual, estoque: v })}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.input}
                  left={<TextInput.Icon icon="warehouse" />}
                />

                <Text style={styles.categoriaLabel}>Categoria *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorias}>
                  {CATEGORIAS.map(cat => (
                    <Chip
                      key={cat}
                      selected={produtoAtual.categoria === cat}
                      onPress={() => setProdutoAtual({ ...produtoAtual, categoria: cat })}
                      style={[
                        styles.chipSel,
                        produtoAtual.categoria === cat && { backgroundColor: corCategoria[cat] }
                      ]}
                      textStyle={produtoAtual.categoria === cat ? { color: '#fff' } : {}}
                    >
                      {cat}
                    </Chip>
                  ))}
                </ScrollView>

                <Paragraph style={{ textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 12 }}>
                  * Campos obrigatórios
                </Paragraph>

                <View style={styles.modalActions}>
                  <Button mode="outlined" onPress={fecharModal} disabled={loading} style={styles.btnModal} icon="close">
                    Cancelar
                  </Button>
                  <Button mode="contained" onPress={salvar} loading={loading} disabled={loading} style={styles.btnModal} icon={editando ? 'check' : 'plus'}>
                    {editando ? 'Atualizar' : 'Salvar'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => { setProdutoAtual(estadoInicial()); setEditando(false); setModalVisible(true); }}
        label="Novo Produto"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { flex: 1, padding: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  cardVazio: { margin: 16, elevation: 2 },
  cardVazioContent: { alignItems: 'center', padding: 30 },
  card: { margin: 8, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nomeProduto: { fontSize: 16, marginBottom: 4 },
  chipCategoria: { alignSelf: 'flex-start' },
  precoBox: { alignItems: 'flex-end' },
  preco: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  estoque: { fontSize: 12, color: '#666' },
  descricao: { color: '#555', fontSize: 13 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btnCard: { marginLeft: 8 },
  modal: { margin: 16, maxHeight: '90%' },
  input: { marginBottom: 12 },
  categoriaLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  categorias: { flexDirection: 'row', marginBottom: 12 },
  chipSel: { marginRight: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  btnModal: { flex: 1, marginHorizontal: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, borderRadius: 50 },
});
