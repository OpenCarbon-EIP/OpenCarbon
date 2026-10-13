import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ROLE_LABELS, type Role } from '@opencarbon/api';
import { useTheme } from '@/theme/useTheme';

interface RoleToggleProps {
  value: Role;
  onChange: (role: Role) => void;
}

const roles: Role[] = ['CONSULTANT', 'COMPANY'];

export const RoleToggle = ({ value, onChange }: RoleToggleProps) => {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.colors.borderInput, borderRadius: theme.radius.sm }]}>
      {roles.map((role) => {
        const active = role === value;
        return (
          <Pressable
            key={role}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(role)}
            style={[styles.item, active && { backgroundColor: theme.colors.primary }]}
          >
            <Text style={{ color: active ? theme.colors.text : theme.colors.primary, fontFamily: 'Poppins' }}>
              {ROLE_LABELS[role]}
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
