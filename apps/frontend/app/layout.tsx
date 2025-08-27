import './globals.css';
import { ChakraProvider, Select } from '@chakra-ui/react';
import type { ReactNode } from 'react';
'use client';
import { useState } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState('en');
  return (
    <html lang={lang}>
      <body>
        <ChakraProvider>
          <Select value={lang} onChange={(e) => setLang(e.target.value)} maxW="120px" m={4}>
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </Select>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );
}
