'use client';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react';

export default function AnalyticsPage() {
  return (
    <Box p={8}>
      <Heading mb={4}>Analytics</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat><StatLabel>Deflection</StatLabel><StatNumber>35%</StatNumber></Stat>
        <Stat><StatLabel>FCR</StatLabel><StatNumber>65%</StatNumber></Stat>
        <Stat><StatLabel>CSAT</StatLabel><StatNumber>4.3</StatNumber></Stat>
      </SimpleGrid>
    </Box>
  );
}

