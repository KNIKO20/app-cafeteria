import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  confirmColor?: string;
  children?: React.ReactNode; // Aquí metemos el input de stock si hace falta
}

export default function ActionModal({ 
  visible, title, onClose, onConfirm, confirmText = "Confirmar", confirmColor = "#FF6B35", children 
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          
          <View style={styles.content}>
            {children}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.btnTextCancel}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onConfirm} 
              style={[styles.btnConfirm, { backgroundColor: confirmColor }]}
            >
              <Text style={styles.btnTextConfirm}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 15 },
  content: { marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  btnCancel: { flex: 1, padding: 12, alignItems: 'center' },
  btnConfirm: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnTextCancel: { color: '#666', fontWeight: '700' },
  btnTextConfirm: { color: '#fff', fontWeight: '700' },
});