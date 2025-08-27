'use client';
import { Box, Heading, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';

export default function EvalResultsPage() {
  const rows = [{ id: 'run-1', passed: true, score: 0.92 }];
  return (
    <Box p={8}>
      <Heading mb={4}>Eval Results</Heading>
      <Table>
        <Thead><Tr><Th>Run</Th><Th>Passed</Th><Th>Score</Th></Tr></Thead>
        <Tbody>
          {rows.map(r => (<Tr key={r.id}><Td>{r.id}</Td><Td>{r.passed?'Yes':'No'}</Td><Td>{r.score}</Td></Tr>))}
        </Tbody>
      </Table>
    </Box>
  );
}

