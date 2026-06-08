import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#02217C',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
    paddingRight: 12,
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  radioLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
    marginLeft: 8,
  },
});
