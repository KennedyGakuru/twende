import { useState } from 'react';
import { TextInput, View, Text, Pressable, TextInputProps } from 'react-native';
import { cn } from '../../lib/utilis';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function Input({
  label,
  error,
  secureTextEntry,
  leftIcon,
  rightIcon,
  containerClassName,
  inputClassName,
  labelClassName,
  errorClassName,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View className={cn("mb-4", containerClassName)}>
      {label && (
        <Text className={cn("text-neutral-700 font-sans-medium mb-1", labelClassName)}>
          {label}
        </Text>
      )}
      
      <View className="relative flex flex-row items-center">
        {leftIcon && (
          <View className="absolute left-3 z-10">
            {leftIcon}
          </View>
        )}
        
        <TextInput
          className={cn(
            "w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-neutral-800 font-sans",
            leftIcon ? "pl-10" : "",
            (rightIcon || isPassword) ? "pr-10" : "",
            error ? "border-error-500" : "focus:border-primary-500",
            inputClassName
          )}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          placeholderTextColor="#a3a3a3"
          {...props}
        />
        
        {isPassword ? (
          <Pressable 
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 z-10"
          >
            {showPassword ? 
              <Ionicons name="eye" size={20} color="#737373" /> :
              <Ionicons name="eye-off" size={20} color="#737373"/>
            }
          </Pressable>
        ) : rightIcon ? (
          <View className="absolute right-3 z-10">
            {rightIcon}
          </View>
        ) : null}
      </View>
      
      {error && (
        <Text className={cn("text-error-500 text-xs mt-1", errorClassName)}>
          {error}
        </Text>
      )}
    </View>
  );
}