import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  pointerEvents?: 'auto' | 'none';
};

export function ThemedView({ style, lightColor, darkColor, pointerEvents, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[
    { backgroundColor },
    style,
    { pointerEvents: pointerEvents || 'auto' }
  ]} {...otherProps} />;
}
