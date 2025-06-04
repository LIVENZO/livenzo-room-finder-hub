
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#5B3CC4',
					50: '#F3F0FF',
					100: '#E9E5FF',
					200: '#D6CFFF',
					300: '#C2B3FF',
					400: '#A390FF',
					500: '#5B3CC4',
					600: '#4C32A3',
					700: '#3D2882',
					800: '#2E1E61',
					900: '#1F1440',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#A3BFFA',
					50: '#F0F4FF',
					100: '#E6EFFF',
					200: '#D1E2FF',
					300: '#A3BFFA',
					400: '#7BA3F7',
					500: '#5387F4',
					600: '#2B6BF1',
					700: '#1E4FCE',
					800: '#1A3FAB',
					900: '#162F88',
					foreground: '#1F1440'
				},
				accent: {
					DEFAULT: '#F7F9FC',
					50: '#FFFFFF',
					100: '#F7F9FC',
					200: '#EDF2F7',
					300: '#E2E8F0',
					400: '#CBD5E0',
					500: '#A0AEC0',
					600: '#718096',
					700: '#4A5568',
					800: '#2D3748',
					900: '#1A202C',
					foreground: '#4A5568'
				},
				success: {
					DEFAULT: '#10B981',
					foreground: '#FFFFFF'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: '#4C32A3',
					foreground: '#FFFFFF',
					primary: '#5B3CC4',
					'primary-foreground': '#FFFFFF',
					accent: '#3D2882',
					'accent-foreground': '#FFFFFF',
					border: '#2E1E61',
					ring: '#A3BFFA'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(135deg, #5B3CC4 0%, #4C32A3 100%)',
				'gradient-secondary': 'linear-gradient(135deg, #A3BFFA 0%, #7BA3F7 100%)',
				'gradient-accent': 'linear-gradient(135deg, #F7F9FC 0%, #EDF2F7 100%)',
				'gradient-radial': 'radial-gradient(ellipse at center, #F7F9FC 0%, #E2E8F0 100%)',
			},
			borderRadius: {
				lg: '12px',
				md: '8px',
				sm: '6px',
				xl: '16px',
				'2xl': '20px',
			},
			boxShadow: {
				'soft': '0 2px 15px -3px rgba(91, 60, 196, 0.1), 0 4px 6px -2px rgba(91, 60, 196, 0.05)',
				'medium': '0 4px 25px -5px rgba(91, 60, 196, 0.15), 0 10px 10px -5px rgba(91, 60, 196, 0.1)',
				'large': '0 10px 40px -10px rgba(91, 60, 196, 0.2), 0 20px 25px -5px rgba(91, 60, 196, 0.1)',
			},
			keyframes: {
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0px)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'float': 'float 6s ease-in-out infinite',
				'slide-up': 'slide-up 0.5s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
