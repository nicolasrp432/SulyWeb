/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				/* Brand palette — usable as Tailwind classes */
				brand: {
					rose:    '#e91e63',
					'rose-light': '#f8b4c4',
					'rose-dark':  '#c2185b',
					'rose-50':    '#fff1f5',
					'rose-100':   '#ffe4ec',
					'rose-200':   '#ffb3cc',
					gold:         '#d4af37',
					'gold-light': '#f5e6a3',
					'gold-dark':  '#a07d00',
					cream:        '#faf7f2',
					purple:       '#8b5a8c',
					dark:         '#1e1e2e',
					mid:          '#4a4a5a',
				},
				/* Admin panel palette — light rose theme matching public site */
				admin: {
					bg:       '#fdf8fb',
					sidebar:  '#ffffff',
					surface:  '#fff1f5',
					border:   '#ffd6e7',
					text:     '#1e1e2e',
					muted:    '#6b7280',
					rose:     '#e91e63',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				card: 'var(--radius-card)',
				pill: 'var(--radius-pill)',
			},
			boxShadow: {
				'rose-xs': '0 1px 3px rgba(233, 30, 99, 0.06)',
				'rose-sm': '0 4px 12px rgba(233, 30, 99, 0.08)',
				'rose-md': '0 8px 24px rgba(233, 30, 99, 0.12)',
				'rose-lg': '0 20px 48px rgba(233, 30, 99, 0.15)',
				'rose-xl': '0 32px 64px rgba(233, 30, 99, 0.18)',
				'gold-md': '0 8px 24px rgba(212, 175, 55, 0.18)',
				'card':    '0 2px 16px rgba(30, 30, 46, 0.06), 0 1px 4px rgba(30, 30, 46, 0.04)',
				'card-hover': '0 12px 32px rgba(233, 30, 99, 0.12), 0 2px 8px rgba(30, 30, 46, 0.06)',
				'glass':   '0 8px 32px rgba(233, 30, 99, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.45)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'fade-in': {
					from: { opacity: 0 },
					to:   { opacity: 1 },
				},
				'slide-up': {
					from: { opacity: 0, transform: 'translateY(16px)' },
					to:   { opacity: 1, transform: 'translateY(0)' },
				},
				'slide-in-left': {
					from: { opacity: 0, transform: 'translateX(-100%)' },
					to:   { opacity: 1, transform: 'translateX(0)' },
				},
				'slide-out-left': {
					from: { opacity: 1, transform: 'translateX(0)' },
					to:   { opacity: 0, transform: 'translateX(-100%)' },
				},
			},
			animation: {
				'accordion-down':   'accordion-down 0.2s ease-out',
				'accordion-up':     'accordion-up 0.2s ease-out',
				'fade-in':          'fade-in 0.3s ease-out',
				'slide-up':         'slide-up 0.35s ease-out',
				'slide-in-left':    'slide-in-left 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
				'slide-out-left':   'slide-out-left 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
			},
			fontFamily: {
				sans: ['"Montserrat"', 'sans-serif'],
				body: ['"Poppins"', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'monospace'],
			},
			spacing: {
				'18': '4.5rem',
				'22': '5.5rem',
				'26': '6.5rem',
				'30': '7.5rem',
			},
			backgroundImage: {
				'gradient-rose':       'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
				'gradient-rose-gold':  'linear-gradient(135deg, #e91e63 0%, #d4af37 100%)',
				'gradient-hero':       'linear-gradient(160deg, rgba(233,30,99,0.72) 0%, rgba(180,20,75,0.82) 40%, rgba(30,20,40,0.88) 100%)',
				'gradient-card':       'linear-gradient(180deg, transparent 55%, rgba(30,20,40,0.75) 100%)',
				'gradient-cream':      'linear-gradient(160deg, #fff1f5 0%, #fff8f0 100%)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};