'use client';
import { Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function ApiKeysPage() {
  const items = [{ id: 'key-1', name: 'Backend', lastUsedAt: '—' }];
  return (
    <Box p={8}>
      <Heading mb={4}>API Keys</Heading>
      <Button mb={3} size="sm" colorScheme="blue">Create Key</Button>
      <Table>
        <Thead><Tr><Th>Name</Th><Th>Last Used</Th><Th>Action</Th></Tr></Thead>
        <Tbody>
          {items.map(k => (
            <Tr key={k.id}>
              <Td>{k.name}</Td>
              <Td>{k.lastUsedAt}</Td>
              <Td><Button size="sm" colorScheme="red">Revoke</Button></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
