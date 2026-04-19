
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal,
  ScrollView, Animated, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { getInventory, deleteProduct, createProduct, updateStockProduct, updateProduct } from '../../services/api';
import ActionModal from '../../components/ActionModal';
import { C, radius, shadow } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  is_available: boolean;
  stock: number | null;
  category?: string;
  preparation_minutes?: number;
}

const CATEGORIES = [
  'bocadillo_caliente', 'bocadillo_frio', 'bocadillo_especial',
  'sandwich', 'bebida', 'cafeteria', 'bolleria', 'snack', 'menu', 'suplemento',
];

const formatCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const CATEGORY_COLORS: Record<string, string> = {
  bocadillo_caliente: '#c0392b',
  bocadillo_frio:     '#2980b9',
  bocadillo_especial: '#8e44ad',
  sandwich:           '#d35400',
  bebida:             C.mid,
  cafeteria:          C.dark,
  bolleria:           '#F39C12',
  snack:              '#16a085',
  menu:               C.accent,
  suplemento:         C.muted,
};

// ── Chip de categoría ────────────────────────────────────────────────
function CategoryChip({
  cat, selected, onPress,
}: { cat: string; selected: boolean; onPress: () => void }) {
  const color = CATEGORY_COLORS[cat] || C.dark;
  return (
    <TouchableOpacity
      style={[
        chip.wrap,
        selected && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[chip.text, selected && chip.textSelected]}>
        {formatCategory(cat)}
      </Text>
    </TouchableOpacity>
  );
}

const chip = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.white,
  },
  text: { fontSize: 12, fontWeight: '600', color: C.dark },
  textSelected: { color: C.white, fontWeight: '800' },
});

// ── Tarjeta de producto ──────────────────────────────────────────────
function ProductRow({
  item, index, onEdit, onStock, onDelete,
}: {
  item: Product; index: number;
  onEdit: () => void; onStock: () => void; onDelete: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 50, friction: 14, delay: Math.min(index, 8) * 50,
    }).start();
  }, []);

  const catColor = CATEGORY_COLORS[item.category || ''] || C.muted;
  const stockLabel = item.stock === null ? 'Ilimitado' : `${item.stock} uds.`;
  const stockLow   = item.stock !== null && item.stock <= 5;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }}>
      <View style={pr.card}>
        <View style={[pr.catBar, { backgroundColor: catColor }]} />

        <View style={pr.body}>
          <View style={pr.header}>
            <Text style={pr.name} numberOfLines={1}>{item.name}</Text>
            <View style={[pr.badge, item.is_available ? pr.badgeOk : pr.badgeKo]}>
              <Ionicons 
                name={item.is_available ? "checkmark-circle" : "close-circle"} 
                size={12} 
                color={item.is_available ? C.success : C.danger} 
              />
              <Text style={[pr.badgeText, { color: item.is_available ? C.success : C.danger, marginLeft: 4 }]}>
                {item.is_available ? 'ACTIVO' : 'AGOTADO'}
              </Text>
            </View>
          </View>

          <View style={pr.meta}>
            <Text style={pr.price}>{item.price.toFixed(2)} €</Text>
            <Text style={pr.catTag}>{formatCategory(item.category || '—')}</Text>
            <Text style={[pr.stock, stockLow && pr.stockLow]}>
              {stockLabel}
            </Text>
          </View>

          <View style={pr.actions}>
            <TouchableOpacity style={[pr.btn, { borderColor: C.dark }]} onPress={onEdit}>
              <Ionicons name="create-outline" size={14} color={C.dark} />
              <Text style={[pr.btnText, { color: C.dark }]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[pr.btn, { borderColor: '#1D5F8A' }]} onPress={onStock}>
              <Ionicons name="layers-outline" size={14} color="#1D5F8A" />
              <Text style={[pr.btnText, { color: '#1D5F8A' }]}>Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[pr.btn, { borderColor: C.danger }]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={14} color={C.danger} />
              <Text style={[pr.btnText, { color: C.danger }]}>Borrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const pr = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: C.white,
    borderRadius: radius.md, marginBottom: 10,
    overflow: 'hidden', ...shadow.card,
  },
  catBar: { width: 5 },
  body: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '800', color: C.dark, flex: 1, marginRight: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeOk: { backgroundColor: C.successBg },
  badgeKo: { backgroundColor: C.dangerBg },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  price: { fontSize: 18, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  catTag: {
    fontSize: 11, fontWeight: '600', color: C.muted,
    backgroundColor: C.subtle, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  stock: { fontSize: 12, fontWeight: '700', color: C.muted },
  stockLow: { color: C.danger },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, paddingVertical: 9, borderRadius: radius.sm,
    borderWidth: 1.5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  btnText: { fontSize: 12, fontWeight: '800' },
});

