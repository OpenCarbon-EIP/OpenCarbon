import type { ComponentProps } from 'react';
import { useController, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TextField } from '@/components/TextField';

type TextFieldProps = Omit<ComponentProps<typeof TextField>, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

interface FormTextFieldProps<T extends FieldValues> extends TextFieldProps {
  control: Control<T>;
  name: Path<T>;
  /** Valeur du formulaire → texte affiché (défaut : String, vide si absente). */
  format?: (value: unknown) => string;
  /** Texte saisi → valeur du formulaire (défaut : le texte tel quel). */
  parse?: (text: string) => unknown;
}

const defaultFormat = (value: unknown) => (value == null ? '' : String(value));

/** TextField branché sur react-hook-form : valeur, blur et message d'erreur du champ. */
export const FormTextField = <T extends FieldValues>({
  control,
  name,
  format = defaultFormat,
  parse,
  ...rest
}: FormTextFieldProps<T>) => {
  const { field, fieldState } = useController({ control, name });
  return (
    <TextField
      {...rest}
      value={format(field.value)}
      onChangeText={(text) => field.onChange(parse ? parse(text) : text)}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  );
};
