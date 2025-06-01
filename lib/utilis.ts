import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Platform } from 'react-native';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function getRandomColor(): string {
  const colors = [
    '#0066ff', // primary-500
    '#00ffc0', // secondary-500
    '#ff6600', // accent-500
    '#10b981', // success-500
    '#f59e0b', // warning-500
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function calculateETA(
  distanceInMeters: number, 
  speedInKmh: number = 25, 
  trafficMultiplier: number = 1
): number {
  // Convert distance to km
  const distanceInKm = distanceInMeters / 1000;
  
  // Calculate time in hours, accounting for traffic
  const timeInHours = (distanceInKm / speedInKmh) * trafficMultiplier;
  
  // Convert to minutes
  return Math.round(timeInHours * 60);
}

//greetings
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};