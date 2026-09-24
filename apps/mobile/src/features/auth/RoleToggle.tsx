import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Role } from '@opencarbon/api';
import { useTheme } from '@/theme/useTheme';

interface RoleToggleProps {
  value: Role;
  onChange: (role: Role) => void;
}

const options: { value: Role; label: string }[] = [
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'COMPANY', label: 'Entreprise' },
];

export const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.colors.borderInput, borderRadius: theme.radius.sm }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: active ? theme.colors.text : theme.colors.primary, fontFamily: 'Poppins' }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  item: { flex: 1, alignItems: 'center', paddingVertical: 12 },
});
