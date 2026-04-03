import React, { useEffect, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Modal
} from 'react-native';
import { getInventory, deleteProduct, createProduct, updateStockProduct, updateProduct } from '../../services/api'; // Ajusta la ruta a tu instancia de axios
import ActionModal from '../../components/ActionModal';

// --- Tipado para los productos ---
interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
  is_available: boolean;
  stock: number | null;
  category?: string;
  preparation_minutes?: Number;
}

export default function InventoryScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newCategory, setNewCategory] = useState('Bocadillos'); // Valor por defecto del Enum
    const [newDescription, setNewDescription] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newStock, setNewStock] = useState(''); // Lo manejaremos como string y convertiremos
    const [newPrepTime, setNewPrepTime] = useState('5');
    // Estados de control
    const [actionVisible, setActionVisible] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [modalType, setModalType] = useState<'delete' | 'stock'>('delete');
    const [tempStock, setTempStock] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const CATEGORIES = ['bocadillo', 'bebida', 'postre', 'cafe']; 

// Función para abrir el modal en modo edición
    const openEditModal = (product: Product) => {
        setIsEditing(true);
        setSelectedProductId(product.id);
        

        setNewName(product.name || '');
        setNewPrice(product.price?.toString() || '0');
        setNewCategory(product.category || 'bocadillo');
        setNewDescription(product.description || '');
        setNewImageUrl(product.image_url || '');
        setNewStock(product.stock?.toString() || '');
        setNewPrepTime(product.preparation_minutes?.toString() || '5');
        
        setModalVisible(true);
    };

    // Función para limpiar al crear nuevo
    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedProductId(null);

        setNewName('');
        setNewPrice('');
        setNewCategory('bocadillo');
        setNewDescription('');
        setNewImageUrl('');
        setNewStock('');
        setNewPrepTime('5');

        setModalVisible(true);
    };
    // Función para abrir el modal de Stock
    const openStockModal = (id: string, currentStock: number | null) => {
    setSelectedId(id);
    setTempStock(currentStock?.toString() || '');
    setModalType('stock');
    setActionVisible(true);
    };

    // Función para abrir el modal de Borrado
    const openDeleteModal = (id: string) => {
    setSelectedId(id);
    setModalType('delete');
    setActionVisible(true);
    };

    // El "Cerebro" que ejecuta según el tipo
    const handleConfirmAction = async () => {
    try {
        if (modalType === 'delete') {
        await deleteProduct(selectedId);
        } else {
        const quantity = tempStock === "" ? null : parseInt(tempStock);
        await updateStockProduct(selectedId, quantity);
        }
        fetchProducts();
        setActionVisible(false);
    } catch (e) {
        Alert.alert("Error", "No se pudo realizar la acción");
    }
    };
    const closeModal = () => {
        setModalVisible(false);
        setIsEditing(false);
        setSelectedProductId(null);
        
        // Resetear campos
        setNewName('');
        setNewPrice('');
        setNewCategory('bocadillo'); // Valor inicial de tu Enum
        setNewDescription('');
        setNewImageUrl('');
        setNewStock('');
        setNewPrepTime('5');
    };
    const handleSave = async () => {
        try {
            const data = {
                name: newName,
                price: parseFloat(newPrice),
                category: newCategory,
                description: newDescription,
                image_url: newImageUrl,
                is_available: true,
                stock: newStock === "" ? null : parseInt(newStock),
                preparation_minutes: parseInt(newPrepTime)
            };

            if (isEditing && selectedProductId) {
                // Llamada al PUT (usando la ruta que me pasaste)
                await updateProduct(selectedProductId, data);
                Alert.alert("Éxito", "Producto actualizado correctamente");
            } else {
                // Llamada al POST
                await createProduct(data);
                Alert.alert("Éxito", "Producto creado correctamente");
            }

            setModalVisible(false);
            closeModal();
            fetchProducts(); 
        } catch (error) {
            Alert.alert("Error", "No se pudo procesar la solicitud");
        }
    };
  // --- Llamadas a la API ---
    const fetchProducts = async () => {
        try {
        setLoading(true);
        const response = await getInventory(); 
        setProducts(response);
        } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el inventario');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleUpdateStock = (productId: string, currentStock: number | null) => {
        setSelectedId(productId);
        setTempStock(currentStock === null ? '' : currentStock.toString());
        setModalType('stock');
        setActionVisible(true);
    };

    const handleDelete = (productId: string) => {
        setSelectedId(productId);
        setModalType('delete');
        setActionVisible(true);
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
            <Text style={styles.orderCode}>{item.name}</Text>
            <Text style={[
            styles.badge, 
            item.is_available ? styles.badgePaid : styles.badgePreparing
            ]}>
            {item.is_available ? 'ACTIVO' : 'AGOTADO'}
            </Text>
        </View>

        <Text style={styles.orderItem}>Precio: {item.price}€</Text>
        <Text style={styles.orderItem}>
            Stock actual: {item.stock === null ? '∞ Ilimitado' : item.stock}
        </Text>

       
        <View style={[styles.orderActions, { flexDirection: 'row', gap: 8 }]}>
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#34495e', flex: 1 }]}
                onPress={() => openEditModal(item)}
            >
                <Text style={styles.actionBtnText}>📝 Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionBtn, styles.preparingBtn, { flex: 1 }]}
                onPress={() => handleUpdateStock(item.id, item.stock)}
            >
                <Text style={styles.actionBtnText}>📦 Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#e74c3c', flex: 1 }]}
                onPress={() => handleDelete(item.id)}
            >
                <Text style={styles.actionBtnText}>🗑️ Borrar</Text>
            </TouchableOpacity>
        </View>
        </View>
    );
    const filteredProducts = useMemo(() => {
        return products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [products, searchQuery]);
    return (
        <View style={styles.container}>
        <Text style={styles.title}>Panel de Inventario</Text>
        <TextInput
            placeholder="Buscar producto por nombre..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
        />
        <TouchableOpacity 
        style={styles.verifyBtn} 
        onPress={openCreateModal} 
        >
        <Text style={styles.verifyBtnText}>+ Crear Nuevo Producto</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.container, { backgroundColor: '#fff' }]}>
            <Text style={styles.title}>
                {isEditing ? `Editando: ${newName}` : 'Nuevo Producto'}
            </Text>
            
            <TextInput
                placeholder="Nombre del producto"
                style={styles.modalInput}
                value={newName}
                onChangeText={setNewName}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Precio</Text>
                    <TextInput
                        placeholder="Ej: 3.50"
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={newPrice}
                        onChangeText={setNewPrice}
                    />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Prep. (minutos)</Text>
                    <TextInput
                        placeholder="Ej: 5"
                        style={styles.modalInput}
                        keyboardType="numeric"
                        value={newPrepTime}
                        onChangeText={setNewPrepTime}
                    />
                </View>
            </View>

            <Text style={{ marginBottom: 8, fontWeight: '700' }}>Categoría:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
            {CATEGORIES.map((cat) => {
            // Definimos si está seleccionado fuera del JSX para que sea más claro
            const normalizedCategory = (newCategory || '').trim().toLowerCase();
            const normalizedCat = cat.trim().toLowerCase();
            const isSelected = normalizedCategory === normalizedCat;

            return (
                <TouchableOpacity
                key={`cat-${cat}`} 
                activeOpacity={0.7} 
                style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected
                ]}
                onPress={() => setNewCategory(cat)}
                >
                <Text
                    style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected
                    ]}
                >
                    {cat}
                </Text>
                </TouchableOpacity>
            );
            })}
            </View>
            <Text style={styles.inputLabel}>Stock</Text>
            <TextInput
                placeholder="Stock inicial (Vacío = Ilimitado)"
                style={styles.modalInput}
                keyboardType="numeric"
                value={newStock}
                onChangeText={setNewStock}
            />
            <Text style={styles.inputLabel}>URL de la imagen</Text>
            <TextInput
                placeholder="URL de la imagen"
                style={styles.modalInput}
                value={newImageUrl}
                onChangeText={setNewImageUrl}
            />
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
                placeholder="Descripción"
                style={[styles.modalInput, { height: 80 }]}
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
            />

            <TouchableOpacity style={styles.verifyBtn} onPress={handleSave}>
                <Text style={styles.verifyBtnText}>
                    {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {setModalVisible(false);  closeModal()} } style={{ marginTop: 15 }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>Cancelar</Text>
            </TouchableOpacity>
        </View>
        </Modal>
        
        {loading ? (
            <ActivityIndicator size="large" color="#FF6B35" />
        ) : (
            <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            />
        )}
        <ActionModal
            visible={actionVisible}
            title={modalType === 'delete' ? "Eliminar Producto" : "Actualizar Stock"}
            confirmText={modalType === 'delete' ? "Eliminar" : "Actualizar"}
            confirmColor={modalType === 'delete' ? "#e74c3c" : "#3498db"}
            onClose={() => setActionVisible(false)}
            onConfirm={handleConfirmAction}
            >
            {modalType === 'delete' ? (
                <Text style={{ color: '#444' }}>¿Estás seguro? Esta acción no se puede deshacer (borrado lógico).</Text>
            ) : (
                <View>
                <Text style={{ marginBottom: 8, color: '#666' }}>Cantidad disponible:</Text>
                <TextInput
                    style={styles.modalInput} // El estilo que ya tenías
                    placeholder="Ej: 10 (vacío para ∞)"
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

    const styles = StyleSheet.create({
    codeInput: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 10, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: '700' },
    container: { flex: 1, backgroundColor: '#f4f4f8', padding: 16 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#1a1a2e' },
    orderCard: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 12, 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 6, 
        elevation: 3 
    },
    orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    orderCode: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', flex: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700' },
    badgePaid: { backgroundColor: '#d4edda', color: '#155724' },
    badgePreparing: { backgroundColor: '#fff3cd', color: '#856404' },
    orderItem: { fontSize: 14, color: '#444', marginBottom: 2 },
    orderActions: { marginTop: 12 },
    actionBtn: { padding: 10, borderRadius: 8, alignItems: 'center' },
    preparingBtn: { backgroundColor: '#3498db' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    verifyBtn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 10, alignItems: 'center' },
    verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    modalInput: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#333'
    },
    searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333'
},

    categoryChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#eee',
        borderWidth: 1,
        borderColor: '#ddd'
    },

    categoryChipSelected: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35'
    },

    categoryChipText: {
        color: '#666',
        fontWeight: '500',
        textTransform: 'capitalize'
    },

    categoryChipTextSelected: {
        color: '#fff',
        fontWeight: '700'
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
        marginTop: 4,
        marginLeft: 2,
    },
});