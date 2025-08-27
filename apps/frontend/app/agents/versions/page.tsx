'use client';
import { Box, Button, Heading, HStack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function VersionsPage() {
  const versions = [
    { version: 1, status: 'released', createdAt: '2025-08-01' },
    { version: 2, status: 'draft', createdAt: '2025-08-15' },
  ];
  return (
    <Box p={8}>
      <Heading mb={4}>Agent Versions</Heading>
      <Table variant="simple">
        <Thead>
          <Tr><Th>Version</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></Tr>
        </Thead>
        <Tbody>
          {versions.map(v => (
            <Tr key={v.version}>
              <Td>{v.version}</Td>
              <Td>{v.status}</Td>
              <Td>{v.createdAt}</Td>
              <Td>
                <HStack>
                  <Button size="sm">Diff</Button>
                  <Button size="sm" colorScheme="green">Release</Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