// ── Modal de creación / edición ──────────────────────────────────────
interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Partial<Product>;
  isEditing: boolean;
}

function ProductModal({ visible, onClose, onSave, initialData, isEditing }: ProductModalProps) {
  const [name, setName]           = useState('');
  const [price, setPrice]         = useState('');
  const [category, setCategory]   = useState(CATEGORIES[0]);
  const [description, setDesc]    = useState('');
  const [imageUrl, setImageUrl]   = useState('');
  const [stock, setStock]         = useState('');
  const [prepTime, setPrepTime]   = useState('5');
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPrice(initialData.price?.toString() || '');
      setCategory(initialData.category || CATEGORIES[0]);
      setDesc(initialData.description || '');
      setImageUrl(initialData.image_url || '');
      setStock(initialData.stock?.toString() || '');
      setPrepTime(initialData.preparation_minutes?.toString() || '5');
    } else {
      setName(''); setPrice(''); setCategory(CATEGORIES[0]);
      setDesc(''); setImageUrl(''); setStock(''); setPrepTime('5');
    }
  }, [initialData, visible]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio.'); return; }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) { Alert.alert('Error', 'Introduce un precio válido.'); return; }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        price: parsedPrice,
        category,
        description: description.trim(),
        image_url: imageUrl.trim(),
        is_available: true,
        stock: stock === '' ? null : parseInt(stock),
        preparation_minutes: parseInt(prepTime) || 5,
      });
      onClose();
    } catch { Alert.alert('Error', 'No se pudo procesar la solicitud.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={pm.root}>
          {/* Cabecera del modal */}
          <View style={pm.header}>
            <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
              <Text style={pm.closeText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={pm.headerTitle}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</Text>
            <TouchableOpacity
              style={[pm.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={pm.saveText}>{saving ? '...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={pm.scroll} showsVerticalScrollIndicator={false}>

            {/* Nombre */}
            <Text style={pm.label}>NOMBRE</Text>
            <TextInput style={pm.input} value={name} onChangeText={setName} placeholder="Nombre del producto" placeholderTextColor={C.muted} />

            {/* Precio + Tiempo */}
            <View style={pm.row}>
              <View style={{ flex: 1 }}>
                <Text style={pm.label}>PRECIO (€)</Text>
                <TextInput style={pm.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pm.label}>PREP. (MIN)</Text>
                <TextInput style={pm.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="5" placeholderTextColor={C.muted} />
              </View>
            </View>

            {/* Categorías */}
            <Text style={pm.label}>CATEGORÍA</Text>
            <View style={pm.chipGrid}>
              {CATEGORIES.map(cat => (
                <CategoryChip
                  key={cat} cat={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </View>

            {/* Stock */}
            <Text style={pm.label}>STOCK INICIAL</Text>
            <TextInput
              style={pm.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="Vacío = ilimitado"
              placeholderTextColor={C.muted}
            />

            {/* URL imagen */}
            <Text style={pm.label}>URL DE LA IMAGEN</Text>
            <TextInput style={pm.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={C.muted} autoCapitalize="none" />

            {/* Descripción */}
            <Text style={pm.label}>DESCRIPCIÓN</Text>
            <TextInput
              style={[pm.input, pm.textArea]}
              value={description}
              onChangeText={setDesc}
              placeholder="Descripción opcional..."
              placeholderTextColor={C.muted}
              multiline
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const pm = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.subtle,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.dark },
  closeBtn: { paddingHorizontal: 4 },
  closeText: { fontSize: 15, color: C.muted, fontWeight: '600' },
  saveBtn: { backgroundColor: C.dark, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.sm },
  saveText: { fontSize: 14, fontWeight: '800', color: C.white },
  scroll: { flex: 1, padding: 16 },
  label: {
    fontSize: 9, fontWeight: '900', color: C.muted,
    letterSpacing: 2, marginBottom: 8, marginTop: 4,
  },
  input: {
    backgroundColor: C.white, borderRadius: radius.md,
    padding: 14, fontSize: 15, color: C.dark,
    marginBottom: 16, borderWidth: 1, borderColor: C.subtle, ...shadow.card,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
});

// ── Pantalla principal ───────────────────────────────────────────────
export default function InventoryScreen() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | undefined>(undefined);
  const [selectedId, setSelectedId]         = useState('');
  const [actionVisible, setActionVisible]   = useState(false);
  const [modalType, setModalType]           = useState<'delete' | 'stock'>('delete');
  const [tempStock, setTempStock]           = useState('');

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try { const r = await getInventory(); setProducts(r); }
    catch { Alert.alert('Error', 'No se pudo cargar el inventario'); }
    finally { setLoading(false); }
  };

  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  const openCreate = () => {
    setIsEditing(false); setEditingProduct(undefined); setModalVisible(true);
  };

  const openEdit = (product: Product) => {
    setIsEditing(true); setEditingProduct(product); setModalVisible(true);
  };

  const openStock = (id: string, current: number | null) => {
    setSelectedId(id); setTempStock(current?.toString() || '');
    setModalType('stock'); setActionVisible(true);
  };

  const openDelete = (id: string) => {
    setSelectedId(id); setModalType('delete'); setActionVisible(true);
  };

  const handleSave = async (data: any) => {
    if (isEditing && editingProduct?.id) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    fetchProducts();
  };

  const handleConfirmAction = async () => {
    try {
      if (modalType === 'delete') {
        await deleteProduct(selectedId);
      } else {
        await updateStockProduct(selectedId, tempStock === '' ? null : parseInt(tempStock));
      }
      fetchProducts(); setActionVisible(false);
    } catch { Alert.alert('Error', 'No se pudo realizar la acción.'); }
  };

  return (
    <View style={iv.root}>
      {/* Sub-cabecera */}
      <View style={iv.subHeader}>
        <View style={iv.searchRow}>
          <Ionicons name="search-outline" size={18} color={C.muted} style={iv.searchIcon} />
          <TextInput
            style={iv.searchInput}
            placeholder="Buscar producto..."
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={iv.addBtn} onPress={openCreate}>
          <Ionicons name="add-outline" size={20} color={C.white} />
          <Text style={iv.addBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={iv.countRow}>
        <Text style={iv.countText}>
          {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={iv.loadingWrap}>
          <ActivityIndicator size="large" color={C.mid} />
          <Text style={iv.loadingText}>Cargando inventario...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ProductRow
              item={item}
              index={index}
              onEdit={() => openEdit(item)}
              onStock={() => openStock(item.id, item.stock)}
              onDelete={() => openDelete(item.id)}
            />
          )}
          contentContainerStyle={iv.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={iv.emptyBox}>
              <Ionicons name="file-tray-outline" size={48} color={C.subtle} />
              <Text style={iv.emptyText}>No se encontraron productos</Text>
            </View>
          }
        />
      )}

      {/* Los modales se mantienen igual */}
      <ProductModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initialData={editingProduct as any}
        isEditing={isEditing}
      />

      <ActionModal
        visible={actionVisible}
        title={modalType === 'delete' ? 'Eliminar producto' : 'Actualizar stock'}
        confirmText={modalType === 'delete' ? 'Eliminar' : 'Actualizar'}
        confirmColor={modalType === 'delete' ? C.danger : '#1D5F8A'}
        onClose={() => setActionVisible(false)}
        onConfirm={handleConfirmAction}
      >
        {modalType === 'delete' ? (
          <Text style={iv.deleteMsg}>
            ¿Estás seguro? Esta acción eliminará el producto del catálogo permanentemente.
          </Text>
        ) : (
          <View>
            <Text style={iv.stockLabel}>Cantidad disponible</Text>
            <TextInput
              style={iv.stockInput}
              placeholder="Ej: 20 — vacío para ilimitado"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={tempStock}
              onChangeText={setTempStock}
              autoFocus
            />
          </View>
        )}
      </ActionModal>
    </View>
  );
}

const iv = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  subHeader: { 
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, 
    paddingTop: 16, paddingBottom: 10 
  },
  searchRow: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', 
    backgroundColor: C.white, borderRadius: radius.md, 
    paddingHorizontal: 12, ...shadow.card 
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: C.dark },
  addBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark, 
    paddingHorizontal: 14, borderRadius: radius.md, gap: 4 
  },
  addBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  countRow: { paddingHorizontal: 18, marginBottom: 8 },
  countText: { fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.3 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: C.muted, fontWeight: '600' },
  emptyBox: { marginTop: 80, alignItems: 'center', gap: 12 },
  emptyText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  deleteMsg: { fontSize: 15, color: C.dark, lineHeight: 22, textAlign: 'center' },
  stockLabel: { fontSize: 12, fontWeight: '800', color: C.muted, marginBottom: 8, letterSpacing: 1 },
  stockInput: { 
    backgroundColor: C.bg, padding: 14, borderRadius: radius.md, 
    fontSize: 16, fontWeight: '700', color: C.dark, borderWidth: 1, borderColor: C.subtle 
  },
});