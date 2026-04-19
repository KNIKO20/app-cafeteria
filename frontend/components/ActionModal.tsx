// components/ActionModal.tsx — Modal de confirmación rediseñado
// Usa Animated para entrada/salida suave con scale + fade.

import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, Animated, Pressable,
} from 'react-native';
import { C, radius, shadow } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  confirmColor?: string;
  children?: React.ReactNode;
}

export default function ActionModal({
  visible, title, onClose, onConfirm,
  confirmText = 'Confirmar', confirmColor = C.mid, children,
}: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
        {/* Toca fuera para cerrar */}
        <Pressable style={s.backdropTouch} onPress={onClose} />

        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Franja de color que indica el tipo de acción */}
          <View style={[s.accent, { backgroundColor: confirmColor }]} />

          <View style={s.body}>
            <Text style={s.title}>{title}</Text>

            {children && <View style={s.content}>{children}</View>}

            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={s.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: confirmColor }]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={s.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,51,41,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '84%',
    maxWidth: 360,
    ...shadow.elevated,
  },
  accent: { height: 5 },
  body: { padding: 22 },
  title: {
    fontSize: 17, fontWeight: '800',
    color: C.dark, letterSpacing: -0.2,
    marginBottom: 14,
  },
  content: { marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: radius.sm,
    backgroundColor: C.subtle,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: C.muted, fontSize: 14 },
  confirmBtn: {
    flex: 1.4, paddingVertical: 13,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  confirmText: { fontWeight: '800', color: C.white, fontSize: 14 },
});