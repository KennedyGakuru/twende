
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle,GestureResponderEvent} from 'react-native';
import { cn } from '../../lib/utilis';
import React = require('react');

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  textClassName,
  style,
  testID,
}: ButtonProps) {
  const buttonClasses = cn(
    "flex flex-row items-center justify-center rounded-full",
    size === 'sm' ? 'px-3 py-1.5' : size === 'md' ? 'px-4 py-2' : 'px-6 py-3',
    variant === 'primary' ? 'bg-primary-500' : 
    variant === 'secondary' ? 'bg-secondary-500' : 
    variant === 'outline' ? 'bg-transparent border border-neutral-300' : 
    variant === 'danger' ? 'bg-error-500' : 'bg-transparent',
    (disabled || loading) ? 'opacity-50' : 'active:opacity-80',
    fullWidth ? 'w-full' : 'w-auto',
    className
  );

  const textClasses = cn(
    "font-sans-medium text-center",
    size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg',
    variant === 'primary' || variant === 'secondary' || variant === 'danger' ? 'text-white' : 
    variant === 'outline' ? 'text-neutral-700' : 'text-primary-500',
    textClassName
  );

  return (
    <Pressable
      className={buttonClasses}
      style={style}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' || variant === 'danger' ? 'white' : '#0066ff'} 
          className="mr-2" 
        />
      ) : leadingIcon ? (
        <React.Fragment>
          {leadingIcon}
          <Text className="w-2" />
        </React.Fragment>
      ) : null}
      
      <Text className={textClasses}>
        {children}
      </Text>
      
      {trailingIcon && !loading && (
        <React.Fragment>
          <Text className="w-2" />
          {trailingIcon}
        </React.Fragment>
      )}
    </Pressable>
  );
}