export interface FormTypeOption {
  label: string;
  value: string;
  enabled?: boolean;
}

const SELECT_FORM_TYPE_VALUES = new Set(['single_select', 'select']);

export function isSelectFormType(type: string) {
  return SELECT_FORM_TYPE_VALUES.has(type);
}

export function isFormTypeEnabled(type: string, formTypes: FormTypeOption[]) {
  const matched = formTypes.find((item) => item.value === type);
  if (matched) return matched.enabled !== false;

  if (type === 'select') {
    const singleSelect = formTypes.find((item) => item.value === 'single_select');
    return !!singleSelect && singleSelect.enabled !== false;
  }

  if (type === 'single_select') {
    const select = formTypes.find((item) => item.value === 'select');
    return !!select && select.enabled !== false;
  }

  return false;
}
