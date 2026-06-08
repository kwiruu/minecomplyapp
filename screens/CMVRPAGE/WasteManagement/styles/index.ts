import { StyleSheet } from 'react-native';

export const plantPortSectionStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16, // Added horizontal margin
    marginBottom: 20, // Increased from 16
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#BFDBFE',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#02217C',
  },
  content: {
    padding: 24, // Increased from 20
  },
  fieldGroup: {
    marginBottom: 24, // Increased from 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10, // Increased from 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8, // Increased from 6
    fontStyle: 'italic',
  },
  subsectionHeader: {
    marginBottom: 20, // Increased from 16
    marginTop: 8, // Added top margin
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 8, // Added top margin
  },
  addButtonText: {
    fontSize: 14,
    color: '#02217C',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4, // Added margin
    maxWidth: '100%',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  radioChecked: {
    borderColor: '#02217C',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#02217C',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 10, // Increased from 6
  },
  totalValueContainer: {
    paddingVertical: 14, // Increased from 12
    paddingHorizontal: 14, // Increased from 12
    backgroundColor: '#F1F5F9', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#02217C', 
  },
});

export const plantSectionStyles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#02217C',
    borderColor: '#02217C',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  radioSection: {
    marginTop: 12, // Increased from 8
  },
  disabledSection: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#94A3B8',
  },
  tableContent: {
    marginTop: 24, // Increased from 20
    paddingTop: 24, // Increased from 20
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  fieldGroup: {
    marginBottom: 24, // Increased from 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10, // Increased from 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8, // Increased from 6
    fontStyle: 'italic',
  },
  subsectionHeader: {
    marginBottom: 20, // Increased from 16
    marginTop: 8, // Added
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 8, // Added
  },
  addButtonText: {
    fontSize: 14,
    color: '#02217C',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 12,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16, // Added
    marginBottom: 20, // Increased from 16
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#BFDBFE',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#02217C',
  },
  content: {
    padding: 24, // Increased from 20
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  radioChecked: {
    borderColor: '#02217C',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#02217C',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export const PortSectionStyles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16, // Added
    marginBottom: 20, // Increased from 16
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#BFDBFE',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#02217C',
  },
  content: {
    padding: 24, // Increased from 20
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#02217C',
    borderColor: '#02217C',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  radioSection: {
    marginTop: 12, // Increased from 8
  },
  disabledSection: {
    opacity: 0.5,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  radioChecked: {
    borderColor: '#02217C',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#02217C',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
    fontWeight: '500',
  },
  disabledText: {
    color: '#94A3B8',
  },
});

export const QuarrySectionStyles = StyleSheet.create({
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#02217C',
    borderColor: '#02217C',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
  },
  radioSection: {
    marginTop: 12, // Increased from 8
  },
  disabledSection: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#94A3B8',
  },
  tableContent: {
    marginTop: 24, // Increased from 20
    paddingTop: 24, // Increased from 20
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  fieldGroup: {
    marginBottom: 24, // Increased from 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10, // Increased from 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8, // Increased from 6
    fontStyle: 'italic',
  },
  subsectionHeader: {
    marginBottom: 20, // Increased from 16
    marginTop: 8, // Added
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    marginTop: 8, // Added
  },
  addButtonText: {
    fontSize: 14,
    color: '#02217C',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 12,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16, // Added
    marginBottom: 20, // Increased from 16
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#BFDBFE',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#02217C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#02217C',
  },
  content: {
    padding: 24, // Increased from 20
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20, // Increased from 16
    maxWidth: '100%',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  radioChecked: {
    borderColor: '#02217C',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#02217C',
  },
  radioLabel: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export const WasteEntryCardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20, // Increased from 16
    marginBottom: 20, // Increased from 16
    marginHorizontal: 4, // Added slight horizontal margin
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20, // Increased from 16
    paddingBottom: 16, // Increased from 12
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Increased from 10
  },
  badge: {
    backgroundColor: '#02217C',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#02217C',
  },
 deleteButton: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: '#FEE2E2',
  borderRadius: 16,
  padding: 6,
  borderWidth: 1,
  borderColor: '#DC2626',
  zIndex: 10,
  elevation: 2,
},

  fieldGroup: {
    marginBottom: 20, // Increased from 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10, // Increased from 8
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
});

export const pickerSelectStyles = {
  inputIOS: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    color: '#0F172A',
    backgroundColor: 'white',
    paddingRight: 30, 
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    color: '#0F172A',
    backgroundColor: 'white',
    paddingRight: 30, 
  },
  iconContainer: {
    top: 12,
    right: 12,
  },
};
